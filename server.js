import express from 'express';
import WebTorrent from 'webtorrent';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES Modules, we have to manually recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const client = new WebTorrent();
const PORT = 3000;

// Serve frontend and parse JSON
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let currentTorrent = null;

// 1. Endpoint to add a magnet link
app.post('/api/add', (req, res) => {
    const { magnet } = req.body;
    if (!magnet) return res.status(400).json({ error: 'No magnet link provided' });

    if (currentTorrent) {
        currentTorrent.destroy();
    }

    client.add(magnet, (torrent) => {
        currentTorrent = torrent;
        
        const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'));

        if (!file) {
            return res.status(400).json({ error: 'No video file found.' });
        }

        res.json({
            message: 'Ready to stream',
            infoHash: torrent.infoHash,
        });
    });
});

// 2. Endpoint to stream the video to the HTML5 player
app.get('/api/stream/:infoHash', (req, res) => {
    if (!currentTorrent || currentTorrent.infoHash !== req.params.infoHash) {
        return res.status(404).send('Torrent not found');
    }

    const file = currentTorrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'));
    if (!file) return res.status(404).send('File not found');

    const range = req.headers.range;
    if (!range) {
        res.writeHead(200, { 'Content-Length': file.length, 'Content-Type': 'video/mp4' });
        file.createReadStream().pipe(res);
        return;
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
    });

    file.createReadStream({ start, end }).pipe(res);
});

// 3. Endpoint to get real-time download stats for the UI
app.get('/api/stats', (req, res) => {
    if (!currentTorrent) return res.json({ status: 'idle' });
    
    res.json({
        status: 'downloading',
        progress: currentTorrent.progress,
        downloadSpeed: currentTorrent.downloadSpeed,
        downloaded: currentTorrent.downloaded,
        length: currentTorrent.length,
        numPeers: currentTorrent.numPeers
    });
});

app.listen(PORT, () => {
    console.log(`Backend Streaming Engine running on http://localhost:${PORT}`);
});