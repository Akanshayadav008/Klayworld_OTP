import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHHD78vbAxz_VhcbwewRrB5IByYOXHBEU",
  authDomain: "glossy-precinct-447718-e0.firebaseapp.com",
  projectId: "glossy-precinct-447718-e0",
  storageBucket: "glossy-precinct-447718-e0.firebasestorage.app",
  messagingSenderId: "690031852003",
  appId: "1:690031852003:web:59cab1d3032c0f088548d6",
  measurementId: "G-1X4DBZ5VHJ"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Authentication

export { db, auth };