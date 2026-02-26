// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

/*
  Assumptions about Firestore structure:
  - Collection: "registrations"
    Each registration document should contain at least:
      { tournamentId, teamName, leaderEmail, status } 
    We'll add: teamId, createdAt, approvedAt, rejectedReason
*/

// ---------- Helper: email transport (nodemailer) ----------
const smtpConfig = functions.config().smtp || {};
const ADMIN_EMAIL = functions.config().admin?.email || "";
if (!smtpConfig.user || !smtpConfig.pass || !smtpConfig.host || !ADMIN_EMAIL) {
  console.warn("SMTP or admin email config missing. Emails will fail until configured.");
}

const transporter = nodemailer.createTransport({
  host: smtpConfig.host || "smtp.example.com",
  port: parseInt(smtpConfig.port || "587", 10),
  secure: smtpConfig.secure === "true" || false,
  auth: {
    user: smtpConfig.user || "",
    pass: smtpConfig.pass || "",
  },
});

/** sendMail helper */
async function sendMail({ to, subject, html }) {
  if (!transporter.options.auth.user) {
    console.warn("Email not sent (SMTP not configured):", subject, "->", to);
    return;
  }
  try {
    await transporter.sendMail({
      from: smtpConfig.from || smtpConfig.user,
      to,
      subject,
      html,
    });
    console.log("Email sent:", subject, "->", to);
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

// ---------- Helper: generate a short unique team id ----------
function generateTeamId(tournamentId) {
  // e.g. T123-5g7k2z
  const suffix = Date.now().toString(36).slice(-6);
  return `${tournamentId}-${suffix}`;
}

// ---------- Trigger: onCreate registration ----------
exports.onRegistrationCreate = functions.firestore
  .document("registrations/{regId}")
  .onCreate(async (snap, ctx) => {
    const data = snap.data();
    const regId = ctx.params.regId;
    if (!data) return null;

    const tournamentId = data.tournamentId || "T0";
    const leaderEmail = data.leaderEmail || data.email || "";
    const teamName = data.teamName || "Team";

    // 1) enforce 50-team limit for this tournament
    const teamsQuery = db
      .collection("registrations")
      .where("tournamentId", "==", tournamentId)
      .where("status", "in", ["approved","pending","registered"]) // count considered statuses
      .select(); // minimal payload
    const teamsSnapshot = await teamsQuery.get();
    const currentCount = teamsSnapshot.size;

    // If full, update doc status to 'rejected' and inform user + admin
    if (currentCount >= 50) {
      await snap.ref.update({
        status: "rejected",
        rejectedReason: "Tournament full (50 teams limit reached)",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // email registrant
      if (leaderEmail) {
        await sendMail({
          to: leaderEmail,
          subject: `Registration rejected — ${teamName}`,
          html: `<p>Hi,</p>
                 <p>Your registration for tournament <strong>${tournamentId}</strong> with team <strong>${teamName}</strong> could not be accepted because the tournament already has 50 teams registered.</p>
                 <p>If you think this is an error, contact the admin.</p>`,
        });
      }

      // email admin
      if (ADMIN_EMAIL) {
        await sendMail({
          to: ADMIN_EMAIL,
          subject: `Registration auto-rejected (full) — ${teamName} (${tournamentId})`,
          html: `<p>Registration ${regId} auto-rejected — tournament reached team limit (50).</p>
                 <p>Team: ${teamName}<br/>Leader: ${leaderEmail}</p>`,
        });
      }

      return null;
    }

    // 2) generate teamId and set default status if not present
    const teamId = generateTeamId(tournamentId);
    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    const updatedFields = {
      teamId,
      status: data.status || "pending",
      createdAt,
      updatedAt: createdAt,
    };

    await snap.ref.update(updatedFields);

    // 3) notify admin about new registration
    if (ADMIN_EMAIL) {
      await sendMail({
        to: ADMIN_EMAIL,
        subject: `New registration: ${teamName} (${tournamentId})`,
        html: `<p>New registration received.</p>
               <ul>
                 <li>Team: ${teamName}</li>
                 <li>Tournament: ${tournamentId}</li>
                 <li>Leader: ${leaderEmail}</li>
                 <li>Team ID: ${teamId}</li>
                 <li>Document ID: ${regId}</li>
               </ul>
               <p>Review & approve from admin panel.</p>`,
      });
    }

    // 4) notify registrant that registration was received
    if (leaderEmail) {
      await sendMail({
        to: leaderEmail,
        subject: `Registration received — ${teamName}`,
        html: `<p>Hi,</p>
               <p>Your registration (${teamName}) for tournament <strong>${tournamentId}</strong> has been received and is pending admin approval.</p>
               <p>Your team ID: <strong>${teamId}</strong></p>`,
      });
    }

    return null;
  });

// ---------- Trigger: onUpdate registration (status changed) ----------
exports.onRegistrationUpdate = functions.firestore
  .document("registrations/{regId}")
  .onUpdate(async (change, ctx) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const regId = ctx.params.regId;

    // only act if status changed
    const beforeStatus = before.status || "";
    const afterStatus = after.status || "";

    if (beforeStatus === afterStatus) {
      return null;
    }

    const leaderEmail = after.leaderEmail || after.email || "";
    const teamName = after.teamName || "Team";
    const tournamentId = after.tournamentId || "T0";

    if (afterStatus === "approved") {
      // mark approvedAt
      await change.after.ref.update({
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // send email to registrant
      if (leaderEmail) {
        await sendMail({
          to: leaderEmail,
          subject: `Registration approved — ${teamName}`,
          html: `<p>Congrats! Your registration for <strong>${tournamentId}</strong> has been approved.</p>
                 <p>Team: ${teamName}<br/>Team ID: ${after.teamId || "N/A"}</p>`,
        });
      }

      // (optional) notify admin a registrant approved
      if (ADMIN_EMAIL) {
        await sendMail({
          to: ADMIN_EMAIL,
          subject: `Registration approved — ${teamName}`,
          html: `<p>Registration ${regId} approved.</p>
                 <p>Team: ${teamName}<br/>Tournament: ${tournamentId}</p>`,
        });
      }
    } else if (afterStatus === "rejected") {
      // send rejection email with reason if any
      const reason = after.rejectedReason || "No reason provided";
      if (leaderEmail) {
        await sendMail({
          to: leaderEmail,
          subject: `Registration rejected — ${teamName}`,
          html: `<p>We're sorry. Your registration for <strong>${tournamentId}</strong> was rejected.</p>
                 <p>Reason: ${reason}</p>`,
        });
      }
    } else {
      // other statuses (e.g., 'pending', 'registered') — you can extend as needed
      console.log(`Status changed ${beforeStatus} -> ${afterStatus} for ${regId}`);
    }

    return null;
  });

// ---------- Optional HTTP admin endpoint to list pending registrations ----------
// (secured only by Firebase Auth or some token in real app; here basic demo)
exports.listPendingRegistrations = functions.https.onCall(async (data, context) => {
  // You should check context.auth && user claims in production
  const snapshot = await db.collection("registrations")
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const regs = [];
  snapshot.forEach(doc => {
    regs.push({ id: doc.id, ...doc.data() });
  });
  return { count: regs.length, registrations: regs };
});

