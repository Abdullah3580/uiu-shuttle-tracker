import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  remove,
  onDisconnect,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Real-World Coordinates for Dhaka / UIU Routes ---
const locations = {
  UIU: { lat: 23.797347, lng: 90.450247 },
  "Natun Bazar": { lat: 23.7974, lng: 90.423 },
  Kuril: { lat: 23.821548, lng: 90.419788 },
};

// --- Fixed Route Polyline Coordinates ---
const routePaths = {
  "UIU__Natun Bazar": [
    [23.797325, 90.450242],
    [23.797104, 90.449373],
    [23.797388, 90.449308],
    [23.797585, 90.449266],
    [23.797815, 90.449207],
    [23.797968, 90.449174],
    [23.798134, 90.449137],
    [23.798287, 90.44911],
    [23.798512, 90.449051],
    [23.798709, 90.449008],
    [23.798885, 90.44897],
    [23.799082, 90.448922],
    [23.799249, 90.44889],
    [23.799415, 90.448858],
    [23.799543, 90.448826],
    [23.799656, 90.448804],
    [23.799793, 90.448777],
    [23.799882, 90.448761],
    [23.8, 90.448718],
    [23.800122, 90.448681],
    [23.80024, 90.448643],
    [23.80023, 90.448568],
    [23.800216, 90.448471],
    [23.800191, 90.4483],
    [23.800152, 90.448058],
    [23.800122, 90.447833],
    [23.800093, 90.447586],
    [23.800049, 90.447265],
    [23.800009, 90.447002],
    [23.79997, 90.446706],
    [23.799926, 90.446438],
    [23.799906, 90.446234],
    [23.799872, 90.445993],
    [23.799852, 90.445805],
    [23.799828, 90.44558],
    [23.799813, 90.445376],
    [23.799774, 90.445183],
    [23.799754, 90.444882],
    [23.79972, 90.444625],
    [23.799685, 90.444303],
    [23.799651, 90.444035],
    [23.799631, 90.443772],
    [23.799582, 90.443509],
    [23.799558, 90.443283],
    [23.799528, 90.442962],
    [23.799479, 90.442543],
    [23.79942, 90.442173],
    [23.799376, 90.441835],
    [23.799332, 90.441497],
    [23.799293, 90.441191],
    [23.799239, 90.440772],
    [23.799185, 90.440381],
    [23.799141, 90.440017],
    [23.799092, 90.43962],
    [23.799057, 90.439261],
    [23.799023, 90.438923],
    [23.798974, 90.43859],
    [23.798939, 90.438215],
    [23.798895, 90.437936],
    [23.798871, 90.43756],
    [23.798846, 90.437244],
    [23.798826, 90.436981],
    [23.798797, 90.436745],
    [23.798772, 90.436503],
    [23.798758, 90.436235],
    [23.798748, 90.436047],
    [23.798738, 90.435832],
    [23.798709, 90.435623],
    [23.798699, 90.435344],
    [23.79866, 90.435092],
    [23.79863, 90.434824],
    [23.798615, 90.434615],
    [23.798606, 90.434353],
    [23.798576, 90.434025],
    [23.798571, 90.433735],
    [23.798566, 90.43351],
    [23.798571, 90.433328],
    [23.798576, 90.433156],
    [23.798576, 90.433],
    [23.798586, 90.432796],
    [23.798581, 90.432711],
    [23.798586, 90.432571],
    [23.798571, 90.432308],
    [23.798547, 90.431997],
    [23.798473, 90.431654],
    [23.798444, 90.431364],
    [23.798444, 90.431203],
    [23.798399, 90.430951],
    [23.79838, 90.430742],
    [23.79835, 90.430436],
    [23.798331, 90.430248],
    [23.798311, 90.430039],
    [23.798306, 90.429782],
    [23.798287, 90.429567],
    [23.798282, 90.42938],
    [23.798247, 90.429128],
    [23.798242, 90.428978],
    [23.798233, 90.428817],
    [23.798223, 90.428634],
    [23.798179, 90.428425],
    [23.798169, 90.428296],
    [23.798164, 90.428103],
    [23.798154, 90.427904],
    [23.79812, 90.427647],
    [23.79811, 90.427427],
    [23.798105, 90.427191],
    [23.7981, 90.427041],
    [23.79808, 90.426805],
    [23.798071, 90.426671],
    [23.798046, 90.426424],
    [23.798046, 90.426204],
    [23.798036, 90.426027],
    [23.798022, 90.425882],
    [23.797987, 90.425608],
    [23.797943, 90.425281],
    [23.797884, 90.424938],
    [23.797869, 90.42475],
    [23.79783, 90.424551],
    [23.797815, 90.424401],
    [23.797761, 90.424187],
  ],

  "Natun Bazar__UIU": [
    [23.797976, 90.424723],

    // [23.798133, 90.425635],[23.798201, 90.427063],
    // [23.798314, 90.428425],[23.798388, 90.429020],[23.798486, 90.430453],
    // [23.798707, 90.432362],[23.798727, 90.434122],[23.798805, 90.434976],
    // [23.799080, 90.438301],[23.799551, 90.442380],[23.800047, 90.446307],
    // [23.800356, 90.448722],[23.800975, 90.453546],[23.800852, 90.453572],
    // [23.800258, 90.448745],[23.799811, 90.448826],[23.799021, 90.449003],
    // [23.797917, 90.449255],[23.797117, 90.449464],

    [23.797318, 90.450253],
  ],
  UIU__Kuril: [
    [23.797347, 90.450247],
    [23.799725, 90.443757],

    [23.801413, 90.448584],
    [23.821548, 90.419788],
  ],
};

