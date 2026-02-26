import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAlO3ciDmapDGvcjTC15mNErAGEPXts0Hk",
  authDomain: "esports-website-46022.firebaseapp.com",
  projectId: "esports-website-46022",
  storageBucket: "esports-website-46022.firebasestorage.app",
  messagingSenderId: "28675186214",
  appId: "1:28675186214:web:8cdd8e1855ecc1f32ad0e7"
};

const app = initializeApp(firebaseConfig);

// 👇 THIS IS THE KEY
window.auth = getAuth(app);
window.db = getFirestore(app);