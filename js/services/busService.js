// js/services/busService.js
// startSharing, stopSharing, listenForAllBuses, Firebase Realtime logic

import { db } from "../config/firebase.js";
import { routePaths } from "../constants/routes.js";
import { getDistanceInMeters, formatTimeAgo } from "../utils/helpers.js";
import { map, busIcon } from "../map/mapInit.js";
import {
  snapToRoute,
  updateRemainingRoute,
  drawRoadRoute,
  clearUserRoute,
} from "../map/routeSnapper.js";
import { showNotification, updateUI, clearMsgBtnHighlight } from "../ui/uiManager.js";
import {
  ref,
  set,
  update,
  onValue,
  remove,
  onDisconnect,
  runTransaction,
  get,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Session/শেয়ারিং state (আগে এগুলো top-level let ভ্যারিয়েবল ছিল, এখন একটি অবজেক্টে) ---
export const state = {
  mySessionId: localStorage.getItem("uiuBusSessionId"),
  watchId: null,
  currentUserPosition: null,
  isFirstLocationUpdate: true,
  currentDriverMsg: null,
  wakeLock: null,
};

const busMarkers = {};
const routePolylines = {};
const busPolylines = {};
const busPathHistory = {};

function resetDriverMsg() {
  state.currentDriverMsg = null;
}

// --- Driver message বাটন (HTML থেকে onclick="setDriverMsg(...)" কল হয়, তাই window এ রাখা লাগবে) ---
window.setDriverMsg = function (msg) {
  state.currentDriverMsg = msg;
  clearMsgBtnHighlight();
  if (msg) {
    document.querySelectorAll(".msg-btn").forEach((btn) => {
      if (btn.getAttribute("onclick")?.includes(msg)) btn.classList.add("active");
    });
  }
  if (db && state.mySessionId) {
    update(ref(db, "buses/" + state.mySessionId), { msg: msg || null });
  }
  showNotification(msg ? `Status: ${msg}` : "Status cleared", "success");
};

// --- Fake bus report (HTML popup বাটন থেকে onclick="reportFakeBus(...)" কল হয়) ---
window.reportFakeBus = function (sessionIdsJson) {
  if (!db) return;
  const sessionIds = JSON.parse(decodeURIComponent(sessionIdsJson));
  if (!confirm("Are you sure this bus location is fake?")) return;

  const alreadyReportedKey = "reportedBuses";
  let reportedBuses = {};
  try {
    reportedBuses = JSON.parse(localStorage.getItem(alreadyReportedKey)) || {};
  } catch (e) {}

  let anyNewReport = false;
  sessionIds.forEach((id) => {
    if (reportedBuses[id]) return;
    const reportedByRef = ref(
      db,
      `buses/${id}/reportedBy/${state.mySessionId || "anonymous"}`,
    );
    get(reportedByRef).then((snap) => {
      if (snap.exists()) {
        showNotification("You already reported this bus.", "error");
        return;
      }
      set(reportedByRef, true).then(() => {
        runTransaction(ref(db, `buses/${id}/reports`), (n) => (n || 0) + 1);
      });
    });
    reportedBuses[id] = true;
    anyNewReport = true;
  });

  if (anyNewReport) {
    localStorage.setItem(alreadyReportedKey, JSON.stringify(reportedBuses));
    showNotification("Report submitted!", "error");
  } else {
    showNotification("You already reported this bus.", "error");
  }
};

export function startSharing() {
  const fromSelect = document.getElementById("fromSelect");
  const toSelect = document.getElementById("toSelect");

  if (!db) return showNotification("Firebase config missing!", "error");
  if (!fromSelect.value)
    return showNotification("Please select starting point!", "error");
  if (fromSelect.value === "UIU" && !toSelect.value)
    return showNotification("Please select a destination!", "error");
  if (!navigator.geolocation)
    return showNotification("Geolocation not supported.", "error");

  if (!state.mySessionId) {
    state.mySessionId = "user_" + Date.now();
    localStorage.setItem("uiuBusSessionId", state.mySessionId);
  }

  const fromLocation = fromSelect.value;
  const toLocation = toSelect.value || "UIU";
  localStorage.setItem(
    "sharingRoute",
    JSON.stringify({ from: fromLocation, to: toLocation }),
  );

  const myBusRef = ref(db, "buses/" + state.mySessionId);
  state.isFirstLocationUpdate = true;
  onDisconnect(myBusRef).remove();

  state.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed } = position.coords;
      state.currentUserPosition = [latitude, longitude];
      let currentSpeed = speed && speed > 0 ? Math.round(speed * 3.6) : 0;

      if (state.isFirstLocationUpdate) {
        map.setView(state.currentUserPosition, 16);
        state.isFirstLocationUpdate = false;
      }

      const routeKey = `${fromLocation}__${toLocation}`;
      const snapped = snapToRoute(latitude, longitude, routeKey);

      updateRemainingRoute(snapped.lat, snapped.lng);

      set(myBusRef, {
        lat: snapped.lat,
        lng: snapped.lng,
        timestamp: Date.now(),
        from: fromLocation,
        to: toLocation,
        speed: currentSpeed,
        reports: 0,
        msg: state.currentDriverMsg || null,
      });
    },
    (error) => {
      if (error.code === 1) {
        showNotification("Please enable location access.", "error");
        stopSharing(false);
      }
    },
    { enableHighAccuracy: true },
  );

  if ("wakeLock" in navigator) {
    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        state.wakeLock = lock;
      })
      .catch(() => {});
  }

  drawRoadRoute(fromLocation, toLocation);
  updateUI(true, resetDriverMsg);
  showNotification("Location sharing started!", "success");
}

