import React, {useRef, useLayoutEffect, useEffect, useState} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, delayRender, continueRender, staticFile, Easing} from 'remotion';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/montserrat/800.css';
import {FRAG} from './frag.js';

const T_COUNT = 3.0, T_FIRE = 4.8;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const SPEC = [[236,92,72],[244,150,96],[250,214,110],[238,244,226],[150,214,150],[64,206,190],[120,196,226],[72,108,206],[150,128,214],[244,176,190]];
const spec = (t) => { t = ((t % 1) + 1) % 1 * SPEC.length; const i = t | 0, f = t - i, a = SPEC[i % 10], b = SPEC[(i + 1) % 10];
  return `rgb(${(a[0]+(b[0]-a[0])*f)|0},${(a[1]+(b[1]-a[1])*f)|0},${(a[2]+(b[2]-a[2])*f)|0})`; };
let seed = 7;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const PARTS = Array.from({length: 190}, (_, i) => ({a: rnd() * 6.283, v: 0.25 + rnd() * 0.9, rot: rnd() * 6, vr: (rnd() - 0.5) * 8, s: 0.008 + rnd() * 0.03, c1: spec(i / 190 * 3), c2: spec(i / 190 * 3 + 0.2), life: 2 + rnd() * 2.6}));

/* state of the show at time t (seconds) */
const stateAt = (t) => {
  const energy = t < T_COUNT ? 0.8 + 0.2 * clamp(t / 2.6) : 1;
  let conv = 0;
  if (t >= T_COUNT && t < T_FIRE) conv = Math.pow((t - T_COUNT) / (T_FIRE - T_COUNT), 3);
  else if (t >= T_FIRE) conv = Math.pow(clamp(1 - (t - T_FIRE) / 1.4), 2);
  const sat = t < T_COUNT ? 0.2 + 0.6 * energy : 0.8;
  return {energy, conv, sat};
};
const spinAt = (t) => { let spin = 0; const dt = 1 / 30;
  for (let x = 0; x < t; x += dt) { const s = stateAt(x); spin += dt * (0.02 + s.energy * 0.1 + s.conv * 1.2); }
  return spin; };
const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });

