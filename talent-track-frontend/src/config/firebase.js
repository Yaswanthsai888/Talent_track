import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDrnfSyO4E7e85ZlwCgDJfpZ4JY511A9cM",
  authDomain: "pac-talent-track.firebaseapp.com",
  projectId: "pac-talent-track",
  storageBucket: "pac-talent-track.firebasestorage.app",
  messagingSenderId: "159231437865",
  appId: "1:159231437865:web:c4e2a59058e068b0210038",
  measurementId: "G-ZCTGEL2LKC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
