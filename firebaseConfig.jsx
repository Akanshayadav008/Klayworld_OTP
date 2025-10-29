// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHHD78vbAxz_VhcbwewRrB5IByYOXHBEU",
  authDomain: "glossy-precinct-447718-e0.firebaseapp.com",
  projectId: "glossy-precinct-447718-e0",
  storageBucket: "glossy-precinct-447718-e0.firebasestorage.app",
  messagingSenderId: "690031852003",
  appId: "1:690031852003:web:59cab1d3032c0f088548d6",
  measurementId: "G-1X4DBZ5VHJ"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app); // ✅ DO THIS!
const db = getFirestore(app);

export { auth, db, app };