export const Reveal = () => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = frame / fps;
  const glRef = useRef(null), fxRef = useRef(null), prog = useRef(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('assets'));

  useEffect(() => {
    const txt = '折射未來由你定義總啟動能量0123456789%';
    Promise.all([loadImg(staticFile('kv.jpg')), loadImg(staticFile('kvb.jpg')),
      document.fonts.load('700 80px "Noto Sans TC"', txt), document.fonts.load('800 80px Montserrat', txt)])
      .then(([a, b]) => {
        const gl = glRef.current.getContext('webgl', {antialias: false, alpha: false, preserveDrawingBuffer: true});
        const mk = (ty, src) => { const sh = gl.createShader(ty); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
        const pr = gl.createProgram();
        gl.attachShader(pr, mk(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
        gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr);
        const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
        const al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
        const U = {}; ['uTex','uBlur','uRes','uT','uSpin','uEnergy','uConv','uBurst','uMix','uVeil','uSatF','uAmp'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
        [a, b].forEach((img, unit) => { const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); });
        gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uBlur, 1);
        prog.current = {gl, U}; setReady(true);
      });
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const {gl, U} = prog.current, s = stateAt(t), since = t >= T_FIRE ? t - T_FIRE : -1;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uT, t + 20); gl.uniform1f(U.uSpin, spinAt(t));
    gl.uniform1f(U.uEnergy, s.energy); gl.uniform1f(U.uConv, s.conv); gl.uniform1f(U.uBurst, since);
    gl.uniform1f(U.uMix, since < 0 ? 0 : Math.min(1, since / 0.3));
    gl.uniform1f(U.uVeil, since < 0 ? (1 - s.sat) * 0.3 : 0); gl.uniform1f(U.uSatF, 0.82 + 0.28 * s.sat);
    gl.uniform1f(U.uAmp, since < 0 ? 0.012 + 0.03 * s.energy + 0.06 * s.conv : 0.007 + 0.06 * s.conv + 0.04 * Math.max(0, 1 - since / 2.5));
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();

    /* burst shards: closed-form motion so every frame is reproducible */
    const ctx = fxRef.current.getContext('2d'); ctx.clearRect(0, 0, W, H);
    if (since >= 0) {
      const D = Math.hypot(W, H), k = 0.9, tb = since;
      [[0, 1], [-0.12, 0.8]].forEach(([r0, a0]) => { const r = r0 * D + tb * D * 0.9, a = a0 - tb * 0.9; if (a > 0 && r > 0) { ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = D * 0.01 * a; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 6.283); ctx.stroke(); } });
      PARTS.forEach((p) => {
        const life = p.life - tb; if (life <= 0) return;
        const e = (1 - Math.exp(-k * tb)) / k, v = p.v * D;
        const x = W / 2 + Math.cos(p.a) * v * e, y = H / 2 + Math.sin(p.a) * v * e + H * 0.05 * tb * tb, sz = p.s * D;
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + p.vr * tb); ctx.globalAlpha = Math.min(1, life * 1.2) * 0.92;
        const g = ctx.createLinearGradient(-sz, 0, sz, 0); g.addColorStop(0, p.c1); g.addColorStop(1, p.c2); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-sz, sz * 0.5); ctx.lineTo(sz, sz * 0.2); ctx.lineTo(-sz * 0.1, -sz * 0.9); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      });
      ctx.globalAlpha = 1;
    }
    continueRender(handle);
  }, [ready, frame, t, W, H, handle]);

  const st = stateAt(t);
  const shake = t >= T_COUNT && t < T_FIRE ? (t - T_COUNT) / (T_FIRE - T_COUNT) : 0;
  const sx = Math.sin(frame * 2.9) * 7 * shake, sy = Math.cos(frame * 3.7) * 7 * shake;
  const ringOp = interpolate(t, [0, 0.4, T_COUNT - 0.25, T_COUNT], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cdN = t >= T_COUNT && t < T_FIRE ? 3 - Math.min(2, Math.floor((t - T_COUNT) / 0.6)) : 0;
  const cdP = ((t - T_COUNT) % 0.6) / 0.6;
  const flash = t >= T_FIRE ? interpolate(t, [T_FIRE, T_FIRE + 0.9], [1, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}) : 0;
  const zoom = t >= T_FIRE ? interpolate(t, [T_FIRE, 12], [1.06, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1.02 + shake * 0.03;
  const slo = spring({frame: frame - Math.round((T_FIRE + 1.2) * fps), fps, config: {damping: 200}});

  return (
    <AbsoluteFill style={{background: '#e6edf2', fontFamily: '"Noto Sans TC",sans-serif', color: '#fff'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px,${sy}px) scale(${zoom})`}}>
        <canvas ref={glRef} width={W} height={H} style={{position: 'absolute', inset: 0}} />
        <canvas ref={fxRef} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      </AbsoluteFill>

      {ringOp > 0 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: ringOp}}>
          <div style={{position: 'relative', width: 460, height: 460}}>
            <svg viewBox="0 0 100 100" style={{width: '100%', height: '100%', transform: 'rotate(-90deg)', filter: 'drop-shadow(0 10px 30px rgba(60,80,140,.3))'}}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff7a59"/><stop offset=".35" stopColor="#ffb84d"/><stop offset=".7" stopColor="#5cc8f0"/><stop offset="1" stopColor="#5b7be8"/></linearGradient></defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="8"/>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#rg)" strokeWidth="8" strokeLinecap="round" strokeDasharray="282.74" strokeDashoffset={282.74 * (1 - st.energy)}/>
            </svg>
            <div style={{position: 'absolute', inset: '11%', borderRadius: '50%', background: 'rgba(255,255,255,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1c2740'}}>
              <div style={{fontSize: 30, fontWeight: 700, color: '#5a6682'}}>總啟動能量</div>
              <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 124, lineHeight: 1.05}}>{Math.floor(st.energy * 100)}%</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {cdN > 0 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 460, textShadow: '0 10px 60px rgba(40,60,120,.55)', opacity: interpolate(cdP, [0, 0.25, 1], [0, 1, 0.8]), transform: `scale(${interpolate(cdP, [0, 1], [1.6, 0.9], {easing: Easing.out(Easing.cubic)})})`}}>{cdN}</div>
        </AbsoluteFill>
      )}

      {t >= T_FIRE && (
        <div style={{position: 'absolute', top: 70, right: 90, fontWeight: 700, fontSize: 50, letterSpacing: '.14em', textShadow: '0 3px 18px rgba(40,60,120,.6)', opacity: slo, transform: `translateY(${(1 - slo) * 30}px)`}}>折射未來　由你定義</div>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};
