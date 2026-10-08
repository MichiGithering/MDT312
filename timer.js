window.onload = function () {
  updateClock();
  setInterval(updateClock, 1000);
};

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const timer = document.getElementById("Timer");
  if (timer) {
    timer.innerText = `${hours}:${minutes}`;
  }
}