// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "insanehub-c8e7f.firebaseapp.com",
  projectId: "insanehub-c8e7f",
  storageBucket: "insanehub-c8e7f.appspot.com",
  messagingSenderId: "910085800609",
  appId: "1:910085800609:web:2484c4d68f7ecdcf2a66e0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
