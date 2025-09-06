
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const toastEl = document.getElementById('toast');

  // ========================
  // Ajuste de tela / DPR
  // ========================
  let DPR = 1;
  let W = 0, H = 0;

  function resize() {
    DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);

    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);

    // Reposiciona o pássaro no estado de pronto
    if (state === STATE.READY) {
      placeBird();
    }
  }

  window.addEventListener('resize', resize);

  // ========================
  // Estado do jogo
  // ========================
  const STATE = { READY: 0, PLAYING: 1, GAMEOVER: 2 };
  let state = STATE.READY;

  // Mundo
  const GROUND_H = 88;
  let speed = 250;        // px/s
  const speedGain = 0.02; // aceleração por segundo

  // Pássaro
  const bird = {
    x: 0, y: 0, r: 16,
    vy: 0,
    color: css('--bird'),
    beak: css('--bird-beak')
  };
  const GRAVITY = 2200;  // px/s²
  const FLAP = -520;     // impulso do "bater asas"
  const MAX_FALL = 900;  // terminal
  const MAX_RISE = -700;

  // Pipes (canos)
  const pipes = [];
  const PIPE_W = 72;
  let spawnTimer = 0;
  let minGap = 120;
  let maxGap = 170;
  let gapCurrent = maxGap;

  // Score
  let score = 0;
  let best = Number(localStorage.getItem('flappyBest') || 0);
  bestEl.textContent = best;

  // Util
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function placeBird() {
    bird.x = Math.max(90, Math.min(120, W * 0.28));
    bird.y = H * 0.45;
    bird.vy = 0;
  }

  function reset() {
    score = 0;
    scoreEl.textContent = score;
    speed = 250;
    gapCurrent = maxGap;
    pipes.length = 0;
    spawnTimer = 0.1;
    state = STATE.READY;
    placeBird();
    toast('Toque para começar');
  }

  function start() {
    state = STATE.PLAYING;
    toast('Bora! 🐤');
  }

  function gameOver() {
    state = STATE.GAMEOVER;
    if (score > best) {
      best = score;
      localStorage.setItem('flappyBest', String(best));
      bestEl.textContent = best;
    }
    toast('Game Over • Toque para reiniciar');
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => (toastEl.hidden = true), 2200);
  }

  // ========================
  // Entrada (toque/clique)
  // ========================
  function onInput(e) {
    if (e.cancelable) e.preventDefault();
    if (state === STATE.GAMEOVER) {
      reset();
      return;
    }
    if (state === STATE.READY) {
      start();
      flap();
      return;
    }
    if (state === STATE.PLAYING) {
      flap();
    }
  }

  function flap() {
    bird.vy = Math.max(FLAP, MAX_RISE);
  }

  canvas.addEventListener('touchstart', onInput, { passive: false });
  canvas.addEventListener('mousedown', onInput);
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp'].includes(e.key)) onInput(e);
  });

  // ========================
  // Loop principal
  // ========================
  let last = 0;
  function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.033, (ts - last) / 1000); // cap 33ms
    last = ts;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  // ========================
  // Atualização
  // ========================
  function update(dt) {
    if (state !== STATE.PLAYING) return;

    // Acelera aos poucos + reduz o gap gradualmente (dificuldade)
    speed += speedGain;
    gapCurrent = Math.max(minGap, gapCurrent - 2 * dt); // fecha ~2px/s

    // Física do pássaro
    bird.vy += GRAVITY * dt;
    bird.vy = Math.min(bird.vy, MAX_FALL);
    bird.y += bird.vy * dt;

    // Teto / Chão
    if (bird.y - bird.r < 0) {
      bird.y = bird.r;
      bird.vy = 0;
      gameOver();
    }
    if (bird.y + bird.r > H - GROUND_H) {
      bird.y = H - GROUND_H - bird.r;
      gameOver();
    }

    // Pipes
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnPipe();
      // Distância entre canos em função da velocidade
      const spacing = 1.05 + Math.random() * 0.45; // 1.05s a 1.5s
      spawnTimer = spacing;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= speed * dt;

      // Pontuação quando o pássaro passa o cano
      if (!p.passed && p.x + PIPE_W < bird.x - bird.r) {
        p.passed = true;
        score++;
        scoreEl.textContent = score;
      }

      // Colisão
      if (collidePipe(bird, p)) {
        gameOver();
      }

      // Limpa fora da tela
      if (p.x + PIPE_W < -120) {
        pipes.splice(i, 1);
      }
    }
  }

  function spawnPipe() {
    const marginTop = 40;
    const marginBottom = 40 + GROUND_H;
    // posição do centro do gap
    const gapY = random(marginTop + gapCurrent / 2, H - marginBottom - gapCurrent / 2);
    const x = W + 40;
    pipes.push({
      x,
      gapY,
      gapH: gapCurrent,
      passed: false
    });
  }

  function collidePipe(b, p) {
    // Dois retângulos: superior e inferior. Fazemos checagem simples.
    const topRect = { x: p.x, y: 0, w: PIPE_W, h: p.gapY - p.gapH / 2 };
    const botRect = { x: p.x, y: p.gapY + p.gapH / 2, w: PIPE_W, h: (H - GROUND_H) - (p.gapY + p.gapH / 2) };

    return circleRect(b.x, b.y, b.r, topRect.x, topRect.y, topRect.w, topRect.h) ||
           circleRect(b.x, b.y, b.r, botRect.x, botRect.y, botRect.w, botRect.h);
  }

  // ========================
  // Desenho
  // ========================
  function draw() {
    // Fundo
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawParallax();

    // Pipes
    for (const p of pipes) drawPipe(p);

    // Chão
    drawGround();

    // Pássaro
    drawBird();

    // UI de estado
    if (state === STATE.READY) {
      drawCenterText('Toque para começar', W / 2, H * 0.33, 28);
      drawCenterText('Toque na tela para bater as asas', W / 2, H * 0.33 + 36, 16, 0.8);
    } else if (state === STATE.GAMEOVER) {
      drawCenterText('GAME OVER', W / 2, H * 0.33, 40);
      drawCenterText('Toque para reiniciar', W / 2, H * 0.33 + 46, 18, 0.9);
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, css('--bg1'));
    g.addColorStop(1, css('--bg2'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawParallax() {
    // Estrelas/nuances
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 12; i++) {
      const w = 120, h = 10;
      const x = ((i * 200 - performance.now() * 0.025) % (W + 200)) - 100;
      const y = Math.round(H * 0.18 + (i % 4) * 22);
      ctx.fillRect(x, y, w, h);
    }
  }

  function drawPipe(p) {
    const pipeColor = css('--pipe');
    const pipeDark = css('--pipe-dark');
    const x = p.x;
    const w = PIPE_W;
    const topH = p.gapY - p.gapH / 2;
    const botY = p.gapY + p.gapH / 2;
    const botH = (H - GROUND_H) - botY;

    // Topo
    ctx.fillStyle = pipeColor;
    roundRect(ctx, x, 0, w, topH, 10, true, false);
    // Base escura
    ctx.fillStyle = pipeDark;
    ctx.fillRect(x, topH - 10, w, 10);

    // Inferior
    ctx.fillStyle = pipeColor;
    roundRect(ctx, x, botY, w, botH, 10, true, false);
    // Base escura
    ctx.fillStyle = pipeDark;
    ctx.fillRect(x, botY, w, 10);

    // Brilho lateral
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 6, (topH > 0 ? 0 : botY) + 6, 8, Math.max(0, topH - 12));
    ctx.fillRect(x + 6, botY + 6, 8, Math.max(0, botH - 12));
  }

  function drawGround() {
    ctx.fillStyle = css('--ground');
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

    // Textura
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    const t = performance.now() * 0.2;
    for (let i = 0; i < W / 28 + 2; i++) {
      const x = ((i * 28 - t) % (W + 56)) - 28;
      ctx.fillRect(x, H - GROUND_H + 10, 18, 4);
      ctx.fillRect(x + 6, H - GROUND_H + 26, 14, 4);
      ctx.fillRect(x + 10, H - GROUND_H + 42, 12, 4);
    }
    ctx.globalAlpha = 1;
  }

  function drawBird() {
    // Inclinação baseada na velocidade vertical
    const tilt = clamp((bird.vy + 300) / 900, -0.6, 0.9); // rad aproximado
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(tilt);

    // Corpo
    ctx.fillStyle = bird.color;
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();

    // Asa (oval)
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(-4, 2, bird.r * 0.7, bird.r * 0.45, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Bico (triângulo)
    ctx.fillStyle = bird.beak;
    ctx.beginPath();
    ctx.moveTo(bird.r - 2, -4);
    ctx.lineTo(bird.r + 12, 0);
    ctx.lineTo(bird.r - 2, 4);
    ctx.closePath();
    ctx.fill();

    // Olho
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4, -6, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5.5, -6, 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Sombra no chão
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    const shadowScale = 0.7 + 0.3 * Math.max(0, 1 - (H - GROUND_H - bird.r - bird.y) / 220);
    ctx.beginPath();
    ctx.ellipse(bird.x, H - GROUND_H + 6, bird.r * shadowScale, bird.r * 0.4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ========================
  // Utilidades
  // ========================
  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= cr * cr;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function random(a, b) { return a + Math.random() * (b - a); }

  function roundRect(ctx, x, y, w, h, r = 8, fill = true, stroke = false) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // ========================
  // Inicialização
  // ========================
  resize();
  reset();
  requestAnimationFrame(loop);

})();
