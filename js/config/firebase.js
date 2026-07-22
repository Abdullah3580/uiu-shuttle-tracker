// js/config/firebase.js
// ফায়ারবেস কনফিগারেশন ও ইনিশিয়ালাইজেশন

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPuc06Txuyz8BKwmQmSVpKqiByfrMok8c",
  authDomain: "uiu-shuttle-tracker-43216.firebaseapp.com",
  databaseURL:
    "https://uiu-shuttle-tracker-43216-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "uiu-shuttle-tracker-43216",
  storageBucket: "uiu-shuttle-tracker-43216.firebasestorage.app",
  messagingSenderId: "679422838083",
  appId: "1:679422838083:web:fb7790de62030c7855dbf6",
  measurementId: "G-4C26CSN4YV",
};

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase Initialization Failed!", e);
}

export { app, db, auth };
