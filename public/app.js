const magnetInput = document.getElementById('magnet-input');
const streamBtn = document.getElementById('stream-btn');

streamBtn.addEventListener('click', async () => {
    const magnet = magnetInput.value.trim();
    if (!magnet) return alert("Please enter a valid magnet link.");

    streamBtn.innerText = "Processing...";
    streamBtn.disabled = true;

    try {
        const response = await fetch('/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magnet })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // SUCCESS! Redirect the browser to the dedicated Player folder, passing the infoHash in the URL
        window.location.href = `/player/pcplayer.html?hash=${data.infoHash}`;

    } catch (err) {
        alert("Error: " + err.message);
        streamBtn.innerText = "Start Watching";
        streamBtn.disabled = false;
    }
});
