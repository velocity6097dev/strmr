const magnetInput = document.getElementById('magnet-input');
const streamBtn = document.getElementById('stream-btn');
const videoContainer = document.getElementById('video-container');
const videoElement = document.getElementById('video-player');
const statusContainer = document.getElementById('status-container');

const downloadSpeedEl = document.getElementById('download-speed');
const downloadedAmountEl = document.getElementById('downloaded-amount');
const peersEl = document.getElementById('peers');
const progressEl = document.getElementById('progress');
const progressBar = document.getElementById('progress-bar');

const player = new Plyr('#video-player');
let statInterval;

function formatBytes(bytes) {
    if (!+bytes) return '0 Bytes';
    const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB', 'TB'][i]}`;
}

streamBtn.addEventListener('click', async () => {
    const magnet = magnetInput.value.trim();
    if (!magnet) return alert("Please enter a valid magnet link.");

    // This proves the button was clicked!
    streamBtn.innerText = "Connecting to Backend...";
    streamBtn.disabled = true;

    try {
        const response = await fetch('/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magnet })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to add torrent.");

        streamBtn.innerText = "Playing";
        videoContainer.classList.remove('hidden');
        statusContainer.classList.remove('hidden');

        videoElement.src = `/api/stream/${data.infoHash}`;
        videoElement.play();

        if(statInterval) clearInterval(statInterval);
        statInterval = setInterval(updateStats, 1000);

    } catch (err) {
        alert("Error: " + err.message);
        streamBtn.innerText = "Play";
        streamBtn.disabled = false;
    }
});

async function updateStats() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();

        if (stats.status === 'downloading') {
            downloadSpeedEl.innerText = `${formatBytes(stats.downloadSpeed)}/s`;
            downloadedAmountEl.innerText = `${formatBytes(stats.downloaded)} / ${formatBytes(stats.length)}`;
            peersEl.innerText = stats.numPeers;
            
            const progressPct = (stats.progress * 100).toFixed(1);
            progressEl.innerText = `${progressPct}%`;
            progressBar.style.width = `${progressPct}%`;
        }
    } catch (err) {
        console.error("Error fetching stats:", err);
    }
}