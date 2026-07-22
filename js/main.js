// js/main.js
// প্রধান ফাইল — সব মডিউল কানেক্ট করা এবং ইভেন্ট লিসেনার সেট করা

import { db, auth } from "./config/firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import { locations } from "./constants/routes.js";
import { map, initDarkMode } from "./map/mapInit.js";
import {
  populateDropdowns,
  handleFromChange,
  showNotification,
} from "./ui/uiManager.js";
import {
  startSharing,
  stopSharing,
  listenForAllBuses,
  loadAdminMessages,
  state,
} from "./services/busService.js";

// --- DOM Elements ---
const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const menuBtn = document.getElementById("menuBtn");
const subMenuBtn = document.getElementById("subMenuBtn");

const userProfileBtn = document.getElementById("userProfileBtn");
const recenterBtn = document.getElementById("recenterBtn");
const scheduleBtn = document.getElementById("scheduleBtn");

const menuModal = document.getElementById("menuModal");
const adminModal = document.getElementById("adminModal");
const scheduleModal = document.getElementById("scheduleModal");
const userProfileModal = document.getElementById("userProfileModal");

const closeModalBtn = document.getElementById("closeModal");
const closeAdminModalBtn = document.getElementById("closeAdminModal");
const closeScheduleModalBtn = document.getElementById("closeScheduleModal");

const sendFeedbackBtn = document.getElementById("sendFeedbackBtn");
const feedbackText = document.getElementById("feedbackText");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const viewMessagesBtn = document.getElementById("viewMessagesBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const logoutSection = document.getElementById("logoutSection");

// --- Init ---
initDarkMode();
populateDropdowns(locations);
fromSelect.addEventListener("change", handleFromChange);
handleFromChange();

// --- Event Listeners ---
startBtn.addEventListener("click", startSharing);
stopBtn.addEventListener("click", () => stopSharing(true));
recenterBtn.addEventListener("click", () => {
  if (state.currentUserPosition) map.setView(state.currentUserPosition, 16);
});

subMenuBtn.addEventListener("click", () => {
  menuModal.classList.toggle("hidden");
  menuBtn.classList.toggle("hidden");
});

menuBtn.addEventListener("click", () => {
  menuModal.classList.toggle("hidden");
  menuBtn.classList.toggle("hidden");
});

map.on("click", () => {
  menuModal.classList.add("hidden");
  userProfileModal.classList.add("hidden");
  scheduleModal.classList.add("hidden");
  adminModal.classList.add("hidden");
});

userProfileBtn.addEventListener("click", () => {
  menuModal.classList.add("hidden");
  userProfileModal.classList.toggle("hidden");
  menuBtn.classList.toggle("hidden");
});
closeModalBtn.addEventListener("click", () =>
  userProfileModal.classList.add("hidden"),
);
closeAdminModalBtn.addEventListener("click", () =>
  adminModal.classList.add("hidden"),
);

scheduleBtn.addEventListener("click", () => {
  menuModal.classList.add("hidden");
  scheduleModal.classList.toggle("hidden");
  menuBtn.classList.toggle("hidden");
});
closeScheduleModalBtn.addEventListener("click", () =>
  scheduleModal.classList.add("hidden"),
);

sendFeedbackBtn.addEventListener("click", () => {
  if (!db) return showNotification("Firebase not configured", "error");
  const message = feedbackText.value.trim();
  if (message.length < 5)
    return showNotification("Please write a longer message.", "error");
  set(ref(db, "messages/" + Date.now()), {
    message: message,
    timestamp: new Date().toISOString(),
  })
    .then(() => {
      feedbackText.value = "";
      showNotification("Feedback sent!", "success");
      userProfileModal.classList.add("hidden");
    })
    .catch((error) => showNotification("Error: " + error.message, "error"));
});

adminLoginBtn.addEventListener("click", () => {
  if (!auth) return showNotification("Auth not configured", "error");
  const email = adminEmail.value.trim();
  const password = adminPassword.value;
  if (!email || !password)
    return showNotification("Fill up credentials!", "error");
  signInWithEmailAndPassword(auth, email, password)
    .then(() => showNotification("Admin Login Success!", "success"))
    .catch((error) =>
      showNotification("Login Failed: " + error.message, "error"),
    );
});

logoutBtn.addEventListener("click", () => {
  if (auth)
    signOut(auth).then(() => showNotification("Logged out.", "success"));
});

viewMessagesBtn.addEventListener("click", () => {
  userProfileModal.classList.add("hidden");
  adminModal.classList.remove("hidden");
  loadAdminMessages();
});

if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginForm.classList.add("hidden");
      logoutSection.classList.remove("hidden");
    } else {
      loginForm.classList.remove("hidden");
      logoutSection.classList.add("hidden");
      adminModal.classList.add("hidden");
    }
  });
}

listenForAllBuses();

// --- Location Share Prompt & Controls Elements ---
const sharePrompt = document.getElementById("sharePrompt");
const controls = document.getElementById("mainControls");
const promptYesBtn = document.getElementById("promptYesBtn");
const promptNoBtn = document.getElementById("promptNoBtn");

if (promptYesBtn && promptNoBtn) {
  promptYesBtn.addEventListener("click", () => {
    if (sharePrompt) sharePrompt.classList.add("hidden");
    if (controls) controls.classList.remove("hidden");
  });
  promptNoBtn.addEventListener("click", () => {
    if (sharePrompt) sharePrompt.classList.add("hidden");
  });
}

// --- Auto-Resume previous session on page reload ---
if (state.mySessionId) {
  try {
    const routeInfo = JSON.parse(localStorage.getItem("sharingRoute"));
    if (routeInfo && routeInfo.from && routeInfo.to) {
      fromSelect.value = routeInfo.from;
      handleFromChange();
      toSelect.value = routeInfo.to;

      const resume = confirm(
        `আপনার আগের session চলছিল (${routeInfo.from} → ${routeInfo.to})। লোকেশন শেয়ারিং আবার শুরু করবেন?`,
      );
      if (resume) {
        // ✅ রিফ্রেশ দেওয়ার পর 'OK' চাপলে প্রম্পট লুকিয়ে মেইন কন্ট্রোল বক্স দেখাবে
        if (sharePrompt) sharePrompt.classList.add("hidden");
        if (controls) controls.classList.remove("hidden");

        startSharing();
      } else {
        localStorage.removeItem("uiuBusSessionId");
        localStorage.removeItem("sharingRoute");
        state.mySessionId = null;
      }
    } else {
      localStorage.removeItem("uiuBusSessionId");
      localStorage.removeItem("sharingRoute");
    }
  } catch (e) {
    localStorage.removeItem("uiuBusSessionId");
    localStorage.removeItem("sharingRoute");
  }
}
