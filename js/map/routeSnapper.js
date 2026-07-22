// js/map/routeSnapper.js
// snapToRoute, updateRemainingRoute, drawRoadRoute

import { locations, routePaths } from "../constants/routes.js";
import { getDistanceInMeters } from "../utils/helpers.js";
import { map } from "./mapInit.js";

// --- Route Snapping ---
export function snapToRoute(lat, lng, groupId) {
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
  return minDist < 500 ? snapped : { lat, lng };
}

// --- User Active Route Line ---
let myRoutePolyline = null;
let currentFullRouteCoords = [];

export async function drawRoadRoute(fromName, toName) {
  clearUserRoute();

  const routeKey = `${fromName}__${toName}`;
  let coordsToDraw = [];

  if (routePaths[routeKey] && routePaths[routeKey].length > 0) {
    coordsToDraw = routePaths[routeKey]; // 👈 সরাসরি হার্ডকোডেড রুট ব্যবহার হবে
  } else {
    const start = locations[fromName];
    const end = locations[toName];
    if (!start || !end) return;
    coordsToDraw = [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }

  currentFullRouteCoords = coordsToDraw; // বাকি রুট ছোট করার জন্য সেভ থাকছে

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

export function clearUserRoute() {
  if (myRoutePolyline) {
    map.removeLayer(myRoutePolyline);
    myRoutePolyline = null;
  }
}

// --- ইউজারের পজিশন থেকে গন্তব্য পর্যন্ত রাস্তা আপডেট করার ফাংশন ---
export function updateRemainingRoute(currentLat, currentLng) {
  if (
    !myRoutePolyline ||
    !currentFullRouteCoords ||
    currentFullRouteCoords.length < 2
  )
    return;

  let closestIndex = 0;
  let minDist = Infinity;
  let closestPt = [currentLat, currentLng];

  // ইউজার কোন সেগমেন্টের সবচেয়ে কাছে আছে তা খুঁজে বের করা
  for (let i = 0; i < currentFullRouteCoords.length - 1; i++) {
    const A = currentFullRouteCoords[i];
    const B = currentFullRouteCoords[i + 1];

    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const lenSq = dx * dx + dy * dy;
    let t =
      lenSq === 0
        ? 0
        : ((currentLat - A[0]) * dx + (currentLng - A[1]) * dy) / lenSq;
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

  // বর্তমান পজিশন থেকে গন্তব্য পর্যন্ত বাকি পয়েন্টগুলোর নতুন অ্যারে তৈরি
  const remainingCoords = [
    closestPt,
    ...currentFullRouteCoords.slice(closestIndex + 1),
  ];

  // ম্যাপের নীল লাইনটি আপডেট করা
  myRoutePolyline.setLatLngs(remainingCoords);
}
