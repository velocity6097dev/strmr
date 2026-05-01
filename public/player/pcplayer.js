// 1. Grab the movie hash from the URL
const urlParams = new URLSearchParams(window.location.search);
const currentHash = urlParams.get('hash');

if (!currentHash) {
    alert("No video source provided. Returning to home.");
    window.location.href = '/';
}

const videoElement = document.getElementById('video-player');

// 2. Set the source directly to the original file. 
videoElement.src = `/api/stream/${currentHash}?res=source`;

// 3. Initialize the Player
const player = new Plyr('#video-player', {
    settings: ['quality', 'speed'], 
    quality: { 
        default: 1080, 
        options: [1080, 720, 480],
        forced: true // Forces the Quality menu to appear without HTML <source> tags
    },
    autoplay: true,
    keyboard: { focused: false, global: false } 
});

// 4. Intercept the Quality Switch (Plyr UI Reboot Fix)
let isSwitchingQuality = false; // The Lock

player.on('qualitychange', event => {
    // 1. If we are already switching, ignore this event to prevent infinite loops!
    if (isSwitchingQuality) return; 
    
    let selectedQuality = event.detail.quality; 
    let backendRes = (selectedQuality === 1080) ? 'source' : selectedQuality;
    
    const currentTime = player.currentTime; 
    const isPaused = player.paused; 
    
    // 2. Lock the switcher
    isSwitchingQuality = true; 
    
    // 3. Rewrite Plyr's internal memory BEFORE swapping the video.
    player.config.quality.default = selectedQuality;
    
    // 4. Swap the video URL to the new resolution
    videoElement.src = `/api/stream/${currentHash}?res=${backendRes}`;
    
    // 5. Wait for the new stream to establish before jumping to your current timestamp
    videoElement.addEventListener('loadedmetadata', function onMeta() {
        videoElement.currentTime = currentTime;
        
        // Force the Plyr UI to move the checkmark to the new resolution!
        player.quality = selectedQuality; 
        
        // 6. THE ULTIMATE FIX: Forcefully rewrite the outer menu text!
        // This targets the exact HTML element Plyr uses and manually overrides it.
        const qualityLabel = document.querySelector('button[data-plyr="quality"] .plyr__menu__value');
        if (qualityLabel) {
            qualityLabel.innerText = selectedQuality + 'p';
        }
        
        if (!isPaused) player.play();
        
        // 7. Unlock the switcher after a brief moment
        setTimeout(() => { isSwitchingQuality = false; }, 200); 
        
        // Clean up the listener so it doesn't fire multiple times
        videoElement.removeEventListener('loadedmetadata', onMeta);
    });
});

// 5. Custom PC Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    switch (e.code) {
        case 'Space':
            player.togglePlay();
            break;
        case 'ArrowRight':
            player.currentTime += 15;
            break;
        case 'ArrowLeft':
            player.currentTime -= 5;
            break;
        case 'ArrowUp':
            player.volume = Math.min(1, player.volume + 0.1);
            break;
        case 'ArrowDown':
            player.volume = Math.max(0, player.volume - 0.1);
            break;
    }
});