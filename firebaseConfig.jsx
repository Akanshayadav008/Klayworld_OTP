// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { db };