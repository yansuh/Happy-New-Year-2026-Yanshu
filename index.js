// --- CẤU HÌNH BIẾN TOÀN CỤC ---
const targetTime = new Date("Feb 17, 2026 00:00:00").getTime();
let audioAutoplayed = false;
let audioFallbackEnabled = false;
let timerInterval = null;
let audioContextInitialized = false;

// --- CẤU HÌNH NHẠC (THÊM MỚI) ---
const musicFiles = ['nhac.mp3', 'nhac2.mp3', 'nhac3.mp3']; // Danh sách nhạc gốc
let playlist = []; // Danh sách nhạc sau khi random
let currentTrackIndex = 0; // Vị trí bài đang phát

// --- PHẦN 1: LOGIC RANDOM & PHÁT NHẠC LIÊN TIẾP ---

// Hàm xáo trộn mảng (Fisher-Yates)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Hàm chuẩn bị danh sách phát (Đảm bảo bài đầu tiên của list mới không trùng bài cuối của list cũ)
function preparePlaylist() {
    let newPlaylist = shuffle([...musicFiles]);
    
    // Nếu danh sách cũ đã tồn tại, kiểm tra trùng lặp ở điểm nối
    if (playlist.length > 0) {
        const lastPlayedSong = playlist[playlist.length - 1];
        // Nếu bài đầu tiên của danh sách mới trùng bài vừa phát xong
        if (newPlaylist[0] === lastPlayedSong) {
            // Đẩy bài đầu tiên xuống cuối hàng
            newPlaylist.push(newPlaylist.shift());
        }
    }
    
    playlist = newPlaylist;
    currentTrackIndex = 0;
    console.log("Danh sách phát mới:", playlist);
}

// Hàm tải bài hát hiện tại
function loadTrack() {
    const audio = document.getElementById('tetAudio');
    if (!audio) return;
    
    // Nếu chưa có playlist hoặc đã hát hết playlist
    if (playlist.length === 0 || currentTrackIndex >= playlist.length) {
        preparePlaylist();
    }
    
    audio.src = playlist[currentTrackIndex];
    audio.load();
}

// Hàm chuyển sang bài tiếp theo
function nextTrack() {
    currentTrackIndex++;
    // Nếu đã hết danh sách thì tạo list mới (hàm loadTrack sẽ tự gọi preparePlaylist)
    if (currentTrackIndex >= playlist.length) {
        preparePlaylist(); 
    } else {
        // Chỉ cần cập nhật src nếu chưa hết list
        const audio = document.getElementById('tetAudio');
        audio.src = playlist[currentTrackIndex];
        audio.load();
    }
    
    // Phát nhạc
    const audio = document.getElementById('tetAudio');
    audio.play()
        .then(() => showAudioStatus(`🎵 Đang phát bài ${currentTrackIndex + 1}/${playlist.length}`, "info"))
        .catch(e => console.log("Auto-next blocked:", e));
}

// --- PHẦN 2: XỬ LÝ ÂM THANH & GIAO DIỆN (GIỮ NGUYÊN CODE CŨ + TÍCH HỢP PLAYLIST) ---
function showAudioStatus(message, type = "info") {
    const status = document.getElementById('audioStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = 'audio-status show';
    
    const colors = {
        success: { bg: "rgba(76, 175, 80, 0.9)", text: "white" },
        error: { bg: "rgba(244, 67, 54, 0.9)", text: "white" },
        info: { bg: "rgba(255, 215, 0, 0.9)", text: "#8B0000" }
    };
    
    const style = colors[type] || colors.info;
    status.style.background = style.bg;
    status.style.color = style.text;
    
    setTimeout(() => { status.classList.remove('show'); }, 3000);
}

function unlockAudioContext() {
    if (audioContextInitialized) return;
    const audio = document.getElementById('tetAudio');
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && audio) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        source.connect(audioContext.destination);
        if (audioContext.state === 'suspended') audioContext.resume();
    }
    audioContextInitialized = true;
}

async function tryAutoplayAudio() {
    const audio = document.getElementById('tetAudio');
    if (!audio || audioAutoplayed) return;
    
    // Đảm bảo nhạc đã được load trước khi play
    if (!audio.src || audio.src === window.location.href) {
        loadTrack();
    }
    
    try {
        audio.volume = 0.5;
        await audio.play();
        audioAutoplayed = true;
        showAudioStatus("🎵 Nhạc Tết đang phát", "success");
        disableClickFallback();
    } catch (error) {
        enableClickFallback();
    }
}

function initAudioWithGesture() {
    if (audioAutoplayed) return;
    unlockAudioContext();
    const audio = document.getElementById('tetAudio');
    
    if (audio) {
        // Đảm bảo nhạc đã được load
        if (!audio.src || audio.src === window.location.href) {
            loadTrack();
        }

        audio.play().then(() => {
            audioAutoplayed = true;
            showAudioStatus("🎵 Nhạc Tết đang phát", "success");
            disableClickFallback();
            const overlay = document.getElementById('audioOverlay');
            if (overlay) overlay.remove();
        }).catch(e => console.log("Audio play failed", e));
    }
}

