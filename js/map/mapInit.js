// js/map/mapInit.js
// Leaflet ম্যাপ সেটআপ ও ডার্ক মোড লজিক
// নোট: Leaflet (L) গ্লোবাল স্ক্রিপ্ট হিসেবে HTML-এ CDN থেকে লোড হয়, তাই এখানে import করা হয়নি

import { locations } from "../constants/routes.js";

export const map = L.map("map", { zoomControl: false }).setView(
  [locations.UIU.lat, locations.UIU.lng],
  13,
);
L.control.zoom({ position: "bottomright" }).addTo(map);

export const busIcon = L.divIcon({
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

export function toggleDarkMode(dark) {
  const darkModeBtn = document.getElementById("darkModeBtn");
  if (dark) {
    map.removeLayer(lightTiles);
    darkTiles.addTo(map);
    document.body.classList.add("dark-mode");
    if (darkModeBtn) darkModeBtn.textContent = "☀️";
  } else {
    map.removeLayer(darkTiles);
    lightTiles.addTo(map);
    document.body.classList.remove("dark-mode");
    if (darkModeBtn) darkModeBtn.textContent = "🌙";
  }
  localStorage.setItem("uiuTrackerDarkMode", dark);
}

// darkModeBtn এর জন্য initial state সেট করা এবং click listener লাগানো
export function initDarkMode() {
  const isDarkMode = localStorage.getItem("uiuTrackerDarkMode") === "true";
  toggleDarkMode(isDarkMode);

  const darkModeBtn = document.getElementById("darkModeBtn");
  darkModeBtn.addEventListener("click", () => {
    const newMode = !document.body.classList.contains("dark-mode");
    toggleDarkMode(newMode);
  });
}
