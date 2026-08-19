// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

// Firestore
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCUGPCh4aNXMgIdsJcxQC0eoELipn0Fkb0",
  authDomain: "uskut-14953.firebaseapp.com",
  projectId: "uskut-14953",
  storageBucket: "uskut-14953.firebasestorage.app",
  messagingSenderId: "1093473155005",
  appId: "1:1093473155005:web:75256dbb16e6cd710d84d4",
  measurementId: "G-EPEXLENQKJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db =
  getFirestore(app);

// Initialize Authentication
export const auth =
  getAuth(app);

export default app;