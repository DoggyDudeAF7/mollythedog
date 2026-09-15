import { assets } from './data.js';

/* These games use the shared session for input, time, sound and cleanup. */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isTyping = e => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

function controls(ctx, markup, note) {
  const box = document.createElement('div');
  box.className = 'game-controls action-controls';
  box.innerHTML = markup;
  ctx.root.append(box);
  if (note) {
    const p = document.createElement('p');
    p.className = 'control-note action-note';
    p.textContent = note;
    ctx.root.append(p);
  }
  return box;
}

function actionKey(ctx, codes, fn) {
  ctx.on(document, 'keydown', e => {
    if (!isTyping(e) && codes.includes(e.code) && !e.repeat) {
      // Leave the session's Pause and Restart buttons with their native controls.
      if (e.target.closest?.('.session-controls')) return;
      e.preventDefault();
      fn();
    }
  });
}

function holdButton(ctx, button, key) {
  ctx.on(button, 'pointerdown', e => {
    e.preventDefault();
    button.setPointerCapture?.(e.pointerId);
    ctx.keys.add(key);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    ctx.on(button, event, () => ctx.keys.delete(key));
  }
  ctx.on(button, 'keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      ctx.keys.add(key);
    }
  });
  ctx.on(button, 'keyup', () => ctx.keys.delete(key));
  ctx.on(button, 'blur', () => ctx.keys.delete(key));
}

function rounded(g, x, y, w, h, radius, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, Math.max(.1, w), h, radius);
  g.fill();
}

function sprite(g, img, x, y, size, rotate = 0) {
  if (!img.complete || !img.naturalWidth) return;
  g.save();
  g.translate(x, y);
  g.rotate(rotate);
  const ratio = img.naturalWidth / img.naturalHeight;
  g.drawImage(img, -size * Math.min(1, ratio) / 2, -size * Math.min(1, 1 / ratio) / 2,
    size * Math.min(1, ratio), size * Math.min(1, 1 / ratio));
  g.restore();
}

function sparkles(g, particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 270 * dt;
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    g.globalAlpha = Math.min(1, p.life * 2);
    rounded(g, p.x, p.y, p.size || 5, p.size || 5, 2, p.color);
  }
  g.globalAlpha = 1;
}

function burst(particles, x, y, color, count = 12) {
  for (let i = 0; i < count; i++) particles.push({
    x, y, color, vx: (Math.random() - .5) * 220,
    vy: -80 - Math.random() * 160, life: .4 + Math.random() * .5,
  });
}

