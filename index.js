const SOURCE_URL = "https://sportsonline.sn/prog.txt";
const CORS_PROXY = "https://corsproxy.io/?";
const WEEKDAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

const matches = [];

document.addEventListener("DOMContentLoaded", () => {
    const refreshBtn = document.getElementById("refreshBtn");
    const statusEl = document.getElementById("status");
    const tableBody = document.querySelector("#matchesTable tbody");
    const lastUpdateEl = document.getElementById("lastUpdate");

    refreshBtn?.addEventListener("click", () => loadAndRender());

    function utcMsFromDateAndTimeInUTCplus1(year, monthIndex, day, hour24, minute) {
        return Date.UTC(year, monthIndex, day, hour24 - 1, minute);
    }

    function getDateOfWeekdayThisWeekUTC1(weekdayName, nowUtcMs) {
        const weekdayNum = WEEKDAYS.indexOf(weekdayName.toUpperCase());
        if (weekdayNum < 0) return null;
        const nowUtcPlus1Ms = nowUtcMs + 3600_000;
        const nowUtc1 = new Date(nowUtcPlus1Ms);
        const currentWeekday = nowUtc1.getUTCDay();
        const delta = weekdayNum - currentWeekday;
        const targetUtc1Ms = nowUtcPlus1Ms + delta * 86400_000;
        return new Date(targetUtc1Ms);
    }

    function formatLocal(d) {
        return d.toLocaleString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    function parseScheduleText(text) {
        matches.length = 0;
        const lines = text.split(/\r?\n/);
        let currentWeekday = null;
        const now = Date.now();
        const cutoffMs = 6 * 3600_000;

        const lastUpdateMatch = text.match(/LAST UPDATE:\s*([0-9\-\_\/: ]+)/i);
        const lastUpdate = lastUpdateMatch ? lastUpdateMatch[1].trim() : null;
        if (lastUpdate && lastUpdateEl) lastUpdateEl.textContent = `Source last update: ${lastUpdate}`;

        const tempMatches = {};

        for (let raw of lines) {
            const line = raw.trim();
            if (!line) continue;

            const upper = line.toUpperCase();
            if (WEEKDAYS.includes(upper)) {
                currentWeekday = upper;
                continue;
            }
            if (line.startsWith("===") || line.startsWith("INFO:") || line.startsWith("IMPORTANT") || line.startsWith("(W)")) {
                continue;
            }

            const m = line.match(/^(\d{1,2}:\d{2})\s+(.+?)\s*\|\s*(https?:\/\/\S+)$/i);
            if (!m) continue;

            const timePart = m[1];
            const matchName = m[2].trim();
            const url = m[3].trim();

            const weekdayForThis = currentWeekday || WEEKDAYS[new Date(Date.now() + 3600_000).getUTCDay()];

            const baseDateThisWeekUtc1 = getDateOfWeekdayThisWeekUTC1(weekdayForThis, now);
            if (!baseDateThisWeekUtc1) continue;

            const [hStr, minStr] = timePart.split(":");
            const hour = Number(hStr);
            const minute = Number(minStr);

            const year = baseDateThisWeekUtc1.getUTCFullYear();
            const monthIndex = baseDateThisWeekUtc1.getUTCMonth();
            const day = baseDateThisWeekUtc1.getUTCDate();
            const eventThisWeekUtcMs = utcMsFromDateAndTimeInUTCplus1(year, monthIndex, day, hour, minute);
            const eventNextWeekUtcMs = eventThisWeekUtcMs + 7 * 86400_000;

            let chosenEventUtcMs = null;
            if (eventThisWeekUtcMs + cutoffMs >= now) {
                chosenEventUtcMs = eventThisWeekUtcMs;
            } else if (eventNextWeekUtcMs + cutoffMs >= now) {
                chosenEventUtcMs = eventNextWeekUtcMs;
            } else {
                continue;
            }

            const matchKey = `${matchName}||${chosenEventUtcMs}`;

            if (!tempMatches[matchKey]) {
                tempMatches[matchKey] = {
                    matchName,
                    weekday: weekdayForThis,
                    eventUtcMs: chosenEventUtcMs,
                    channels: [url]
                };
            } else {
                tempMatches[matchKey].channels.push(url);
            }
        }

        for (const key in tempMatches) {
            matches.push(tempMatches[key]);
        }

        matches.sort((a,b) => a.eventUtcMs - b.eventUtcMs);
    }

    function renderTable() {
        tableBody.innerHTML = "";
        if (!matches.length) {
            tableBody.innerHTML = `<tr><td colspan="3">No matches found.</td></tr>`;
            return;
        }

        sessionStorage.setItem("parsedMatches", JSON.stringify(matches)); // Store matches

        matches.forEach((m, idx) => {
            const tr = document.createElement("tr");

            const tdTime = document.createElement("td");
            tdTime.innerHTML = `<div class="badge">${formatLocal(new Date(m.eventUtcMs))}</div>`;

            const tdMatch = document.createElement("td");
            tdMatch.textContent = m.matchName;

            const tdLink = document.createElement("td");
            const link = document.createElement("a");
            link.className = "btn-link";
            link.textContent = "Watch";
            link.href = `stream.html?idx=${idx}`; // Pass index to stream page
            tdLink.appendChild(link);

            tr.appendChild(tdTime);
            tr.appendChild(tdMatch);
            tr.appendChild(tdLink);
            tableBody.appendChild(tr);
        });
    }

    async function loadAndRender() {
        if (statusEl) statusEl.textContent = "Loading schedule...";
        try {
            const resp = await fetch(CORS_PROXY + encodeURIComponent(SOURCE_URL), {cache: "no-store"});
            if (!resp.ok) throw new Error(`Failed to fetch schedule: ${resp.status}`);
            const txt = await resp.text();
            parseScheduleText(txt);
            renderTable();
            if (statusEl) statusEl.textContent = `Loaded ${matches.length} matches.`;
        } catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = "Error loading schedule.";
            tableBody.innerHTML = `<tr><td colspan="3">Error loading matches.</td></tr>`;
        }
    }

    loadAndRender();
});
