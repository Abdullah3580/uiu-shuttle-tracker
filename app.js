import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, onDisconnect, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Corrected Real-World Coordinates for Dhaka / UIU Routes ---
const locations = {
    "UIU": { lat: 23.7977, lng: 90.4497 },          
    "Natun Bazar": { lat: 23.7974, lng: 90.4230 },   
    "Kuril": { lat: 23.8196, lng: 90.4234 },         
    // "Zigatola": { lat: 23.7381, lng: 90.3728 },      
    // "Technical": { lat: 23.7845, lng: 90.3533 },     
    // "Signboard": { lat: 23.6823, lng: 90.4820 },     
    // "Jatrabari": { lat: 23.7106, lng: 90.4343 },     
    // "Palashi": { lat: 23.7214, lng: 90.3857 },       
    // "Abdullahpur": { lat: 23.8761, lng: 90.4005 }    
};

// --- DOM Elements ---
const fromSelect = document.getElementById('fromSelect');
const toSelect = document.getElementById('toSelect');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const profileBtn = document.getElementById('profileBtn');
const recenterBtn = document.getElementById('recenterBtn');
const scheduleBtn = document.getElementById('scheduleBtn');
const darkModeBtn = document.getElementById('darkModeBtn');

const infoModal = document.getElementById('infoModal');
const adminModal = document.getElementById('adminModal');
const scheduleModal = document.getElementById('scheduleModal');

const closeModalBtn = document.getElementById('closeModal');
const closeAdminModalBtn = document.getElementById('closeAdminModal');
const closeScheduleModalBtn = document.getElementById('closeScheduleModal');

