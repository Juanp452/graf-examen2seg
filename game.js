window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElement = document.getElementById('score');
  const timerElement = document.getElementById('timer');
  const comboTextElement = document.getElementById('comboText');
  const audioToggleBtn = document.getElementById('audioToggle');
  const slowBar = document.getElementById('slowBar');
  const canvasContainer = document.querySelector('.canvas-container');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const finalScoreElement = document.getElementById('finalScore');
  const finalHitsElement = document.getElementById('finalHits');
  const restartBtn = document.getElementById('restartBtn');

  ctx.imageSmoothingEnabled = false;

  let totalScore = 0;
  let totalHits = 0;
  const TOTAL_OBJECTS = 25;
  const items = [];
  const effects = [];
  const particles = []; // Partículas de explosión pixelada

  // Lógica de Cámara Lenta (Bullet Time)
  let energyPower = 0;
  const MAX_POWER = 100;
  let isSlowMotion = false;
  let timeFactor = 1.0;

  // Lógica de Combo / Racha
  let comboCount = 0;
  let comboMultiplier = 1;
  let lastHitTime = 0;
  const COMBO_TIMEOUT = 1800; // 1.8 segundos para encadenar golpes

  // Lógica de Time Attack (60 Segundos)
  let timeRemaining = 60;
  let isGameOver = false;
  let timerInterval = null;

  let mouseX = -100;
  let mouseY = -100;
  let currentCursorKey = 'cursorKick';

  // Configuración de Audio MP3
  const bgMusic = new Audio('assets/spooky-bgm.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.5;
  let isMusicPlaying = false;
  let isMuted = false;

  function playBackgroundMusic() {
    if (!isMusicPlaying && !isMuted && !isGameOver) {
      bgMusic.play().then(() => {
        isMusicPlaying = true;
      }).catch(err => {
        console.log("Audio a la espera de interacción");
      });
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!isGameOver) {
        timeRemaining--;
        if (timerElement) timerElement.textContent = `${timeRemaining}s`;

        if (timeRemaining <= 0) {
          endGame();
        }
      }
    }, 1000);
  }

  function endGame() {
    isGameOver = true;
    clearInterval(timerInterval);
    bgMusic.pause();
    isMusicPlaying = false;
    
    if (finalScoreElement) finalScoreElement.textContent = String(totalScore).padStart(4, '0');
    if (finalHitsElement) finalHitsElement.textContent = totalHits;
    if (gameOverScreen) {
      gameOverScreen.classList.remove('d-none');
      gameOverScreen.classList.add('d-flex');
    }
  }

  function resetGame() {
    totalScore = 0;
    totalHits = 0;
    timeRemaining = 60;
    energyPower = 0;
    isSlowMotion = false;
    timeFactor = 1.0;
    comboCount = 0;
    comboMultiplier = 1;
    isGameOver = false;

    if (scoreElement) scoreElement.textContent = "0000";
    if (timerElement) timerElement.textContent = "60s";
    if (comboTextElement) comboTextElement.textContent = "1x";
    if (canvasContainer) canvasContainer.classList.remove('slow-active');
    if (gameOverScreen) {
      gameOverScreen.classList.remove('d-flex');
      gameOverScreen.classList.add('d-none');
    }

    items.forEach(item => item.reset());
    startTimer();
    playBackgroundMusic();
  }

  if (restartBtn) restartBtn.addEventListener('click', resetGame);

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      if (isMuted) {
        bgMusic.pause();
        isMusicPlaying = false;
        audioToggleBtn.innerHTML = '<i class="bi bi-volume-mute-fill me-1"></i> AUDIO: OFF';
        audioToggleBtn.classList.replace('btn-outline-warning', 'btn-outline-danger');
      } else {
        playBackgroundMusic();
        audioToggleBtn.innerHTML = '<i class="bi bi-volume-up-fill me-1"></i> AUDIO: ON';
        audioToggleBtn.classList.replace('btn-outline-danger', 'btn-outline-warning');
      }
    });
  }

  // Web Audio API Chiptune
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx;

  function playHitSound(pitch = 220) {
    if (isMuted) return;
    playBackgroundMusic();
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.log('Error de audio');
    }
  }

  // Carga de imágenes
  const images = {};
  const imageSources = {
    dojangBg: 'assets/img/dojang.jpg',
    calabaza: 'assets/img/calabaza.png',
    fantasma: 'assets/img/fantasma.png',
    calavera: 'assets/img/calavera.png',
    cursorFist: 'assets/img/cursor-fist.png',
    cursorKick: 'assets/img/cursor-king.png'
  };

  Object.keys(imageSources).forEach(key => {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = () => { images[key].loaded = true; };
    images[key].onerror = () => { images[key].loaded = false; };
  });

  const itemTypes = [
    { type: 'CALABAZA', name: 'Calabaza Taekwondo', imgKey: 'calabaza', color: '#ff6700' },
    { type: 'FANTASMA', name: 'Fantasma Dojang', imgKey: 'fantasma', color: '#9d4edd' },
    { type: 'CALAVERA', name: 'Calaverita de Azúcar', imgKey: 'calavera', color: '#dc3545' }
  ];

  const motionTypes = ['UP', 'DOWN', 'DIAGONAL', 'SPIRAL'];

  class TKDItem {
    constructor(id) {
      this.id = id;
      this.radius = 26;
      this.reset();
    }

    reset() {
      this.x = Math.random() * (canvas.width - 100) + 50;
      this.y = Math.random() * (canvas.height - 100) + 50;
      this.itemData = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      this.motion = motionTypes[Math.floor(Math.random() * motionTypes.length)];
      
      const speed = 1.5 + Math.random() * 2.8;
      this.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
      this.vy = (Math.random() > 0.5 ? 1 : -1) * speed;

      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1);
      this.radiusOffset = Math.random() * 50 + 20;
      this.centerX = this.x;
      this.centerY = this.y;
    }

    update() {
      const effectiveVx = this.vx * timeFactor;
      const effectiveVy = this.vy * timeFactor;

      switch (this.motion) {
        case 'UP':
          this.y -= Math.abs(effectiveVy);
          if (this.y - this.radius < 0) this.y = canvas.height + this.radius;
          break;

        case 'DOWN':
          this.y += Math.abs(effectiveVy);
          if (this.y + this.radius > canvas.height) this.y = -this.radius;
          break;

        case 'DIAGONAL':
          this.x += effectiveVx;
          this.y += effectiveVy;
          if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) this.vx *= -1;
          if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) this.vy *= -1;
          break;

        case 'SPIRAL':
          this.angle += this.angularSpeed * timeFactor;
          this.radiusOffset += 0.2 * timeFactor;
          this.x = this.centerX + Math.cos(this.angle) * this.radiusOffset;
          this.y = this.centerY + Math.sin(this.angle) * this.radiusOffset;
          if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.radiusOffset > 180) {
            this.reset();
          }
          break;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(Math.floor(this.x), Math.floor(this.y));

      const img = images[this.itemData.imgKey];

      if (img && img.loaded) {
        ctx.drawImage(img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      } else {
        ctx.fillStyle = this.itemData.color;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
      }

      ctx.restore();
    }
  }

  // Clase de Partícula de Explosión Pixelada
  class PixelParticle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = Math.floor(Math.random() * 5 + 3);
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 1.0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.05;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
      ctx.restore();
    }
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      particles.push(new PixelParticle(x, y, color));
    }
  }

  class ImpactEffect {
    constructor(x, y, text, color = '#ffff00') {
      this.x = x;
      this.y = y;
      this.text = text;
      this.life = 1.0;
      this.scale = 0.8;
      this.color = color;
    }

    update() {
      this.life -= 0.04;
      this.scale += 0.04;
      this.y -= 1;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.translate(Math.floor(this.x), Math.floor(this.y));
      ctx.scale(this.scale, this.scale);

      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(this.text, 0, 0);
      ctx.fillText(this.text, 0, 0);

      ctx.restore();
    }
  }

  function updateSlowMotionBar() {
    if (isSlowMotion) {
      energyPower -= 0.4;
      if (energyPower <= 0) {
        energyPower = 0;
        isSlowMotion = false;
        timeFactor = 1.0;
        if (canvasContainer) canvasContainer.classList.remove('slow-active');
      }
    }

    if (slowBar) {
      const percentage = Math.max(0, Math.min(100, energyPower));
      slowBar.style.width = `${percentage}%`;

      if (isSlowMotion) {
        slowBar.textContent = "¡CÁMARA LENTA ACTIVA!";
        slowBar.className = "progress-bar bg-info progress-bar-striped progress-bar-animated text-dark fw-bold retro-text-sm";
      } else {
        slowBar.textContent = `ENERGÍA: ${Math.floor(percentage)}%`;
        slowBar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated text-dark fw-bold retro-text-sm";
      }
    }
  }

  function drawDojangBackground() {
    const bgImg = images['dojangBg'];

    if (bgImg && bgImg.loaded) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0a0512';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (isSlowMotion) {
      ctx.fillStyle = 'rgba(0, 180, 255, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const darkness = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 120,
      canvas.width / 2, canvas.height / 2, 480
    );
    darkness.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    darkness.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = darkness;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 2);
    }
  }

  function checkCollisions() {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);

        if (distance < a.radius + b.radius) {
          a.vx *= -1;
          a.vy *= -1;
          b.vx *= -1;
          b.vy *= -1;
          effects.push(new ImpactEffect((a.x + b.x) / 2, (a.y + b.y) / 2, 'BOOM!', '#ff0000'));
        }
      }
    }
  }

  for (let i = 0; i < TOTAL_OBJECTS; i++) {
    items.push(new TKDItem(i));
  }

  startTimer();

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouseX = -100;
    mouseY = -100;
  });

  canvas.addEventListener('click', (e) => {
    if (isGameOver) return;
    playBackgroundMusic();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const now = Date.now();
    
    // Verificación de Racha / Combo
    if (now - lastHitTime < COMBO_TIMEOUT) {
      comboCount++;
      if (comboCount >= 5) comboMultiplier = 3;
      else if (comboCount >= 2) comboMultiplier = 2;
    } else {
      comboCount = 1;
      comboMultiplier = 1;
    }
    lastHitTime = now;

    if (comboTextElement) comboTextElement.textContent = `${comboMultiplier}x`;

    items.forEach(item => {
      const dist = Math.hypot(mx - item.x, my - item.y);
      if (dist < item.radius + 12) {
        
        let basePoints = 0;

        if (item.itemData.type === 'CALAVERA') {
          basePoints = 3;
          currentCursorKey = 'cursorKick';
          playHitSound(350);
          spawnParticles(item.x, item.y, '#dc3545');
        } else if (item.itemData.type === 'CALABAZA') {
          basePoints = 1;
          currentCursorKey = 'cursorFist';
          playHitSound(180);
          spawnParticles(item.x, item.y, '#ff6700');
        } else {
          basePoints = 2;
          currentCursorKey = 'cursorKick';
          playHitSound(260);
          spawnParticles(item.x, item.y, '#9d4edd');
        }

        const earnedPoints = basePoints * comboMultiplier;
        totalScore += earnedPoints;
        totalHits += 1;

        if (!isSlowMotion) {
          energyPower += (earnedPoints / 20) * 100;
          if (energyPower >= MAX_POWER) {
            energyPower = MAX_POWER;
            isSlowMotion = true;
            timeFactor = 0.3;
            if (canvasContainer) canvasContainer.classList.add('slow-active');
            effects.push(new ImpactEffect(canvas.width / 2, canvas.height / 2, '¡BULLET TIME!', '#00ffff'));
          }
        }
        
        if (scoreElement) scoreElement.textContent = String(totalScore).padStart(4, '0');

        effects.push(new ImpactEffect(item.x, item.y, `+${earnedPoints} PTS`));
        item.reset();
      }
    });
  });

  function drawCustomCursor() {
    if (mouseX >= 0 && mouseY >= 0 && !isGameOver) {
      const cursorImg = images[currentCursorKey];
      ctx.save();
      if (cursorImg && cursorImg.loaded) {
        ctx.drawImage(cursorImg, Math.floor(mouseX - 18), Math.floor(mouseY - 18), 36, 36);
      } else {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(Math.floor(mouseX - 6), Math.floor(mouseY - 6), 12, 12);
      }
      ctx.restore();
    }
  }

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateSlowMotionBar();
    drawDojangBackground();

    if (!isGameOver) {
      checkCollisions();

      items.forEach(item => {
        item.update();
        item.draw();
      });

      // Actualizar y dibujar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      // Actualizar y dibujar textos flotantes
      for (let i = effects.length - 1; i >= 0; i--) {
        effects[i].update();
        effects[i].draw();
        if (effects[i].life <= 0) effects.splice(i, 1);
      }

      drawCustomCursor();
    }

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});