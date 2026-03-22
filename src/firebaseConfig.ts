// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAT7YSh4YYJiMDc6CS4g-DjjEsC3rnFUW4",
  authDomain: "agri-link-c8a99.firebaseapp.com",
  projectId: "agri-link-c8a99",
  storageBucket: "agri-link-c8a99.appspot.com", // fixed typo from `.app` to `.appspot.com`
  messagingSenderId: "389347126806",
  appId: "1:389347126806:web:bd2f705a8df2bfd5d50f37",
  measurementId: "G-VRSN13N3TT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // 🔥 Firestore instance

export { auth, db };