const sendFeedbackBtn = document.getElementById('sendFeedbackBtn');
const feedbackText = document.getElementById('feedbackText');
const messageList = document.getElementById('messageList');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const viewMessagesBtn = document.getElementById('viewMessagesBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const logoutSection = document.getElementById('logoutSection');
const notification = document.getElementById('notification');

// --- 1. INITIALIZE MAP IMMEDIATELY ---
const map = L.map('map').setView([locations.UIU.lat, locations.UIU.lng], 13);
const busIcon = L.divIcon({ html: '🚌', className: 'emoji-icon', iconSize: [30, 30], iconAnchor: [15, 30] });

const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
let isDarkMode = localStorage.getItem('uiuTrackerDarkMode') === 'true';

function toggleDarkMode(dark) {
    if (dark) {
        map.removeLayer(lightTiles);
        darkTiles.addTo(map);
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️';
    } else {
        map.removeLayer(darkTiles);
        lightTiles.addTo(map);
        document.body.classList.remove('dark-mode');
        darkModeBtn.textContent = '🌙';
    }
    localStorage.setItem('uiuTrackerDarkMode', dark);
}
toggleDarkMode(isDarkMode);

darkModeBtn.addEventListener('click', () => {
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
    if (!fromValue) {
        toSelect.disabled = false;
        toSelect.value = '';
    } else if (fromValue === 'UIU') {
        toSelect.disabled = false;
        toSelect.value = '';
    } else {
        toSelect.value = 'UIU';
        toSelect.disabled = true;
    }
}
fromSelect.addEventListener('change', handleFromChange);
handleFromChange();

// ⚠️ 2. Firebase Config (Replace with your actual keys)
const firebaseConfig = {
  apiKey: "AIzaSyBPuc06Txuyz8BKwmQmSVpKqiByfrMok8c",
  authDomain: "uiu-shuttle-tracker-43216.firebaseapp.com",
  databaseURL: "https://uiu-shuttle-tracker-43216-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "uiu-shuttle-tracker-43216",
  storageBucket: "uiu-shuttle-tracker-43216.firebasestorage.app",
  messagingSenderId: "679422838083",
  appId: "1:679422838083:web:fb7790de62030c7855dbf6",
  measurementId: "G-4C26CSN4YV"
};
let app, db, auth;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase Initialization Failed!", e);
}

let mySessionId = localStorage.getItem('uiuBusSessionId');
let watchId = null;
let currentUserPosition = null;
let isFirstLocationUpdate = true;
const busMarkers = {};
const routingControls = {}; 

function updateUI(isSharing) {
    startBtn.classList.toggle('hidden', isSharing);
    stopBtn.classList.toggle('hidden', !isSharing);
    fromSelect.disabled = isSharing;
    toSelect.disabled = isSharing || fromSelect.value !== 'UIU';
    recenterBtn.classList.toggle('hidden', !isSharing);
}

function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

window.reportFakeBus = function(sessionIdsJson) {
    if(!db) return;
    const sessionIds = JSON.parse(decodeURIComponent(sessionIdsJson));
    if(!confirm("Are you sure this bus location is fake?")) return;

    // 🔒 Spam Fix: একই ইউজার একাধিকবার রিপোর্ট করতে পারবে না
    const alreadyReportedKey = 'reportedBuses';
    let reportedBuses = {};
    try { reportedBuses = JSON.parse(localStorage.getItem(alreadyReportedKey)) || {}; } catch(e) {}

    let anyNewReport = false;
    sessionIds.forEach(id => {
        if (reportedBuses[id]) return; // আগেই রিপোর্ট করা হয়েছে

        // Firebase-এ reportedBy/{mySessionId} = true সেট করে তারপর count বাড়াও
        const reportedByRef = ref(db, `buses/${id}/reportedBy/${mySessionId || 'anonymous'}`);
        import("https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js").then(({ get, set: fbSet }) => {
            get(reportedByRef).then(snap => {
                if (snap.exists()) {
                    showNotification("You already reported this bus.", "error");
                    return;
                }
                fbSet(reportedByRef, true).then(() => {
                    const reportRef = ref(db, `buses/${id}/reports`);
                    runTransaction(reportRef, (currentReports) => (currentReports || 0) + 1);
                });
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

function startSharing() {
    if(!db) return showNotification("Firebase config missing!", "error");
    if (!fromSelect.value) return showNotification('Please select starting point!', 'error');
    if (fromSelect.value === 'UIU' && !toSelect.value) return showNotification('Please select a destination!', 'error');
    if (!navigator.geolocation) return showNotification("Geolocation not supported.", 'error');

    if (!mySessionId) {
        mySessionId = 'user_' + Date.now();
        localStorage.setItem('uiuBusSessionId', mySessionId);
    }

    const fromLocation = fromSelect.value;
    const toLocation = toSelect.value || "UIU";
    localStorage.setItem('sharingRoute', JSON.stringify({from: fromLocation, to: toLocation}));
    
    const myBusRef = ref(db, 'buses/' + mySessionId);
    isFirstLocationUpdate = true;
    onDisconnect(myBusRef).remove();

    watchId = navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude, speed } = position.coords;
        currentUserPosition = [latitude, longitude];
        let currentSpeed = speed && speed > 0 ? Math.round(speed * 3.6) : 0;

        if (isFirstLocationUpdate) {
            map.setView(currentUserPosition, 16);
            isFirstLocationUpdate = false;
        }
        set(myBusRef, { 
            lat: latitude, lng: longitude, timestamp: Date.now(),
            from: fromLocation, to: toLocation, speed: currentSpeed, reports: 0
        });
    }, (error) => { 
        if(error.code === 1) { 
            showNotification("Please enable location access.", 'error'); 
            stopSharing(false); 
        } 
    }, { enableHighAccuracy: true });
    
    updateUI(true);
    showNotification("Location sharing started!", "success");
}

function stopSharing(clearSession = true) {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (db && mySessionId) remove(ref(db, 'buses/' + mySessionId));
    
    if (clearSession) {
        localStorage.removeItem('uiuBusSessionId');
        localStorage.removeItem('sharingRoute');
        mySessionId = null;
    }
    watchId = null;
    currentUserPosition = null;
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
    if(!db) return;
    const busesRef = ref(db, 'buses');
    onValue(busesRef, (snapshot) => {
        const busesData = snapshot.val() || {};
        const TEN_MINUTES_AGO = Date.now() - (10 * 60 * 1000);
        const busGroups = [];
        // ✅ Route-based grouping: একই from→to route এর সবাই একটাই group পাবে
        // groupId = "from__to" — সম্পূর্ণ stable, কোনো user আসলে বা গেলেও পরিবর্তন হয় না
        const routeGroupMap = {};

        Object.keys(busesData).forEach(sessionId => {
            const bus = busesData[sessionId];
            if (!bus.timestamp || bus.timestamp < TEN_MINUTES_AGO) return;
            if (bus.reports && bus.reports >= 3) {
                if(sessionId === mySessionId) {
                    stopSharing(true);
                    alert("Your sharing was stopped due to fake reports.");
                }
                return; 
            }
            
            bus.id = sessionId;

            // Stable group ID: route দিয়ে নির্ধারিত — user ID দিয়ে নয়
            const groupId = `${bus.from}__${bus.to}`;

            if (routeGroupMap[groupId]) {
                const group = routeGroupMap[groupId];
                group.users.push(bus);
                // ✅ Correct weighted centroid (n জনের সঠিক গাণিতিক গড়)
                const n = group.users.length;
                group.lat = group.lat + (bus.lat - group.lat) / n;
                group.lng = group.lng + (bus.lng - group.lng) / n;
                if ((bus.speed || 0) > group.maxSpeed) group.maxSpeed = bus.speed;
                if (bus.timestamp > group.latestTimestamp) group.latestTimestamp = bus.timestamp;
            } else {
                routeGroupMap[groupId] = {
                    groupId,
                    from: bus.from, to: bus.to,
                    lat: bus.lat, lng: bus.lng,
                    maxSpeed: bus.speed || 0,
                    latestTimestamp: bus.timestamp,
                    users: [bus]
                };
                busGroups.push(routeGroupMap[groupId]);
            }
        });

        const activeGroupIds = {};
        busGroups.forEach(group => {
            const groupId = group.groupId; // ✅ stable route-based ID
            activeGroupIds[groupId] = true;
            
            const position = [group.lat, group.lng];
            const speedDisplay = group.maxSpeed > 0 ? `${group.maxSpeed} km/h` : '0 km/h';
            const trackerCount = group.users.length;
            const groupSessionIds = encodeURIComponent(JSON.stringify(group.users.map(u => u.id)));

            const popupContent = `
                <b>Route:</b> ${group.from} → ${group.to}<br>
                <b>Speed:</b> ${speedDisplay}<br>
                <b>Trackers:</b> ${trackerCount} Student(s) 👥<br>
                <b>Updated:</b> ${formatTimeAgo(group.latestTimestamp)}
                <button class="report-btn" onclick="reportFakeBus('${groupSessionIds}')">Report Fake 🚫</button>
            `;

            if (busMarkers[groupId]) {
                busMarkers[groupId].setLatLng(position);
                busMarkers[groupId].setPopupContent(popupContent);
            } else {
                busMarkers[groupId] = L.marker(position, { icon: busIcon }).addTo(map).bindPopup(popupContent);
            }
            busMarkers[groupId].toFront();
            updateEtaAndRoute(position, groupId, group.to);
        });

        Object.keys(busMarkers).forEach(groupId => {
            if (!activeGroupIds[groupId]) {
                map.removeLayer(busMarkers[groupId]);
                delete busMarkers[groupId];
                if (routingControls[groupId]) {
                    map.removeControl(routingControls[groupId]);
                    delete routingControls[groupId];
                }
            }
        });
    });
}

function updateEtaAndRoute(busPosition, groupId, destinationName) {
    const destination = locations[destinationName];
    if (!destination) return;

    const destinationLatLng = L.latLng(destination.lat, destination.lng);
    const currentBusLatLng = L.latLng(busPosition[0], busPosition[1]);

    if (routingControls[groupId]) {
        routingControls[groupId].setWaypoints([currentBusLatLng, destinationLatLng]);
    } else {
        routingControls[groupId] = L.Routing.control({
            waypoints: [currentBusLatLng, destinationLatLng],
            createMarker: () => null, 
            lineOptions: { 
                styles: [{color: '#007bff', opacity: 0.7, weight: 5}],
                addWaypoints: false 
            }, 
            addWaypoints: false,
            draggableWaypoints: false
        }).addTo(map);

        routingControls[groupId].on('routesfound', function(e) {
            const summary = e.routes[0].summary;
            const timeInMinutes = Math.round(summary.totalTime / 60);
            const marker = busMarkers[groupId];
            if (marker) {
                let popup = marker.getPopup();
                if(popup) {
                    let baseContent = popup.getContent().split('<br><b>ETA')[0];
                    marker.setPopupContent(baseContent + `<br><b>ETA to ${destinationName}:</b> ~${timeInMinutes} min`);
                }
            }
        });
    }
}

function loadAdminMessages() {
    if(!db) return;
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        messageList.innerHTML = "";
        const messages = snapshot.val();
        if (messages) {
            Object.values(messages).reverse().forEach(msg => {
                const msgDate = new Date(msg.timestamp).toLocaleString();
                const msgElement = document.createElement('div');
                msgElement.className = 'message-item';
                // 🔒 XSS Fix: textContent ব্যবহার করা হয়েছে, innerHTML নয়
                const p = document.createElement('p');
                p.textContent = msg.message;
                const small = document.createElement('small');
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

startBtn.addEventListener('click', startSharing);
stopBtn.addEventListener('click', () => stopSharing(true));
recenterBtn.addEventListener('click', () => {
    if (currentUserPosition) map.setView(currentUserPosition, 16);
});

profileBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
closeAdminModalBtn.addEventListener('click', () => adminModal.classList.add('hidden'));

scheduleBtn.addEventListener('click', () => scheduleModal.classList.remove('hidden'));
closeScheduleModalBtn.addEventListener('click', () => scheduleModal.classList.add('hidden'));

sendFeedbackBtn.addEventListener('click', () => {
    if(!db) return showNotification("Firebase not configured", "error");
    const message = feedbackText.value.trim();
    if (message.length < 5) return showNotification("Please write a longer message.", 'error');
    
    const messagesRef = ref(db, 'messages/' + Date.now());
    set(messagesRef, {
        message: message,
        timestamp: new Date().toISOString()
    }).then(() => {
        feedbackText.value = "";
        showNotification("Feedback sent!", 'success');
        infoModal.classList.add('hidden');
    }).catch(error => showNotification("Error: " + error.message, 'error'));
});

adminLoginBtn.addEventListener('click', () => {
    if(!auth) return showNotification("Auth not configured", "error");
    const email = adminEmail.value.trim();
    const password = adminPassword.value;
    if(!email || !password) return showNotification("Fill up credentials!", "error");
    
    signInWithEmailAndPassword(auth, email, password)
        .then(() => showNotification("Admin Login Success!", "success"))
        .catch(error => showNotification("Login Failed: " + error.message, 'error'));
});

logoutBtn.addEventListener('click', () => {
    if(auth) signOut(auth).then(() => showNotification("Logged out.", "success"));
});

viewMessagesBtn.addEventListener('click', () => {
    infoModal.classList.add('hidden'); 
    adminModal.classList.remove('hidden'); 
    loadAdminMessages();
});

if(auth) {
    onAuthStateChanged(auth, user => {
        if (user) {
            loginForm.classList.add('hidden');
            logoutSection.classList.remove('hidden');
        } else {
            loginForm.classList.remove('hidden');
            logoutSection.classList.add('hidden');
            adminModal.classList.add('hidden');
        }
    });
}

listenForAllBuses();

if (mySessionId) {
    try {
        const routeInfo = JSON.parse(localStorage.getItem('sharingRoute'));
        if(routeInfo && routeInfo.from && routeInfo.to) {
            fromSelect.value = routeInfo.from;
            handleFromChange(); 
            toSelect.value = routeInfo.to;
            // 🔒 Privacy Fix: auto-resume করার আগে user-কে confirm করতে বলা হচ্ছে
            const resume = confirm(`আপনার আগের session চলছিল (${routeInfo.from} → ${routeInfo.to})। লোকেশন শেয়ারিং আবার শুরু করবেন?`);
            if (resume) {
                startSharing();
            } else {
                localStorage.removeItem('uiuBusSessionId');
                localStorage.removeItem('sharingRoute');
                mySessionId = null;
            }
        } else {
            localStorage.removeItem('uiuBusSessionId');
            localStorage.removeItem('sharingRoute');
        }
    } catch (e) {
        localStorage.removeItem('uiuBusSessionId');
        localStorage.removeItem('sharingRoute');
    }
}