const canvas = document.getElementById('hero-canvas');
const ctx    = canvas.getContext('2d');
let W, H, t = 0;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', resize);

/* ─── CELL ─────────────────────────────────────── */
function drawCell(cx, cy, r, time) {
  const steps = 140;

  /* outer membrane – wobbly ring */
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const w = r
      + Math.sin(a * 5 + time * 0.35) * r * 0.026
      + Math.cos(a * 3 - time * 0.22) * r * 0.018
      + Math.sin(a * 8 + time * 0.55) * r * 0.010;
    const x = cx + Math.cos(a) * w;
    const y = cy + Math.sin(a) * w;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const cg = ctx.createRadialGradient(cx - r * .18, cy - r * .18, r * .05, cx, cy, r);
  cg.addColorStop(0,    'rgba(167,243,208,0.20)');
  cg.addColorStop(0.45, 'rgba(125,211,252,0.11)');
  cg.addColorStop(0.85, 'rgba(196,181,253,0.07)');
  cg.addColorStop(1,    'rgba(110,231,199,0.03)');
  ctx.fillStyle   = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(52,211,153,0.50)';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  /* second inner ring */
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const w = r * .87
      + Math.sin(a * 5 + time * 0.35 + .6) * r * .014
      + Math.cos(a * 3 - time * 0.22 + .4) * r * .010;
    const x = cx + Math.cos(a) * w;
    const y = cy + Math.sin(a) * w;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(110,231,199,0.18)';
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();

  /* ── nucleus ── */
  const nr = r * .30;
  const nx = cx + Math.cos(time * .07) * r * .07;
  const ny = cy + Math.sin(time * .10) * r * .05;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(nx, ny, nr, nr * .88, time * .035, 0, Math.PI * 2);
  const ng = ctx.createRadialGradient(nx - nr * .2, ny - nr * .2, 0, nx, ny, nr);
  ng.addColorStop(0,  'rgba(196,181,253,0.30)');
  ng.addColorStop(.5, 'rgba(196,181,253,0.16)');
  ng.addColorStop(1,  'rgba(196,181,253,0.05)');
  ctx.fillStyle   = ng;
  ctx.fill();
  ctx.strokeStyle = 'rgba(196,181,253,0.55)';
  ctx.lineWidth   = 1.6;
  ctx.stroke();

  /* nuclear pores */
  for (let i = 0; i < 9; i++) {
    const a  = (i / 9) * Math.PI * 2 + time * .018;
    const px = nx + Math.cos(a) * nr;
    const py = ny + Math.sin(a) * nr * .88;
    ctx.beginPath();
    ctx.arc(px, py, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(196,181,253,0.65)';
    ctx.fill();
  }

  /* nucleolus */
  ctx.beginPath();
  ctx.arc(nx + nr * .12, ny - nr * .06, nr * .27, 0, Math.PI * 2);
  const nlg = ctx.createRadialGradient(nx + nr * .06, ny - nr * .09, 0, nx + nr * .12, ny - nr * .06, nr * .27);
  nlg.addColorStop(0, 'rgba(196,181,253,0.48)');
  nlg.addColorStop(1, 'rgba(167,243,208,0.20)');
  ctx.fillStyle = nlg;
  ctx.fill();
  ctx.restore();

  /* ── mitochondria ── */
  [
    { phase: .5,  dist: .54, w: .145, h: .065, spin:  .048 },
    { phase: 2.2, dist: .57, w: .160, h: .060, spin: -.038 },
    { phase: 4.3, dist: .51, w: .125, h: .058, spin:  .055 },
  ].forEach(m => {
    const a  = time * .055 + m.phase;
    const mx = cx + Math.cos(a) * r * m.dist;
    const my = cy + Math.sin(a) * r * m.dist;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(time * m.spin + m.phase);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * m.w, r * m.h, 0, 0, Math.PI * 2);
    const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * m.w);
    mg.addColorStop(0, 'rgba(252,165,165,0.30)');
    mg.addColorStop(1, 'rgba(252,165,165,0.08)');
    ctx.fillStyle   = mg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(252,165,165,0.52)';
    ctx.lineWidth   = 1.3;
    ctx.stroke();
    /* cristae */
    for (let ci = -1; ci <= 1; ci++) {
      ctx.beginPath();
      ctx.moveTo(ci * r * m.w * .32, -r * m.h * .72);
      ctx.lineTo(ci * r * m.w * .32,  r * m.h * .72);
      ctx.strokeStyle = 'rgba(252,165,165,0.28)';
      ctx.lineWidth   = .8;
      ctx.stroke();
    }
    ctx.restore();
  });

  /* ── ribosomes ── */
  for (let i = 0; i < 22; i++) {
    const a  = (i / 22) * Math.PI * 2 + time * .022 * (i % 3 === 0 ? 1 : -.6);
    const rd = r * (.18 + (i % 6) * .085);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(125,211,252,${.25 + (i % 4) * .07})`;
    ctx.fill();
  }

  /* ── vacuoles ── */
  [
    { ph: 1.0, d: .47, r: .088 },
    { ph: 3.6, d: .43, r: .062 },
  ].forEach(v => {
    const a  = time * .030 + v.ph;
    const vx = cx + Math.cos(a) * r * v.d;
    const vy = cy + Math.sin(a) * r * v.d;
    ctx.beginPath();
    ctx.arc(vx, vy, r * v.r, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(125,211,252,0.11)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.28)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  });
}

/* ─── DNA DOUBLE HELIX ──────────────────────────── */
function drawDNA(x, yStart, len, time) {
  const steps = 90;
  const amp   = Math.min(W, H) * .038;
  const freq  = (Math.PI * 2) / (len / 3.8);
  const phase = time * .55;
  const BASE_COLORS = [
    'rgba(52,211,153,0.70)',
    'rgba(196,181,253,0.70)',
    'rgba(252,165,165,0.70)',
    'rgba(125,211,252,0.70)',
  ];

  const s1 = [], s2 = [];
  for (let i = 0; i <= steps; i++) {
    const frac  = i / steps;
    const py    = yStart + frac * len;
    const angle = freq * frac * len + phase;
    const cosA  = Math.cos(angle);
    s1.push({ x: x + cosA * amp,                        y: py });
    s2.push({ x: x + Math.cos(angle + Math.PI) * amp,   y: py });
  }

  /* backbones */
  [[s2, 'rgba(52,211,153,0.50)'], [s1, 'rgba(125,211,252,0.50)']].forEach(([pts, col]) => {
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2.8;
    ctx.lineJoin    = 'round';
    ctx.stroke();
  });

  /* rungs / base pairs */
  for (let i = 2; i < steps - 2; i += 5) {
    const angle = freq * (i / steps) * len + phase;
    const cosA  = Math.cos(angle);
    if (Math.abs(cosA) < 0.55) {
      const p1 = s1[i], p2 = s2[i];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = BASE_COLORS[Math.floor(i / 5) % 4];
      ctx.lineWidth   = 2;
      ctx.stroke();
      [p1, p2].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = BASE_COLORS[Math.floor(i / 5) % 4];
        ctx.fill();
      });
    }
  }
}

/* ─── MAIN LOOP ─────────────────────────────────── */
function loop() {
  ctx.clearRect(0, 0, W, H);
  t += 0.012;

  const cellR = Math.min(W * .38, H * .40);
  const cellX = W * .58;
  const cellY = H * .50;

  drawDNA(W * .22, H * .07, H * .86, t);
  drawCell(cellX, cellY, cellR, t);

  requestAnimationFrame(loop);
}
loop();

/* subtle mouse parallax */
document.addEventListener('mousemove', e => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
  const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
  canvas.style.transform = `translate(${dx * 8}px, ${dy * 5}px)`;
});
