
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxdrQ2bJn5cMKTqVGrVYIGhgBzLskxvJU",
  authDomain: "certificados-ba373.firebaseapp.com",
  projectId: "certificados-ba373",
  storageBucket: "certificados-ba373.firebasestorage.app",
  messagingSenderId: "872706710712",
  appId: "1:872706710712:web:aa5fc9e24f21fa7414e84d"
};

// Initialize Firebase
// Check if apps are already initialized to prevent errors in hot-reload environments
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
