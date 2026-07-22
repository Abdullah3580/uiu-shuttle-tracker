// js/ui/uiManager.js
// Modals, Notifications, updateUI, Driver messages
// নোট: প্রতিটি ফাংশন নিজে থেকেই document.getElementById দিয়ে DOM এলিমেন্ট খুঁজে নেয়,
// তাই busService.js বা main.js এর সাথে কোনো সার্কুলার ইম্পোর্ট তৈরি হয় না

export function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification show ${type}`;
  setTimeout(() => notification.classList.remove("show"), 3000);
}

export function populateDropdowns(locations) {
  const fromSelect = document.getElementById("fromSelect");
  const toSelect = document.getElementById("toSelect");
  fromSelect.innerHTML = '<option value="">-- From --</option>';
  toSelect.innerHTML = '<option value="">-- To --</option>';
  for (const name in locations) {
    fromSelect.add(new Option(name, name));
    toSelect.add(new Option(name, name));
  }
}

export function handleFromChange() {
  const fromSelect = document.getElementById("fromSelect");
  const toSelect = document.getElementById("toSelect");
  const fromValue = fromSelect.value;
  if (!fromValue || fromValue === "UIU") {
    toSelect.disabled = false;
    toSelect.value = "";
  } else {
    toSelect.value = "UIU";
    toSelect.disabled = true;
  }
}

export function clearMsgBtnHighlight() {
  document
    .querySelectorAll(".msg-btn")
    .forEach((btn) => btn.classList.remove("active"));
}

// onStop: শেয়ারিং বন্ধ হলে যে callback চালাতে হবে (যেমন busService এর currentDriverMsg রিসেট করা)
export function updateUI(isSharing, onStop) {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const fromSelect = document.getElementById("fromSelect");
  const toSelect = document.getElementById("toSelect");
  const recenterBtn = document.getElementById("recenterBtn");

  startBtn.classList.toggle("hidden", isSharing);
  stopBtn.classList.toggle("hidden", !isSharing);
  fromSelect.disabled = isSharing;
  toSelect.disabled = isSharing || fromSelect.value !== "UIU";
  recenterBtn.classList.toggle("hidden", !isSharing);

  // ✅ শেয়ারিং চালু থাকলে প্রম্পট লুকাবে এবং মেইন কন্ট্রোল প্যানেল দেখাবে
  const sharePrompt = document.getElementById("sharePrompt");
  const mainControls = document.getElementById("mainControls");
  if (isSharing) {
    if (sharePrompt) sharePrompt.classList.add("hidden");
    if (mainControls) mainControls.classList.remove("hidden");
  }

  const panel = document.getElementById("driverMsgPanel");
  if (panel) panel.classList.toggle("hidden", !isSharing);
  if (!isSharing) {
    if (onStop) onStop();
    clearMsgBtnHighlight();
  }
}