function enableClickFallback() {
    if (audioFallbackEnabled) return;
    ['click', 'touchstart', 'keydown'].forEach(evt => 
        document.body.addEventListener(evt, initAudioWithGesture));
    
    const overlay = document.createElement('div');
    overlay.id = 'audioOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999; display: flex;
        justify-content: center; align-items: center; cursor: pointer;
    `;
    overlay.innerHTML = `
        <div style="background: #fff; padding: 30px; border-radius: 20px; text-align: center; border: 4px solid #8B0000;">
            <h2 style="color: #8B0000;">🏮 CHÀO MỪNG TẾT 2026 🏮</h2>
            <p style="color: #333; margin: 15px 0;">Nhấn để khởi động nhạc Tết và xem đếm ngược!</p>
            <button style="background: #8B0000; color: #FFD700; border: none; padding: 12px 25px; 
            font-weight: bold; border-radius: 50px; cursor: pointer;">BẮT ĐẦU NGAY</button>
        </div>`;
    document.body.appendChild(overlay);
    audioFallbackEnabled = true;
}

function disableClickFallback() {
    ['click', 'touchstart', 'keydown'].forEach(evt => 
        document.body.removeEventListener(evt, initAudioWithGesture));
}

// --- PHẦN 3: ĐẾM NGƯỢC & HIỆU ỨNG LÌ XÌ (KHÔNG THAY ĐỔI) ---
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        showLixiScreen();
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const updateText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val).padStart(2, '0');
    };

    updateText("days", days);
    updateText("hours", hours);
    updateText("minutes", minutes);
    updateText("seconds", seconds);
}

function showLixiScreen() {
    const container = document.getElementById('mainContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="lixi-wrapper" style="text-align: center; animation: fadeIn 1s;">
            <h2 class="sub-title">🧧 Lộc Xuân May Mắn 🧧</h2>
            <div class="lixi" id="btnOpenLixi" style="margin: 30px auto; cursor: pointer; transition: 0.3s;">
                <div class="lixi-top"></div>
                <div class="lixi-button">MỞ</div>
            </div>
            <p class="hint">Chạm vào bao lì xì để nhận lộc đầu năm!</p>
        </div>
    `;
    document.getElementById('btnOpenLixi').addEventListener('click', handleOpenLixi);
}

function handleOpenLixi() {
    const btn = document.getElementById('btnOpenLixi');
    btn.style.pointerEvents = 'none';
    btn.classList.add('open-animation'); 

    // Hiệu ứng hạt bay (Particles)
    const symbols = ['🧧', '💵', '💰', '✨', '🪙', '🎊', '🎉'];
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'money-particle';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.left = '50%'; p.style.top = '50%';
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 200 + Math.random() * 400;
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
    
    setTimeout(showFinalCard, 1200);
}

function showFinalCard() {
    const container = document.getElementById('mainContainer');
    container.style.opacity = '0';
    setTimeout(() => {
        container.innerHTML = `
            <div class="ready-container" style="text-align: center;">
                <div class="question-box">
                    <h1 class="main-title">Chúc Mừng Năm Mới!</h1>
                    <p class="question">Chị đã sẵn sàng nhận lấy 1 năm mới <br><b>BÌNH AN - HẠNH PHÚC - MAY MẮN</b> chưa?</p>
                    <button class="ready-btn" id="readyButton">
                        <span class="btn-text">CHỊ ĐÃ SẴN SÀNG!</span>
                        <span class="btn-icon">🚀</span>
                    </button>
                </div>
            </div>`;
        container.style.opacity = '1';
        document.getElementById('readyButton').addEventListener('click', goToMainPage);
    }, 500);
}

// --- PHẦN 4: CHUYỂN TRANG (KHÔNG THAY ĐỔI) ---
function goToMainPage() {
    // Tạo hiệu ứng chuyển cảnh mượt mà
    document.body.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    document.body.style.opacity = "0";
    document.body.style.transform = "scale(1.1)";
    
    setTimeout(() => {
        window.location.href = 'intro.html';
    }, 800);
}

// --- KHỞI CHẠY ---
function initApp() {
    // 1. Khởi tạo danh sách nhạc ngẫu nhiên ngay lập tức
    preparePlaylist();

    // 2. Gán sự kiện tự động chuyển bài khi hết nhạc
    const audio = document.getElementById('tetAudio');
    if (audio) {
        audio.addEventListener('ended', nextTrack);
    }

    // 3. Logic đếm ngược cũ
    updateCountdown();
    const now = new Date().getTime();
    if (now < targetTime) {
        timerInterval = setInterval(updateCountdown, 1000);
    }
    
    // 4. Thử phát nhạc
    [500, 1500, 2500].forEach(delay => {
        setTimeout(tryAutoplayAudio, delay);
    });
}

window.addEventListener('DOMContentLoaded', initApp);