function landscape(g, w, h, t, mode = 'garden') {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, mode === 'hall' ? '#282037' : '#172c37');
  sky.addColorStop(1, mode === 'hall' ? '#49303d' : '#315446');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  if (mode === 'hall') {
    for (let x = -(t * 20) % 180; x < w; x += 180) {
      rounded(g, x + 34, 42, 100, 130, 10, '#ae7e8a12');
      rounded(g, x + 43, 51, 82, 112, 6, '#100f1f44');
      g.fillStyle = '#d9b99c';
      g.globalAlpha = .25;
      g.beginPath(); g.arc(x + 84, 103, 19, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
  } else {
    g.fillStyle = '#dfe7bf';
    g.globalAlpha = .2;
    g.beginPath(); g.arc(w - 95, 80, 35, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const x = i * 155 - 40;
      g.fillStyle = '#1f403d';
      g.beginPath(); g.ellipse(x, h - 95, 145, 100 + i % 2 * 30, 0, 0, Math.PI * 2); g.fill();
    }
  }
}

function treatCatch(ctx) {
  const { canvas, g, w, h, point } = ctx.canvas(720, 520);
  canvas.classList.add('action-playfield');
  canvas.setAttribute('aria-label', 'Treat Catch. Move Molly beneath bones and away from red rain clouds.');
  const molly = ctx.image(assets.molly), bone = ctx.image(assets.bone);
  const pad = controls(ctx,
    '<button class="game-button action-arrow" aria-label="Move Molly left">←</button><span class="action-control-label">MOVE MOLLY</span><button class="game-button action-arrow" aria-label="Move Molly right">→</button>',
    'Bones +25 · Red rain clouds cost a heart. Drag anywhere in the garden, or hold ← / → or A / D.');
  holdButton(ctx, pad.querySelectorAll('button')[0], 'CatchLeft');
  holdButton(ctx, pad.querySelectorAll('button')[1], 'CatchRight');
  let x = w / 2, target = x, score = 0, lives = 3, caught = 0, nextDrop = .5, immuneUntil = 0, combo = 0;
  const drops = [], particles = [];
  const steer = e => { target = clamp(point(e).x, 44, w - 44); };
  ctx.on(canvas, 'pointerdown', e => { e.preventDefault(); canvas.setPointerCapture?.(e.pointerId); steer(e); });
  ctx.on(canvas, 'pointermove', e => { if (e.buttons || canvas.hasPointerCapture?.(e.pointerId)) steer(e); });
  ctx.status('A snack shower is on its way. Catch the bones; dodge the red rain clouds.');
  ctx.frame((dt, t) => {
    const left = ['ArrowLeft', 'KeyA', 'CatchLeft'].some(k => ctx.keys.has(k));
    const right = ['ArrowRight', 'KeyD', 'CatchRight'].some(k => ctx.keys.has(k));
    if (left || right) target = clamp(x + (Number(right) - Number(left)) * 470 * dt, 44, w - 44);
    x += clamp(target - x, -760 * dt, 760 * dt);
    if (t >= nextDrop) {
      const hazard = Math.random() < .23;
      drops.push({ x: 40 + Math.random() * (w - 80), y: -32, speed: 160 + t * 2.4 + Math.random() * 65, hazard, rotation: Math.random() * .6 });
      nextDrop = t + Math.max(.37, .68 - t * .0055);
    }
    landscape(g, w, h, t);
    rounded(g, 0, h - 48, w, 48, 0, '#23332f');
    g.fillStyle = '#668773'; g.fillRect(0, h - 48, w, 3);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.speed * dt;
      if (d.y > h - 104 && d.y < h - 25 && Math.abs(d.x - x) < 43) {
        drops.splice(i, 1);
        if (d.hazard) {
          if (t >= immuneUntil) {
            lives--; combo = 0; immuneUntil = t + 1.1;
            burst(particles, x, h - 80, '#ff91a5');
            ctx.sound('bad'); ctx.status('A rainy surprise! Find a clear patch of garden.');
          }
        } else {
          caught++; combo++; score += 25 + (combo % 5 === 0 ? 25 : 0);
          burst(particles, d.x, d.y, '#ffe3a0', 8);
          ctx.sound('good');
          if (combo % 5 === 0) ctx.status(`${combo} treats in a row! A 25-point snack bonus.`);
        }
        continue;
      }
      if (d.y > h + 35) { drops.splice(i, 1); if (!d.hazard) combo = 0; continue; }
      g.beginPath(); g.arc(d.x, d.y, 25, 0, Math.PI * 2);
      g.fillStyle = d.hazard ? '#82374c' : '#f8d39322'; g.fill();
      if (d.hazard) {
        g.font = '26px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#fff0ef'; g.fillText('☂', d.x, d.y - 1);
      } else sprite(g, bone, d.x, d.y, 45, Math.sin(t * 3 + d.rotation) * .25);
    }
    g.fillStyle = '#0003'; g.beginPath(); g.ellipse(x, h - 33, 42, 9, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = t < immuneUntil && Math.floor(t * 12) % 2 ? .35 : 1;
    sprite(g, molly, x, h - 72, 108, Math.sin(t * 5) * .035); g.globalAlpha = 1;
    sparkles(g, particles, dt);
    ctx.hud({ Score: score, Treats: caught, Hearts: '♥'.repeat(lives) || '—', Time: `${Math.max(0, Math.ceil(45 - t))}s` });
    if (lives <= 0) ctx.finish({ score, won: false, message: `${caught} treats caught! Watch the red rain clouds on your next snack run.` });
    else if (t >= 45) ctx.finish({ score: score + lives * 75, won: true, message: `Snack time complete: ${caught} treats and ${lives} hearts left. Molly approves.` });
  });
}

function mollyDash(ctx) {
  const { canvas, g, w, h } = ctx.canvas(780, 480);
  canvas.classList.add('action-playfield');
  canvas.setAttribute('aria-label', 'Molly Dash. Jump flowerpots and collect treats with Space, Up or the Jump button.');
  const molly = ctx.image(assets.molly), bone = ctx.image(assets.bone), ground = h - 65, playerX = 125;
  const pad = controls(ctx, '<button class="primary-button action-main-button">Jump! <span>Space / ↑</span></button>',
    'Reach the finish in 60 seconds. Jump the flowerpots; catch golden bones. You have three hearts.');
  let y = ground, vy = 0, lives = 3, treats = 0, score = 0, nextSpawn = 1.1, immuneUntil = 0, distance = 0, bufferedUntil = 0;
  const objects = [], particles = [];
  const jump = () => { bufferedUntil = ctx.elapsed + .15; };
  ctx.on(pad.querySelector('button'), 'pointerdown', e => { e.preventDefault(); jump(); });
  ctx.on(pad.querySelector('button'), 'click', e => { if (e.detail === 0) jump(); });
  actionKey(ctx, ['Space', 'ArrowUp', 'KeyW'], jump);
  ctx.on(canvas, 'pointerdown', e => { e.preventDefault(); jump(); });
  ctx.status('The hallway is open. Jump the flowerpots and bring home the treats.');
  ctx.frame((dt, t) => {
    const speed = 245 + t * 3.1;
    distance += speed * dt;
    if (y >= ground && bufferedUntil > t) { vy = -650; bufferedUntil = 0; ctx.sound('tap'); }
    vy += 1610 * dt; y = Math.min(ground, y + vy * dt); if (y >= ground) vy = 0;
    if (t >= nextSpawn && t < 58) {
      const height = 52 + Math.random() * 28;
      objects.push({ type: 'pot', x: w + 40, width: 40 + Math.random() * 14, height, hit: false });
      objects.push({ type: 'bone', x: w + 45, y: ground - height - 65, width: 33, hit: false });
      if (Math.random() > .45) objects.push({ type: 'bone', x: w + 130, y: ground - 35, width: 33, hit: false });
      nextSpawn = t + 1.65 - Math.min(t, 55) * .009 + Math.random() * .32;
    }
    landscape(g, w, h, distance / 100, 'hall');
    g.fillStyle = '#241d2c'; g.fillRect(0, ground + 2, w, h - ground);
    g.fillStyle = '#b5897877'; g.fillRect(0, ground + 2, w, 4);
    for (let fx = -(distance % 100); fx < w; fx += 100) {
      g.strokeStyle = '#b589781c'; g.beginPath(); g.moveTo(fx, ground + 5); g.lineTo(fx - 35, h); g.stroke();
    }
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i]; o.x -= speed * dt;
      if (o.x < -90) { objects.splice(i, 1); continue; }
      if (o.type === 'pot') {
        const touching = Math.abs(o.x - playerX) < o.width / 2 + 23 && y > ground - o.height + 14;
        if (touching && !o.hit && t >= immuneUntil) {
          o.hit = true; lives--; immuneUntil = t + 1.35;
          burst(particles, playerX, y - 35, '#ff9dab'); ctx.sound('bad');
          ctx.status('A flowerpot tumble. Three, two, one… find your rhythm again.');
        }
        rounded(g, o.x - o.width / 2, ground - o.height + 19, o.width, o.height - 19, 7, o.hit ? '#66505a' : '#bb7d62');
        rounded(g, o.x - o.width / 2 - 5, ground - o.height + 12, o.width + 10, 12, 4, '#e7ac80');
        g.strokeStyle = '#7ca78c'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(o.x, ground - o.height + 14); g.lineTo(o.x, ground - o.height - 9); g.stroke();
        g.fillStyle = '#85b78e';
        g.beginPath(); g.ellipse(o.x - 8, ground - o.height + 1, 13, 5, .5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(o.x + 8, ground - o.height - 5, 13, 5, -.5, 0, Math.PI * 2); g.fill();
      } else if (!o.hit) {
        if (Math.abs(o.x - playerX) < 42 && Math.abs(o.y - (y - 41)) < 45) {
          o.hit = true; treats++; burst(particles, o.x, o.y, '#ffe2a0', 8); ctx.sound('good');
        } else sprite(g, bone, o.x, o.y + Math.sin(t * 4) * 4, 43, .3);
      }
    }
    g.fillStyle = '#0004'; g.beginPath(); g.ellipse(playerX, ground + 4, 35, 8, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = t < immuneUntil && Math.floor(t * 12) % 2 ? .35 : 1;
    sprite(g, molly, playerX, y - 43, 105, y === ground ? Math.sin(t * 15) * .055 : -.09); g.globalAlpha = 1;
    sparkles(g, particles, dt);
    rounded(g, 24, 20, w - 48, 7, 4, '#ffffff16');
    rounded(g, 24, 20, (w - 48) * Math.min(t / 60, 1), 7, 4, '#e9bd91');
    score = Math.floor(t * 10) + treats * 50;
    ctx.hud({ Score: score, Treats: treats, Hearts: '♥'.repeat(lives) || '—', Finish: `${Math.max(0, Math.ceil(60 - t))}s` });
    if (lives <= 0) ctx.finish({ score, won: false, message: `Molly ran for ${Math.floor(t)} seconds and found ${treats} treats. Jump just before each flowerpot.` });
    else if (t >= 60) ctx.finish({ score: score + lives * 100, won: true, message: `The finish line! ${treats} treats collected. A well-earned victory nap awaits.` });
  });
}

function fetch(ctx) {
  const { canvas, g, w, h } = ctx.canvas(780, 480);
  canvas.classList.add('action-playfield');
  canvas.setAttribute('aria-label', 'Fetch throwing field. Adjust angle and power, then throw into the moving green landing zone.');
  const shaina = ctx.image(assets.shaina), ballImage = ctx.image(assets.ball), ground = h - 63;
  const pad = controls(ctx,
    '<label for="fetch-angle">Angle <input id="fetch-angle" type="range" min="20" max="75" value="50"><output for="fetch-angle">50°</output></label>' +
    '<label for="fetch-power">Power <input id="fetch-power" type="range" min="30" max="100" value="70"><output for="fetch-power">70%</output></label>' +
    '<button class="primary-button action-main-button">Throw! <span>Enter</span></button>',
    'Five throws. Land three in the green zone to win. The target keeps moving while the ball flies. Sliders work with arrow keys.');
  pad.classList.add('fetch-controls');
  const angleInput = pad.querySelector('#fetch-angle'), powerInput = pad.querySelector('#fetch-power'), button = pad.querySelector('button');
  let angle = 50, power = 70, throws = 0, hits = 0, score = 0, ball = null, state = 'ready', landing = null, targetX = 510;
  const targetWidth = 130, particles = [];
  const targetAt = t => 525 + Math.sin(t * .75) * 135;
  const velocity = () => { const v = 270 + power * 5.5, a = angle * Math.PI / 180; return { vx: Math.cos(a) * v, vy: -Math.sin(a) * v }; };
  for (const input of [angleInput, powerInput]) ctx.on(input, 'input', () => {
    angle = Number(angleInput.value); power = Number(powerInput.value);
    pad.querySelectorAll('output')[0].value = `${angle}°`; pad.querySelectorAll('output')[1].value = `${power}%`;
  });
  function throwBall() {
    if (state !== 'ready') return;
    state = 'flying'; throws++; landing = null;
    ball = { x: 78, y: ground - 30, ...velocity(), rotation: 0 };
    button.disabled = angleInput.disabled = powerInput.disabled = true;
    ctx.sound('tap'); ctx.status(`Throw ${throws} is in the air. Come on, Shaina!`);
  }
  ctx.on(button, 'click', throwBall);
  actionKey(ctx, ['Space'], throwBall);
  function settle(x) {
    const distance = Math.abs(x - targetX), hit = distance <= targetWidth / 2;
    const earned = hit ? 150 + Math.round((1 - distance / (targetWidth / 2)) * 100) : distance < 110 ? 25 : 0;
    score += earned; hits += Number(hit); state = 'landed';
    landing = { x, hit, label: hit ? `FETCHED! +${earned}` : earned ? 'SO CLOSE! +25' : 'TRY ANOTHER ARC', at: ctx.elapsed };
    burst(particles, clamp(x, 15, w - 15), ground - 15, hit ? '#c7edac' : '#e0aa91');
    ctx.sound(hit ? 'good' : 'bad');
    ctx.status(hit ? `Right in the zone! ${hits} successful ${hits === 1 ? 'fetch' : 'fetches'}.` : 'A little wide. Adjust the next throw for the moving target.');
    ctx.later(() => {
      if (throws >= 5) {
        ctx.finish({ score, won: hits >= 3, message: `${hits} of 5 balls fetched. ${hits >= 3 ? 'Shaina would happily do that all afternoon.' : 'Land three throws to win. Watch where the zone is going, then adjust your power.'}` });
      } else {
        state = 'ready'; ball = null;
        button.disabled = angleInput.disabled = powerInput.disabled = false;
        ctx.status(`Throw ${throws + 1} of 5. Adjust your angle and power, then throw.`);
      }
    }, 1100);
  }
  ctx.status('A little aim, a little timing. Land at least three balls in the moving green zone.');
  ctx.frame((dt, t) => {
    targetX = targetAt(t);
    landscape(g, w, h, t);
    g.fillStyle = '#273d32'; g.fillRect(0, ground, w, h - ground);
    g.strokeStyle = '#628168'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, ground); g.lineTo(w, ground); g.stroke();
    rounded(g, targetX - targetWidth / 2, ground - 7, targetWidth, 20, 10, '#a3d6a666');
    rounded(g, targetX - 3, ground - 12, 6, 30, 3, '#d4efb7');
    g.fillStyle = '#d6edc4'; g.font = 'bold 13px system-ui'; g.textAlign = 'center'; g.fillText('LAND HERE', targetX, ground + 39);
    sprite(g, shaina, targetX, ground - 57, 111, Math.sin(t * 3) * .025);
    rounded(g, 45, ground - 8, 66, 15, 7, '#dfad86');
    if (state === 'ready') {
      sprite(g, ballImage, 78, ground - 30, 33);
      const v = velocity();
      for (let i = 1; i <= 12; i++) {
        const at = i * .045, px = 78 + v.vx * at, py = ground - 30 + v.vy * at + 390 * at * at;
        g.globalAlpha = .6 - i * .036; g.fillStyle = '#f9e8b8';
        g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }
    if (ball) {
      if (state === 'flying') {
        const oldX = ball.x, oldY = ball.y;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt + 390 * dt * dt; ball.vy += 780 * dt; ball.rotation += dt * 7;
        if (ball.y >= ground - 13 && ball.vy > 0) {
          const fraction = clamp((ground - 13 - oldY) / (ball.y - oldY), 0, 1);
          ball.x = oldX + (ball.x - oldX) * fraction; ball.y = ground - 13;
          settle(ball.x);
        } else if (ball.x > w + 140) { settle(ball.x); }
      }
      sprite(g, ballImage, ball.x, ball.y, 36, ball.rotation);
    }
    if (landing) {
      g.fillStyle = landing.hit ? '#d9f3bc' : '#ffe0c5'; g.font = 'bold 20px system-ui'; g.textAlign = 'center';
      g.fillText(landing.label, clamp(landing.x, 135, w - 135), ground - 155 - Math.min(15, (t - landing.at) * 12));
    }
    sparkles(g, particles, dt);
    ctx.hud({ Score: score, Throws: `${throws} / 5`, Fetched: `${hits} / 3 to win` });
  });
}

function treatStacker(ctx) {
  const { canvas, g, w, h } = ctx.canvas(720, 550);
  canvas.classList.add('action-playfield');
  canvas.setAttribute('aria-label', 'Treat Stacker. Drop each moving biscuit onto the tower with Space or Drop. Stack twelve levels.');
  const bone = ctx.image(assets.bone), molly = ctx.image(assets.molly);
  const pad = controls(ctx, '<button class="primary-button action-main-button">Drop treat <span>Space</span></button>',
    'Stack 12 treats. Overhangs fall away, so the next treat gets narrower. A perfectly aligned drop keeps the full width.');
  const button = pad.querySelector('button'), baseY = h - 74, blockHeight = 26;
  const stack = [{ x: 210, y: baseY, width: 300, color: '#805c59' }], fragments = [], particles = [];
  let level = 0, score = 0, perfect = 0, state = 'moving', direction = 1, active = null, flash = '', flashUntil = 0;
  const colors = ['#d59870', '#e2b581', '#bf8a70', '#dbab80', '#c69378'];
  function nextBlock() {
    const top = stack[stack.length - 1];
    direction = level % 2 === 0 ? 1 : -1;
    active = { x: direction > 0 ? 16 : w - top.width - 16, y: top.y - blockHeight - 62, width: top.width, vy: 0, color: colors[level % colors.length] };
    state = 'moving'; button.disabled = false;
  }
  function drop() {
    if (state !== 'moving') return;
    state = 'falling'; active.vy = 100; button.disabled = true; ctx.sound('tap');
  }
  ctx.on(button, 'pointerdown', e => { e.preventDefault(); drop(); });
  ctx.on(button, 'click', e => { if (e.detail === 0) drop(); });
  actionKey(ctx, ['Space', 'ArrowDown'], drop);
  ctx.on(canvas, 'pointerdown', e => { e.preventDefault(); drop(); });
  nextBlock();
  ctx.status('Line up the moving treat with the tower, then drop. Twelve neat layers make a feast.');
  function land() {
    const top = stack[stack.length - 1], offset = active.x - top.x;
    if (Math.abs(offset) <= 9) {
      active.x = top.x; perfect++; score += 125;
      flash = 'PERFECT! +125'; ctx.sound('good'); burst(particles, active.x + active.width / 2, active.y, '#ffe2a0');
    } else {
      const left = Math.max(active.x, top.x), right = Math.min(active.x + active.width, top.x + top.width), overlap = right - left;
      if (overlap < 12) {
        state = 'lost'; active.vy = 50; flash = 'THE TOWER TOPPLED'; flashUntil = ctx.elapsed + 2;
        ctx.sound('bad'); ctx.status('That one missed the tower. Every layer is a little lesson in timing.');
        ctx.later(() => ctx.finish({ score, won: false, message: `${level} of 12 treats stacked, with ${perfect} perfect ${perfect === 1 ? 'drop' : 'drops'}. Keep the moving edges aligned.` }), 900);
        return;
      }
      const cutWidth = active.width - overlap;
      fragments.push({ x: offset < 0 ? active.x : right, y: active.y, width: cutWidth, vy: 20, vx: Math.sign(offset) * 70, rotation: 0, color: active.color });
      active.x = left; active.width = overlap;
      score += 75; flash = '+75 · NICE STACK'; ctx.sound('good');
    }
    flashUntil = ctx.elapsed + 1;
    stack.push({ ...active }); level++;
    if (level >= 12) {
      state = 'won'; burst(particles, active.x + active.width / 2, active.y, '#e6beff', 35);
      ctx.status('Twelve layers. One magnificent snack tower.');
      ctx.later(() => ctx.finish({ score: score + Math.round(active.width) + 250, won: true, message: `All twelve treats stacked! ${perfect} perfect drops and a very impressive snack tower.` }), 950);
    } else {
      state = 'between'; ctx.later(nextBlock, 260);
    }
  }
  function drawBlock(b) {
    rounded(g, b.x, b.y, b.width, blockHeight, 6, b.color);
    rounded(g, b.x + 3, b.y + 3, b.width - 6, 5, 2, '#ffe4b033');
    g.fillStyle = '#56362a55';
    for (let i = 15; i < b.width - 8; i += 32) { g.beginPath(); g.arc(b.x + i, b.y + 15, 2, 0, Math.PI * 2); g.fill(); }
  }
  ctx.frame((dt, t) => {
    const gradient = g.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#242037'); gradient.addColorStop(1, '#47313b');
    g.fillStyle = gradient; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff09'; g.setLineDash([4, 9]);
    for (let i = 0; i < 12; i++) { const yy = baseY - (i + 1) * blockHeight; g.beginPath(); g.moveTo(24, yy); g.lineTo(w - 24, yy); g.stroke(); }
    g.setLineDash([]);
    rounded(g, 80, baseY + blockHeight, w - 160, 12, 6, '#a98d78');
    sprite(g, molly, w - 76, h - 55, 95);
    sprite(g, bone, 60, 55, 55, -.4);
    if (state === 'moving') {
      active.x += direction * (200 + level * 20) * dt;
      if (active.x <= 16) { active.x = 16; direction = 1; }
      if (active.x + active.width >= w - 16) { active.x = w - active.width - 16; direction = -1; }
      g.globalAlpha = .15;
      rounded(g, active.x, stack[stack.length - 1].y - blockHeight, active.width, blockHeight, 6, '#fff0d0');
      g.globalAlpha = 1;
    } else if (state === 'falling') {
      active.vy += 2000 * dt; active.y += active.vy * dt;
      if (active.y >= stack[stack.length - 1].y - blockHeight) {
        active.y = stack[stack.length - 1].y - blockHeight; land();
      }
    } else if (state === 'lost') { active.vy += 1600 * dt; active.y += active.vy * dt; }
    for (const b of stack) drawBlock(b);
    if (['moving', 'falling', 'lost'].includes(state)) drawBlock(active);
    for (let i = fragments.length - 1; i >= 0; i--) {
      const f = fragments[i]; f.vy += 1200 * dt; f.y += f.vy * dt; f.x += f.vx * dt;
      drawBlock(f); if (f.y > h + 40) fragments.splice(i, 1);
    }
    sparkles(g, particles, dt);
    if (t < flashUntil) {
      g.fillStyle = '#ffe1aa'; g.textAlign = 'center'; g.font = 'bold 21px system-ui';
      g.fillText(flash, w / 2, 45);
    }
    ctx.hud({ Score: score, Tower: `${level} / 12`, Perfect: perfect, Width: `${Math.round(stack[stack.length - 1].width / 3)}%` });
  });
}

function reactionPaws(ctx) {
  ctx.root.innerHTML = `<div class="reaction-board"><div class="reaction-rounds" aria-label="Five reaction rounds">${Array.from({ length: 5 }, (_, i) => `<span>${i + 1}</span>`).join('')}</div><button class="reaction-pad is-wait" aria-label="Reaction pad. Wait for green, then tap."><span class="reaction-orbit" aria-hidden="true"></span><img src="${assets.shaina}" alt="Shaina"><span class="reaction-cue">Get ready</span><span class="reaction-hint">Wait for the green cue…</span></button><div class="reaction-times" aria-label="Your reaction times"></div><p class="control-note action-note">Tap the pad or press Space when it turns green. Three false starts or misses end the run. Enter also works when the pad is focused.</p></div>`;
  const pad = ctx.root.querySelector('.reaction-pad'), cue = ctx.root.querySelector('.reaction-cue'), hint = ctx.root.querySelector('.reaction-hint');
  const rounds = ctx.root.querySelectorAll('.reaction-rounds span'), timesArea = ctx.root.querySelector('.reaction-times');
  let state = 'waiting', goAt = 0, shownAt = 0, errors = 0, serial = 0;
  const times = [];
  function hud() {
    const average = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    ctx.hud({ Round: `${Math.min(5, times.length + 1)} / 5`, Average: average ? `${average}ms` : '—', Hearts: '♥'.repeat(Math.max(0, 3 - errors)) || '—' });
    rounds.forEach((round, i) => { round.className = i < times.length ? 'done' : i === times.length ? 'current' : ''; });
  }
  function prepare() {
    serial++; state = 'waiting'; goAt = ctx.elapsed + 1.25 + Math.random() * 2.6;
    pad.className = 'reaction-pad is-wait'; cue.textContent = 'Wait for green'; hint.textContent = 'Steady paws. Don’t tap yet.';
    pad.setAttribute('aria-label', 'Wait for green. Do not tap yet.');
    ctx.status(`Round ${times.length + 1}. Wait until the pad turns green and says GO.`); hud();
  }
  function respond() {
    if (!['waiting', 'go'].includes(state)) return;
    if (state === 'waiting') fail('Too soon!', 'Wait until the pad is green before you react.');
    else {
      const ms = Math.max(1, Math.round((ctx.elapsed - shownAt) * 1000));
      times.push(ms); state = 'feedback'; pad.className = 'reaction-pad is-result';
      cue.textContent = `${ms} ms`; hint.textContent = ms < 300 ? 'Lightning paws!' : ms < 550 ? 'Good reflexes!' : 'Got it! Ready for another?';
      pad.setAttribute('aria-label', `Reaction recorded: ${ms} milliseconds.`);
      const chip = document.createElement('span'); chip.textContent = `${times.length} · ${ms} ms`; timesArea.append(chip);
      ctx.sound('good'); ctx.status(`Round ${times.length}: ${ms} milliseconds.`); hud();
      if (times.length >= 5) {
        const average = Math.round(times.reduce((a, b) => a + b, 0) / 5);
        ctx.later(() => ctx.finish({ score: Math.max(100, 1800 - average * 2 - errors * 150), won: true, message: `Five quick paws! Average ${average} ms; fastest ${Math.min(...times)} ms. ${errors ? `${errors} false start or missed cue.` : 'A clean run, too.'}` }), 1000);
      } else ctx.later(prepare, 1100);
    }
  }
  function fail(title, message) {
    errors++; serial++; state = 'feedback'; pad.className = 'reaction-pad is-error';
    cue.textContent = title; hint.textContent = errors < 3 ? 'Take a breath. Same round, another chance.' : 'Three hearts used. Try another run.';
    pad.setAttribute('aria-label', `${title} ${message}`);
    ctx.sound('bad'); ctx.status(message); hud();
    if (errors >= 3) ctx.later(() => ctx.finish({ score: times.length * 100, won: false, message: `${times.length} of 5 reactions recorded. Wait for green, then tap once. You’ll find your rhythm.` }), 1100);
    else ctx.later(prepare, 1200);
  }
  ctx.on(pad, 'pointerdown', e => { e.preventDefault(); respond(); });
  ctx.on(pad, 'click', e => { if (e.detail === 0) respond(); });
  actionKey(ctx, ['Space'], respond);
  ctx.frame((dt, t) => {
    if (state === 'waiting' && t >= goAt) {
      state = 'go'; shownAt = t; pad.className = 'reaction-pad is-go';
      cue.textContent = 'GO!'; hint.textContent = 'Tap now · Space';
      pad.setAttribute('aria-label', 'GO! Tap now.');
      ctx.status('GO! Tap the green pad now.'); ctx.sound('tap');
    } else if (state === 'go' && t - shownAt > 1.6) fail('Missed it!', 'The green cue lasts 1.6 seconds. Keep your paw ready.');
  });
  prepare();
}

export const games = {
  'treat-catch': treatCatch,
  'molly-dash': mollyDash,
  fetch,
  'treat-stacker': treatStacker,
  'reaction-paws': reactionPaws,
};