export function stopSharing(clearSession = true) {
  if (state.watchId) navigator.geolocation.clearWatch(state.watchId);
  if (db && state.mySessionId) remove(ref(db, "buses/" + state.mySessionId));

  if (clearSession) {
    localStorage.removeItem("uiuBusSessionId");
    localStorage.removeItem("sharingRoute");
    state.mySessionId = null;
  }
  state.watchId = null;
  state.currentUserPosition = null;

  clearUserRoute();

  if (state.wakeLock) {
    state.wakeLock.release();
    state.wakeLock = null;
  }
  updateUI(false, resetDriverMsg);
  showNotification("Location sharing stopped.", "error");
}

function updateEtaAndRoute(groupId) {
  if (routePolylines[groupId]) return;
  const path = routePaths[groupId];
  if (!path) return;

  routePolylines[groupId] = L.polyline(path, {
    // 👈 সরাসরি হার্ডকোডেড path
    color: "#007bff",
    weight: 5,
    opacity: 0.75,
    lineJoin: "round",
    lineCap: "round",
  }).addTo(map);
}

export function listenForAllBuses() {
  if (!db) return;
  const busesRef = ref(db, "buses");
  onValue(busesRef, (snapshot) => {
    const busesData = snapshot.val() || {};
    const TEN_MINUTES_AGO = Date.now() - 10 * 60 * 1000;
    const busGroups = [];
    const routeGroupMap = {};

    Object.keys(busesData).forEach((sessionId) => {
      const bus = busesData[sessionId];
      if (!bus.timestamp || bus.timestamp < TEN_MINUTES_AGO) return;
      if (bus.reports && bus.reports >= 3) {
        if (sessionId === state.mySessionId) {
          stopSharing(true);
          alert("Your sharing was stopped due to fake reports.");
        }
        return;
      }

      bus.id = sessionId;
      const groupId = `${bus.from}__${bus.to}`;

      if (routeGroupMap[groupId]) {
        const group = routeGroupMap[groupId];
        group.users.push(bus);
        const n = group.users.length;
        group.lat = group.lat + (bus.lat - group.lat) / n;
        group.lng = group.lng + (bus.lng - group.lng) / n;
        if ((bus.speed || 0) > group.maxSpeed) group.maxSpeed = bus.speed;
        if (bus.timestamp > group.latestTimestamp) {
          group.latestTimestamp = bus.timestamp;
          group.latestMsg = bus.msg || null;
        }
      } else {
        routeGroupMap[groupId] = {
          groupId,
          from: bus.from,
          to: bus.to,
          lat: bus.lat,
          lng: bus.lng,
          maxSpeed: bus.speed || 0,
          latestTimestamp: bus.timestamp,
          latestMsg: bus.msg || null,
          users: [bus],
        };
        busGroups.push(routeGroupMap[groupId]);
      }
    });

    const activeGroupIds = {};
    busGroups.forEach((group) => {
      const groupId = group.groupId;
      activeGroupIds[groupId] = true;

      const position = [group.lat, group.lng];
      const speedDisplay =
        group.maxSpeed > 0 ? `${group.maxSpeed} km/h` : "0 km/h";
      const trackerCount = group.users.length;
      const groupSessionIds = encodeURIComponent(
        JSON.stringify(group.users.map((u) => u.id)),
      );

      const msgHtml = group.latestMsg
        ? `<div style="margin:6px 0;padding:5px 8px;background:#fff3cd;border-left:3px solid #ffc107;border-radius:4px;font-size:12px;">📢 ${group.latestMsg}</div>`
        : "";

      const popupContent = `
                <b>Route:</b> ${group.from} → ${group.to}<br>
                <b>Speed:</b> ${speedDisplay}<br>
                <b>Trackers:</b> ${trackerCount} Student(s) 👥<br>
                <b>Updated:</b> ${formatTimeAgo(group.latestTimestamp)}
                ${msgHtml}
                <button class="report-btn" onclick="reportFakeBus('${groupSessionIds}')">Report Fake 🚫</button>
            `;

      if (busMarkers[groupId]) {
        busMarkers[groupId].setLatLng(position);
        busMarkers[groupId].setPopupContent(popupContent);
      } else {
        busMarkers[groupId] = L.marker(position, { icon: busIcon })
          .addTo(map)
          .bindPopup(popupContent);
      }
      busMarkers[groupId].toFront();

      if (!busPathHistory[groupId]) busPathHistory[groupId] = [];
      const lastPt =
        busPathHistory[groupId][busPathHistory[groupId].length - 1];
      const moved =
        !lastPt || lastPt[0] !== group.lat || lastPt[1] !== group.lng;
      if (moved) {
        busPathHistory[groupId].push([group.lat, group.lng]);
        if (busPathHistory[groupId].length > 50)
          busPathHistory[groupId].shift();
      }
      if (busPathHistory[groupId].length > 1) {
        if (busPolylines[groupId]) {
          busPolylines[groupId].setLatLngs(busPathHistory[groupId]);
        } else {
          busPolylines[groupId] = L.polyline(busPathHistory[groupId], {
            color: "#f97316",
            weight: 3,
            opacity: 0.6,
            dashArray: "8, 10",
            lineJoin: "round",
            lineCap: "round",
          }).addTo(map);
        }
      }

      updateEtaAndRoute(groupId);
    });

    // Cleanup inactive groups
    Object.keys(busMarkers).forEach((groupId) => {
      if (!activeGroupIds[groupId]) {
        map.removeLayer(busMarkers[groupId]);
        delete busMarkers[groupId];
        if (routePolylines[groupId]) {
          map.removeLayer(routePolylines[groupId]);
          delete routePolylines[groupId];
        }
        if (busPolylines[groupId]) {
          map.removeLayer(busPolylines[groupId]);
          delete busPolylines[groupId];
          delete busPathHistory[groupId];
        }
      }
    });
  });
}

export function loadAdminMessages() {
  if (!db) return;
  const messageList = document.getElementById("messageList");
  const messagesRef = ref(db, "messages");
  onValue(messagesRef, (snapshot) => {
    messageList.innerHTML = "";
    const messages = snapshot.val();
    if (messages) {
      Object.values(messages)
        .reverse()
        .forEach((msg) => {
          const msgDate = new Date(msg.timestamp).toLocaleString();
          const msgElement = document.createElement("div");
          msgElement.className = "message-item";
          const p = document.createElement("p");
          p.textContent = msg.message;
          const small = document.createElement("small");
          small.textContent = msgDate;
          msgElement.appendChild(p);
          msgElement.appendChild(small);
          messageList.appendChild(msgElement);
        });
    } else {
      messageList.innerHTML = "<p style='padding:10px;'>No messages yet.</p>";
    }
  });
}