// --- Route Snapping ---
function snapToRoute(lat, lng, groupId) {
  const path = routePaths[groupId];
  if (!path || path.length === 0) return { lat, lng };

  let minDist = Infinity;
  let snapped = { lat, lng };

  for (let i = 0; i < path.length - 1; i++) {
    const A = path[i];
    const B = path[i + 1];
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    let t = ((lat - A[0]) * dx + (lng - A[1]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projLat = A[0] + t * dx;
    const projLng = A[1] + t * dy;
    const d = getDistanceInMeters(lat, lng, projLat, projLng);
    if (d < minDist) {
      minDist = d;
      snapped = { lat: projLat, lng: projLng };
    }
  }
  return minDist < 50 ? snapped : { lat, lng };
}

// --- OSRM থেকে পয়েন্টগুলোকে আসল রাস্তার লাইনে রূপান্তর ---
async function getOSRMRouteFromWaypoints(waypoints) {
  if (!waypoints || waypoints.length < 2) return waypoints;

  const waypointsStr = waypoints.map((pt) => `${pt[1]},${pt[0]}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
    }
  } catch (err) {
    console.error("OSRM Route Error:", err);
  }
  return waypoints;
}

// --- User Active Route Line ---
let myRoutePolyline = null;
let currentFullRouteCoords = [];

async function drawRoadRoute(fromName, toName) {
  clearUserRoute();

  const routeKey = `${fromName}__${toName}`;
  let coordsToDraw = [];

  if (routePaths[routeKey] && routePaths[routeKey].length > 0) {
    coordsToDraw = await getOSRMRouteFromWaypoints(routePaths[routeKey]);
  } else {
    const start = locations[fromName];
    const end = locations[toName];
    if (!start || !end) return;
    coordsToDraw = await getOSRMRouteFromWaypoints([
      [start.lat, start.lng],
      [end.lat, end.lng],
    ]);
  }

    currentFullRouteCoords = coordsToDraw;

  if (coordsToDraw.length > 0) {
    myRoutePolyline = L.polyline(coordsToDraw, {
      color: "#007bff",
      weight: 6,
      opacity: 0.8,
      lineJoin: "round",
      lineCap: "round",
    }).addTo(map);
  }
}

function clearUserRoute() {
  if (myRoutePolyline) {
    map.removeLayer(myRoutePolyline);
    myRoutePolyline = null;
  }
}
// --- ইউজারের পজিশন থেকে গন্তব্য পর্যন্ত রাস্তা আপডেট করার ফাংশন ---
function updateRemainingRoute(currentLat, currentLng) {
    if (!myRoutePolyline || !currentFullRouteCoords || currentFullRouteCoords.length < 2) return;

    let closestIndex = 0;
    let minDist = Infinity;
    let closestPt = [currentLat, currentLng];

    // ইউজার কোন সেগমেন্টের সবচেয়ে কাছে আছে তা খুঁজে বের করা
    for (let i = 0; i < currentFullRouteCoords.length - 1; i++) {
        const A = currentFullRouteCoords[i];
        const B = currentFullRouteCoords[i + 1];
        
        const dx = B[0] - A[0];
        const dy = B[1] - A[1];
        const lenSq = dx * dx + dy * dy;
        let t = lenSq === 0 ? 0 : ((currentLat - A[0]) * dx + (currentLng - A[1]) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        
        const projLat = A[0] + t * dx;
        const projLng = A[1] + t * dy;
        const dist = getDistanceInMeters(currentLat, currentLng, projLat, projLng);

        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
            closestPt = [projLat, projLng];
        }
    }

    // বর্তমান পজিশন থেকে গंतব্য পর্যন্ত বাকি পয়েন্টগুলোর নতুন অ্যারে তৈরি
    const remainingCoords = [closestPt, ...currentFullRouteCoords.slice(closestIndex + 1)];

    // ম্যাপের নীল লাইনটি আপডেট করা
    myRoutePolyline.setLatLngs(remainingCoords);
}

// --- DOM Elements ---
const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const menuBtn = document.getElementById("menuBtn");
const userProfileBtn = document.getElementById("userProfileBtn");
const recenterBtn = document.getElementById("recenterBtn");
const scheduleBtn = document.getElementById("scheduleBtn");
const darkModeBtn = document.getElementById("darkModeBtn");

const menuModal = document.getElementById("menuModal");
const adminModal = document.getElementById("adminModal");
const scheduleModal = document.getElementById("scheduleModal");
const userProfileModal = document.getElementById("userProfileModal");

const closeModalBtn = document.getElementById("closeModal");
const closeAdminModalBtn = document.getElementById("closeAdminModal");
const closeScheduleModalBtn = document.getElementById("closeScheduleModal");

const sendFeedbackBtn = document.getElementById("sendFeedbackBtn");
const feedbackText = document.getElementById("feedbackText");
const messageList = document.getElementById("messageList");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const viewMessagesBtn = document.getElementById("viewMessagesBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const logoutSection = document.getElementById("logoutSection");
const notification = document.getElementById("notification");

// --- Map Setup ---
const map = L.map("map", { zoomControl: false }).setView(
  [locations.UIU.lat, locations.UIU.lng],
  13,
);
L.control.zoom({ position: "bottomright" }).addTo(map);
const busIcon = L.divIcon({
  html: "🚌",
  className: "emoji-icon",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const lightTiles = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
);
const darkTiles = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
);
let isDarkMode = localStorage.getItem("uiuTrackerDarkMode") === "true";

function toggleDarkMode(dark) {
  if (dark) {
    map.removeLayer(lightTiles);
    darkTiles.addTo(map);
    document.body.classList.add("dark-mode");
    darkModeBtn.textContent = "☀️";
  } else {
    map.removeLayer(darkTiles);
    lightTiles.addTo(map);
    document.body.classList.remove("dark-mode");
    darkModeBtn.textContent = "🌙";
  }
  localStorage.setItem("uiuTrackerDarkMode", dark);
}
toggleDarkMode(isDarkMode);

darkModeBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  toggleDarkMode(isDarkMode);
});

function populateDropdowns() {
  fromSelect.innerHTML = '<option value="">-- From --</option>';
  toSelect.innerHTML = '<option value="">-- To --</option>';
  for (const name in locations) {
    fromSelect.add(new Option(name, name));
    toSelect.add(new Option(name, name));
  }
}
populateDropdowns();

function handleFromChange() {
  const fromValue = fromSelect.value;
  if (!fromValue || fromValue === "UIU") {
    toSelect.disabled = false;
    toSelect.value = "";
  } else {
    toSelect.value = "UIU";
    toSelect.disabled = true;
  }
}
fromSelect.addEventListener("change", handleFromChange);
handleFromChange();

// --- Firebase Config ---
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

let mySessionId = localStorage.getItem("uiuBusSessionId");
let watchId = null;
let currentUserPosition = null;
let isFirstLocationUpdate = true;
let currentDriverMsg = null;
let wakeLock = null;

const busMarkers = {};
const routePolylines = {};
const busPolylines = {};
const busPathHistory = {};

function updateUI(isSharing) {
  startBtn.classList.toggle("hidden", isSharing);
  stopBtn.classList.toggle("hidden", !isSharing);
  fromSelect.disabled = isSharing;
  toSelect.disabled = isSharing || fromSelect.value !== "UIU";
  recenterBtn.classList.toggle("hidden", !isSharing);

  const panel = document.getElementById("driverMsgPanel");
  if (panel) panel.classList.toggle("hidden", !isSharing);
  if (!isSharing) {
    currentDriverMsg = null;
    clearMsgBtnHighlight();
  }
}

window.setDriverMsg = function (msg) {
  currentDriverMsg = msg;
  clearMsgBtnHighlight();
  if (msg) {
    document.querySelectorAll(".msg-btn").forEach((btn) => {
      if (btn.getAttribute("onclick")?.includes(msg))
        btn.classList.add("active");
    });
  }
  if (db && mySessionId) {
    update(ref(db, "buses/" + mySessionId), { msg: msg || null });
  }
  showNotification(msg ? `Status: ${msg}` : "Status cleared", "success");
};

function clearMsgBtnHighlight() {
  document
    .querySelectorAll(".msg-btn")
    .forEach((btn) => btn.classList.remove("active"));
}

function showNotification(message, type = "success") {
  notification.textContent = message;
  notification.className = `notification show ${type}`;
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
      `buses/${id}/reportedBy/${mySessionId || "anonymous"}`,
    );
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js").then(
      ({ get, set: fbSet }) => {
        get(reportedByRef).then((snap) => {
          if (snap.exists()) {
            showNotification("You already reported this bus.", "error");
            return;
          }
          fbSet(reportedByRef, true).then(() => {
            runTransaction(ref(db, `buses/${id}/reports`), (n) => (n || 0) + 1);
          });
        });
      },
    );
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

function startSharing() {
  if (!db) return showNotification("Firebase config missing!", "error");
  if (!fromSelect.value)
    return showNotification("Please select starting point!", "error");
  if (fromSelect.value === "UIU" && !toSelect.value)
    return showNotification("Please select a destination!", "error");
  if (!navigator.geolocation)
    return showNotification("Geolocation not supported.", "error");

  if (!mySessionId) {
    mySessionId = "user_" + Date.now();
    localStorage.setItem("uiuBusSessionId", mySessionId);
  }

  const fromLocation = fromSelect.value;
  const toLocation = toSelect.value || "UIU";
  localStorage.setItem(
    "sharingRoute",
    JSON.stringify({ from: fromLocation, to: toLocation }),
  );

  const myBusRef = ref(db, "buses/" + mySessionId);
  isFirstLocationUpdate = true;
  onDisconnect(myBusRef).remove();

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed } = position.coords;
      currentUserPosition = [latitude, longitude];
      let currentSpeed = speed && speed > 0 ? Math.round(speed * 3.6) : 0;

      if (isFirstLocationUpdate) {
        map.setView(currentUserPosition, 16);
        isFirstLocationUpdate = false;
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
        msg: currentDriverMsg || null,
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
        wakeLock = lock;
      })
      .catch(() => {});
  }

  drawRoadRoute(fromLocation, toLocation);
  updateUI(true);
  showNotification("Location sharing started!", "success");
}

function stopSharing(clearSession = true) {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  if (db && mySessionId) remove(ref(db, "buses/" + mySessionId));

  if (clearSession) {
    localStorage.removeItem("uiuBusSessionId");
    localStorage.removeItem("sharingRoute");
    mySessionId = null;
  }
  watchId = null;
  currentUserPosition = null;

  clearUserRoute();

  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
  updateUI(false);
  showNotification("Location sharing stopped.", "error");
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function listenForAllBuses() {
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
        if (sessionId === mySessionId) {
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

// --- OSRM দিয়ে ম্যাপে রুট ড্র করা ---
async function updateEtaAndRoute(groupId) {
  if (routePolylines[groupId]) return;
  const path = routePaths[groupId];
  if (!path) return;

  const realRoadCoords = await getOSRMRouteFromWaypoints(path);

  routePolylines[groupId] = L.polyline(realRoadCoords, {
    color: "#007bff",
    weight: 5,
    opacity: 0.75,
    lineJoin: "round",
    lineCap: "round",
  }).addTo(map);
}

function loadAdminMessages() {
  if (!db) return;
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

// --- Event Listeners ---
startBtn.addEventListener("click", startSharing);
stopBtn.addEventListener("click", () => stopSharing(true));
recenterBtn.addEventListener("click", () => {
  if (currentUserPosition) map.setView(currentUserPosition, 16);
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

if (mySessionId) {
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
        startSharing();
      } else {
        localStorage.removeItem("uiuBusSessionId");
        localStorage.removeItem("sharingRoute");
        mySessionId = null;
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

const sharePrompt = document.getElementById("sharePrompt");
const controls = document.getElementById("mainControls");
const promptYesBtn = document.getElementById("promptYesBtn");
const promptNoBtn = document.getElementById("promptNoBtn");

if (promptYesBtn && promptNoBtn) {
  promptYesBtn.addEventListener("click", () => {
    sharePrompt.classList.add("hidden");
    controls.classList.remove("hidden");
  });
  promptNoBtn.addEventListener("click", () => {
    sharePrompt.classList.add("hidden");
  });
}
