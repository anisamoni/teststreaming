const playerFrame = document.getElementById("playerFrame");
const channelsListEl = document.getElementById("channelsList");
const matchTitleEl = document.getElementById("matchTitle");
const matchTimeEl = document.getElementById("matchTime");
const streamStatus = document.getElementById("streamStatus");

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function formatLocalFromMs(ms) {
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

(function(){
  const idx = Number(getQueryParam("idx"));
  const matches = JSON.parse(sessionStorage.getItem("parsedMatches") || "[]");

  if (!matches || !matches[idx]) {
    streamStatus.textContent = "Match not found.";
    return;
  }

  const match = matches[idx];
  matchTitleEl.textContent = match.matchName;
  matchTimeEl.textContent = `Start: ${formatLocalFromMs(match.eventUtcMs)}`;

  channelsListEl.innerHTML = "";
  match.channels.forEach((url, i) => {
    const btn = document.createElement("button");
    btn.className = "channel-btn";
    btn.textContent = `Channel ${i+1}`;
    btn.title = url;
    btn.addEventListener("click", () => {
      Array.from(channelsListEl.children).forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      playerFrame.src = url;
      streamStatus.textContent = `Loaded channel ${i+1}`;
    });
    channelsListEl.appendChild(btn);
  });

  if (channelsListEl.firstChild) channelsListEl.firstChild.click();
})();
