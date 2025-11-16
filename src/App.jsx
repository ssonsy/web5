import React, { useEffect, useMemo, useRef, useState } from "react";
import Matter from "matter-js";
import "./App.css";

import GNB from "./components/GNB.jsx";
import Preloader from "./components/Preloader.jsx";
import WebAppOverlay from "./components/WebAppOverlay.jsx";
import ImageOverlay from "./components/ImageOverlay.jsx"; // ✅ 추가

import {
  IMAGE_SRC, OVERLAYS, OVERLAY_SPEED, SCROLL_STEP, EASE_FACTOR, STOP_EPS,
  START_SCALE, APPEAR_RANGE,
  EXTRA_VIDEO_PANEL_WIDTH, EXTRA_BG_PANEL_WIDTH,
  VIDEO_SRC, BG_IMG_SRC, BG0_IMG_SRC, BG0_PANEL_WIDTH,
  CAPTION_TEXT, CAPTION_FONT_SIZE, CAPTION_MARGIN_LEFT, CAPTION_MARGIN_TOP, CAPTION_MARGIN_BOTTOM,
  EXTERNAL_URL,
  CURSOR_PNG_CANDIDATES, CURSOR_HOTSPOT_X, CURSOR_HOTSPOT_Y, MAX_CURSOR_SIZE,
  MENU_SWIPE_PX_PER_MS, MENU_SWIPE_MIN_MS, MENU_SWIPE_MAX_MS,
  MENU_SCROLL_TARGETS,
  WEB5_2_URL,
} from "./config/constants.js";

import { clamp, easeOutCubic, easeInOutCubic } from "./utils/math.js";

// ✅ About 이미지 (src/assets에 둘 때 권장)
//    파일명이 소문자라면 반드시 경로도 소문자로!
import aboutImg from "./assets/images/about.png";
// 만약 public/assets에 두었다면 위 import 대신 아래 한 줄을 쓰세요:
// const aboutImg = "/assets/about.png";

export default function App() {
  const stickyRef = useRef(null);
  const imgRef    = useRef(null);

  // ===== web5-2 오버레이 =====
  const [showWebApp, setShowWebApp] = useState(false);

  // ✅ About 이미지 오버레이
  const [showAbout, setShowAbout] = useState(false);

  // 오버레이 열리면 바디 스크롤 잠금
  useEffect(() => {
    const { body } = document;
    const needLock = showWebApp || showAbout;
    if (needLock) {
      const prev = body.style.overflow;
      body.style.overflow = "hidden";
      return () => { body.style.overflow = prev; };
    }
  }, [showWebApp, showAbout]);

  // ===== Preloader ===== (기존 유지)
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });

    const waitFonts = (async () => { try { await document.fonts.ready; } catch {} })();
    const waitVideo = new Promise((resolve) => {
      try {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.src = VIDEO_SRC;
        v.onloadedmetadata = () => resolve(true);
        v.onerror = () => resolve(true);
      } catch { resolve(true); }
    });

    const assets = [IMAGE_SRC, BG0_IMG_SRC, BG_IMG_SRC];
    let done = 0;
    const bump = () => {
      done += 1;
      const base = (done / (assets.length + 2)) * 100; // + fonts + video
      if (!cancelled) setProgress(Math.min(100, base));
    };

    Promise.all([
      ...assets.map((s) => loadImage(s).then(bump).catch(bump)),
      waitFonts.then(bump),
      waitVideo.then(bump),
      new Promise((r) => setTimeout(r, 1200))
    ]).then(() => {
      if (cancelled) return;
      setProgress(100);
      setTimeout(() => !cancelled && setLoading(false), 350);
    });

    return () => { cancelled = true; };
  }, []);

  // ===== 폰트/커서 (기존 유지)
  useEffect(() => {
    try {
      const font = new FontFace("Deluna", `url("/fonts/Deluna.otf") format("opentype")`);
      font.load().then((loaded) => { document.fonts.add(loaded); }).catch(() => {});
    } catch {}
  }, []);
  useEffect(() => {
    const id = "font-rubik-spray-paint";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Rubik+Spray+Paint&display=swap";
      document.head.appendChild(link);
    }
  }, []);
  useEffect(() => {
    const id = "font-hakgyoansim";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Hakgyoansim+Monggeulmonggeul&display=swap";
      document.head.appendChild(link);
    }
  }, []);
  useEffect(() => {
    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    const toCursorDataURL = (img) => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_CURSOR_SIZE / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const hx = Math.round(CURSOR_HOTSPOT_X * scale);
      const hy = Math.round(CURSOR_HOTSPOT_Y * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, w, h);
      return { url: canvas.toDataURL("image/png"), hx, hy };
    };
    (async () => {
      for (const path of CURSOR_PNG_CANDIDATES) {
        try {
          const img = await loadImage(path);
          const { url, hx, hy } = toCursorDataURL(img);
          const cursorVal = `url("${url}") ${hx} ${hy}, auto`;
          document.documentElement.style.setProperty("--app-cursor", cursorVal);
          document.documentElement.style.setProperty("--app-cursor-link", cursorVal);
          break;
        } catch {}
      }
    })();
  }, []);

  // ===== (이하 스크롤/물리/렌더 로직 전부 기존 유지) =====
  const overlayRefs = OVERLAYS.map(() => useRef(null));
  const [overlayWidths, setOverlayWidths] = useState(OVERLAYS.map(() => 0));
  const [imgMeta, setImgMeta] = useState({ nw: 0, nh: 0 });
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const [scrollY, setScrollY] = useState(0);

  const handleImgLoad = (e) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
    setImgMeta({ nw, nh });
  };

  useEffect(() => {
    const measure = () => {
      setOverlayWidths(
        overlayRefs.map((ref) => (ref.current ? ref.current.clientWidth || 0 : 0))
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { trackWidthPx, maxX, pageHeight } = useMemo(() => {
    const { nw, nh } = imgMeta;
    if (!nw || !nh) return { trackWidthPx: 0, maxX: 0, pageHeight: vh };
    const imgWidthPx = (nw / nh) * vh;
    const totalTrack = imgWidthPx + BG0_PANEL_WIDTH + EXTRA_VIDEO_PANEL_WIDTH + EXTRA_BG_PANEL_WIDTH;
    const mx = Math.max(0, totalTrack - vw);
    return { trackWidthPx: imgWidthPx, maxX: mx, pageHeight: mx + vh };
  }, [imgMeta, vh, vw]);

  const targetScrollRef = useRef(0);
  const animIdRef = useRef(null);
  const maxScrollRef = useRef(0);
  const isProgrammaticRef = useRef(false);

  useEffect(() => {
    maxScrollRef.current    = Math.max(0, pageHeight - vh);
    targetScrollRef.current = clamp(window.scrollY, 0, maxScrollRef.current);
  }, [pageHeight, vh]);

  const tickSmooth = () => {
    const cur    = window.scrollY;
    const target = targetScrollRef.current;
    const diff   = target - cur;
    if (Math.abs(diff) < STOP_EPS) {
      isProgrammaticRef.current = false;
      if (animIdRef.current) { cancelAnimationFrame(animIdRef.current); animIdRef.current = null; }
      return;
    }
    isProgrammaticRef.current = true;
    window.scrollTo({ top: cur + diff * EASE_FACTOR, behavior: "auto" });
    animIdRef.current = requestAnimationFrame(tickSmooth);
  };

  const swipeAnimRef = useRef(null);
  const swipeTo = (yTarget) => {
    const maxY  = maxScrollRef.current;
    const end   = clamp(yTarget, 0, maxY);
    const start = window.scrollY || 0;
    const dist  = Math.abs(end - start);
    if (dist < STOP_EPS) return;

    let dur = dist / MENU_SWIPE_PX_PER_MS;
    dur = clamp(dur, MENU_SWIPE_MIN_MS, MENU_SWIPE_MAX_MS);

    if (animIdRef.current) { cancelAnimationFrame(animIdRef.current); animIdRef.current = null; }
    if (swipeAnimRef.current) { cancelAnimationFrame(swipeAnimRef.current); swipeAnimRef.current = null; }

    isProgrammaticRef.current = true;
    const t0 = performance.now();

    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const eased = easeInOutCubic(t);
      const y = start + (end - start) * eased;
      window.scrollTo({ top: y, behavior: "auto" });
      targetScrollRef.current = end;
      if (t < 1) {
        swipeAnimRef.current = requestAnimationFrame(step);
      } else {
        isProgrammaticRef.current = false;
        swipeAnimRef.current = null;
      }
    };
    swipeAnimRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY || document.documentElement.scrollTop || 0;
    const onScroll = () => {
      const curY = window.scrollY || document.documentElement.scrollTop || 0;
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(curY);
          if (!isProgrammaticRef.current) {
            targetScrollRef.current = clamp(curY, 0, maxScrollRef.current);
            if (swipeAnimRef.current) { cancelAnimationFrame(swipeAnimRef.current); swipeAnimRef.current = null; }
            if (animIdRef.current) { cancelAnimationFrame(animIdRef.current); animIdRef.current = null; }
          }
          const dy = curY - lastY;
          lastY = curY;
          if (dy !== 0 && !isProgrammaticRef.current) { kick(0, dy); }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      if (swipeAnimRef.current) { cancelAnimationFrame(swipeAnimRef.current); swipeAnimRef.current = null; }
      const dir = e.deltaY > 0 ? 1 : -1;
      const maxScrollY = maxScrollRef.current;
      targetScrollRef.current = clamp(targetScrollRef.current + dir * SCROLL_STEP, 0, maxScrollY);
      if (animIdRef.current) { cancelAnimationFrame(animIdRef.current); animIdRef.current = null; }
      isProgrammaticRef.current = true;
      animIdRef.current = requestAnimationFrame(tickSmooth);
      kick(e.deltaX || 0, e.deltaY || 0);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // ▼ 물리(기존) ··· (생략 없이 그대로 유지)
  const physPanelRef    = useRef(null);
  const panelRef        = useRef(null);
  const matterMountRef  = useRef(null);
  const bodiesRef       = useRef([]);

  const FORCE_BASE  = 0.00015;
  const FORCE_SCALE = 0.0000050;
  const FORCE_MAX   = 0.0065;
  const X_FACTOR    = 0.60;
  const X_RANDOM    = 0.20;
  const BOOST_VY    = -2.6;
  const TORQUE_KICK = 0.028;
  const TORQUE_MAX  = 1.6;

  const kick = (dx = 0, dy = 0) => {
    const mag = Math.hypot(dx, dy);
    if (mag < 0.25) return;
    const base = Math.min(FORCE_MAX, FORCE_BASE + FORCE_SCALE * mag);
    const arr = bodiesRef.current || [];
    for (const b of arr) {
      const dirX = Math.sign(dx || dy);
      const fx = (dirX * base * X_FACTOR) + ((Math.random() - 0.5) * base * X_RANDOM);
      const fy = -base;
      Matter.Body.applyForce(b, b.position, { x: fx, y: fy });
      Matter.Body.setVelocity(b, { x: b.velocity.x + fx * 1600, y: Math.min(b.velocity.y, BOOST_VY) });
      const add = (Math.random() - 0.5) * TORQUE_KICK * Math.sign(dx || dy || 1);
      const nextW = Math.max(-TORQUE_MAX, Math.min(TORQUE_MAX, b.angularVelocity + add));
      Matter.Body.setAngularVelocity(b, nextW);
    }
  };

  useEffect(() => {
    const panel = panelRef.current;
    const mount = matterMountRef.current;
    if (!panel || !mount) return;
    const { Engine, Render, Runner, World, Bodies, Events } = Matter;

    const PANEL_W = 3840;
    const PANEL_H = 1080;

    const PLAY_X = 960, PLAY_Y = 0, PLAY_W = 1920, PLAY_H = 1080;
    const WALL_LEFT = 50, WALL_RIGHT = 50, WALL_TOP = 50;
    const FLOOR_RAISE = 140;
    const WALL_BOTTOM = 300;

    const engine = Engine.create();
    engine.world.gravity.y = 0;

    const render = Render.create({
      element: mount,
      engine,
      options: { width: PANEL_W, height: PANEL_H, wireframes: false, background: "transparent", pixelRatio: window.devicePixelRatio || 1 }
    });
    render.canvas.style.opacity = "0";

    const walls = [
      Bodies.rectangle(PLAY_X - WALL_LEFT / 2,  PLAY_Y + PLAY_H / 2, WALL_LEFT,  PLAY_H, { isStatic: true }),
      Bodies.rectangle(PLAY_X + PLAY_W + WALL_RIGHT / 2, PLAY_Y + PLAY_H / 2, WALL_RIGHT, PLAY_H, { isStatic: true }),
      Bodies.rectangle(PLAY_X + PLAY_W / 2, PLAY_Y - WALL_TOP / 2,  PLAY_W, WALL_TOP, { isStatic: true }),
      Bodies.rectangle(PLAY_X + PLAY_W / 2, (PLAY_Y + PLAY_H - FLOOR_RAISE) + WALL_BOTTOM / 2, PLAY_W, WALL_BOTTOM, { isStatic: true }),
    ];
    walls.forEach(w => (w.render.visible = false));
    World.add(engine.world, walls);

    const WEIGHTS = [
      { density: 0.0004, frictionAir: 0.035, restitution: 0.92, g: 0.32 },
      { density: 0.0004, frictionAir: 0.040, restitution: 0.90, g: 0.40 },
      { density: 0.0004, frictionAir: 0.046, restitution: 0.88, g: 0.50 },
      { density: 0.0004, frictionAir: 0.052, restitution: 0.86, g: 0.62 },
      { density: 0.0004, frictionAir: 0.060, restitution: 0.84, g: 0.78 },
    ];

    const sprites = [
      { src: "pngs/01-2.png", x: PLAY_X + 340,  y: 120,  w: 170, h: 170 },
      { src: "pngs/02-2.png", x: PLAY_X + 720,  y: 160,  w: 170, h: 170 },
      { src: "pngs/03.png",   x: PLAY_X + 1120, y:  90,  w: 170, h: 170 },
      { src: "pngs/04.png",   x: PLAY_X + 1460, y: 130,  w: 170, h: 170 },
      { src: "pngs/05-2.png", x: PLAY_X + 980,  y:  80,  w: 170, h: 170 },
    ];

    const bodies = [];
    const imgs = [];

    for (let i = 0; i < sprites.length; i++) {
      const s = sprites[i];
      const sides = 8 + i * 2;
      const radius = Math.max(8, Math.min(s.w, s.h) * 0.48);
      const w = WEIGHTS[i % WEIGHTS.length];

      const body = Bodies.polygon(s.x, s.y, sides, radius, {
        restitution: w.restitution,
        friction: 0.18,
        frictionAir: w.frictionAir,
        density: w.density,
      });
      body.render.visible = false;

      body.plugin = {
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        freqX: 0.0008 + Math.random() * 0.0004,
        freqY: 0.0007 + Math.random() * 0.0004,
        ampX:  0.00020 + Math.random() * 0.00012,
        ampY:  0.00014 + Math.random() * 0.00012,
        buoy:  0.00010 + Math.random() * 0.00005,
        torque: 0.00008 + Math.random() * 0.00006,
        g: w.g,
        gustPhase: Math.random() * Math.PI * 2,
        gustFreq:  0.002 + Math.random() * 0.002,
        gustAmp:   0.00020 + Math.random() * 0.00025
      };

      Matter.World.add(engine.world, body);
      bodies.push(body);

      const img = document.createElement("img");
      img.src = s.src;
      img.className = "sprite";
      img.style.width  = `${s.w}px`;
      img.style.height = `${s.h}px`;
      img.style.transform = `translate(${s.x - s.w / 2}px, ${s.y - s.h / 2}px)`;
      panel.appendChild(img);
      imgs.push(img);
    }

    bodiesRef.current = bodies;

    Matter.Events.on(engine, "beforeUpdate", () => {
      const t = engine.timing.timestamp;
      for (const b of bodies) {
        const p = b.plugin || {};
        const gEff = p.g * 0.0009;
        const Fg = { x: 0, y: b.mass * gEff };
        const Fb = {
          x: Math.sin(t * p.freqX + p.phaseX) * p.ampX,
          y: -p.buoy + Math.sin(t * p.freqY + p.phaseY) * p.ampY
        };
        const gust = Math.sin(t * p.gustFreq + p.gustPhase);
        const Fgust = { x: gust * p.gustAmp * 0.6, y: Math.abs(gust) * p.gustAmp };
        const Fx = Fg.x + Fb.x + Fgust.x;
        const Fy = Fg.y + Fb.y + Fgust.y;

        Matter.Body.applyForce(b, b.position, { x: Fx, y: Fy });

        const addW = (Math.random() - 0.5) * p.torque;
        Matter.Body.setAngularVelocity(b, Math.max(-1.8, Math.min(1.8, b.angularVelocity + addW)));
      }
    });

    const sync = () => {
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const el = imgs[i];
        const w = el.offsetWidth, h = el.offsetHeight;
        el.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`;
      }
      requestAnimationFrame(sync);
    };
    requestAnimationFrame(sync);

    Matter.Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      bodiesRef.current = [];
      Runner.stop(runner);
      Matter.Render.stop(render);
      render.canvas && render.canvas.remove();
      render.textures = {};
      World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      imgs.forEach((el) => el.remove());
    };
  }, []);

  // ===== Hover (기존 유지)
  useEffect(() => {
    const panel = physPanelRef.current;
    if (!panel) return;
    const HOVER_RADIUS = 200;
    const HOVER_FORCE_SCALE = 120;
    const HOVER_FORCE_MAX = 0.09;
    const HOVER_MIN_SPEED = 0.4;
    const HOVER_TORQUE = 0.025;

    let lastX = null, lastY = null, lastT = 0;

    const onMouseMove = (e) => {
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const t = performance.now();

      if (lastX == null || lastY == null) { lastX = x; lastY = y; lastT = t; return; }

      const dx = x - lastX;
      const dy = y - lastY;
      const dt = Math.max(1, t - lastT);
      lastX = x; lastY = y; lastT = t;

      const speed = Math.hypot(dx, dy) / dt;
      if (speed < HOVER_MIN_SPEED / 16.0) return;

      const len = Math.hypot(dx, dy) || 1;
      const dirX = dx / len;
      const dirY = dy / len;
      const base = Math.min(HOVER_FORCE_MAX, HOVER_FORCE_SCALE * speed * 16.0);

      const arr = bodiesRef.current || [];
      for (const b of arr) {
        const bx = b.position.x;
        const by = b.position.y;
        const dist = Math.hypot(bx - x, by - y);
        if (dist <= HOVER_RADIUS) {
          const w = 1 - Math.pow(dist / HOVER_RADIUS, 1.5);
          const fx = dirX * base * w;
          const fy = dirY * base * w;
          Matter.Body.applyForce(b, b.position, { x: fx, y: fy });
          const spin = (Math.random() - 0.5) * HOVER_TORQUE * w;
          Matter.Body.setAngularVelocity(b, Math.max(-2.0, Math.min(2.0, b.angularVelocity + spin)));
        }
      }
    };

    panel.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => panel.removeEventListener("mousemove", onMouseMove);
  }, []);

  // ===== Caption (기존 유지)
  const openInNewTab = () => window.open(EXTERNAL_URL, "_blank", "noopener,noreferrer");
  const onCaptionKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openInNewTab(); }
  };

  // ===== GNB
  const gnbFontFamily =
    `"Deluna", "Rubik Spray Paint", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Inter, Arial, sans-serif`;

  const [activeMenu, setActiveMenu] = useState(null);
  const activeTimerRef = useRef(null);

  const handleMenuClick = (label) => {
    setActiveMenu(label);

    // ✅ Goods → web5-2 오버레이
    if (label === "Goods") {
      if (activeTimerRef.current) { clearTimeout(activeTimerRef.current); activeTimerRef.current = null; }
      setShowWebApp(true);
      activeTimerRef.current = setTimeout(() => { setActiveMenu(null); activeTimerRef.current = null; }, 900);
      return;
    }

    // ✅ About / About Us → about.png 오버레이
    if (label === "About" || label === "About Us") {
      if (activeTimerRef.current) { clearTimeout(activeTimerRef.current); activeTimerRef.current = null; }
      setShowAbout(true);
      activeTimerRef.current = setTimeout(() => { setActiveMenu(null); activeTimerRef.current = null; }, 900);
      return;
    }

    // 기존 스크롤 이동
    if (activeTimerRef.current) { clearTimeout(activeTimerRef.current); activeTimerRef.current = null; }
    const y = MENU_SCROLL_TARGETS[label] ?? 0;
    swipeTo(y);
    activeTimerRef.current = setTimeout(() => { setActiveMenu(null); activeTimerRef.current = null; }, 900);
  };

  // ===== Render (기존 유지)
  const x = clamp(scrollY, 0, maxX);
  const vwToPx = (val) => (parseFloat(val) / 100) * vw;
  const vhToPx = (val) => (parseFloat(val) / 100) * vh;

  const resolveShowToPx = (show) => {
    const maxScroll = Math.max(0, pageHeight - vh);
    if (typeof show === "number") return show;
    if (typeof show === "string") {
      const s = show.trim().toLowerCase();
      if (s.endsWith("%"))  return (parseFloat(s) / 100) * maxScroll;
      if (s.endsWith("vh")) return vhToPx(s);
      if (s.endsWith("vw")) return vwToPx(s);
      const n = Number(s);
      if (!Number.isNaN(n)) return n;
    }
    return 0;
  };

  const capLeft  = CAPTION_MARGIN_LEFT;
  const capTop   = CAPTION_MARGIN_TOP;
  const capBot   = CAPTION_MARGIN_BOTTOM;
  const capFont  = CAPTION_FONT_SIZE;

  return (
    <>
      <Preloader visible={loading} progress={progress} />

      <GNB onItemClick={handleMenuClick} activeMenu={activeMenu} gnbFontFamily={gnbFontFamily} />

      <div className="page" style={{ height: `${pageHeight}px` }}>
        <section ref={stickyRef} className="sticky">
          <div className="track" style={{ transform: `translate3d(${-x}px, 0, 0)` }}>
            {/* 0) 파노라마 */}
            <img
              ref={imgRef}
              src={IMAGE_SRC}
              alt="panorama"
              onLoad={handleImgLoad}
              style={{ display: "block", height: "100vh", width: "auto", userSelect: "none", pointerEvents: "none" }}
            />

            {/* 0.5) 배경0 */}
            <div style={{ position: "absolute", top: 0, left: `${trackWidthPx}px`, width: `${BG0_PANEL_WIDTH}px`, height: "100vh" }}>
              <img src={BG0_IMG_SRC} alt="bg0-panel" className="bg-img" />
            </div>

            {/* 1) 비디오 패널 */}
            <div className="video-wrap" style={{ left: `${trackWidthPx + BG0_PANEL_WIDTH}px`, width: `${EXTRA_VIDEO_PANEL_WIDTH}px` }}>
              <div className="video-inner">
                <video src={VIDEO_SRC} style={{ width: "100%", height: "100%", objectFit: "contain", outline: "none", display: "block" }} />
              </div>
            </div>

            {/* 2) PNG+물리 패널 */}
            <div style={{ position: "absolute", top: 0, left: `${trackWidthPx + BG0_PANEL_WIDTH + EXTRA_VIDEO_PANEL_WIDTH}px`, width: `${EXTRA_BG_PANEL_WIDTH}px`, height: "100vh" }}>
              <div ref={physPanelRef} className="panel-phys">
                <img src={BG_IMG_SRC} alt="bg-panel" className="bg-img" />

                {/* 캡션 */}
                <div
                  role="button" tabIndex={0}
                  onClick={openInNewTab} onKeyDown={onCaptionKeyDown}
                  className="caption"
                  style={{ left: capLeft, top: capTop, bottom: capBot, fontSize: capFont }}
                  aria-label="Open external test in new tab"
                >
                  {CAPTION_TEXT}
                </div>

                <section ref={panelRef} style={{ position: "absolute", inset: 0, background: "transparent" }}>
                  <div className="play-area" style={{ left: `960px`, top: `0px`, width: `1920px`, height: `1080px`, padding: `50px` }}>
                    <div className="play-content" />
                  </div>
                  <div ref={matterMountRef} className="matter-mount" />
                </section>
              </div>
            </div>
          </div>

          {/* 오버레이 이미지들 (기존 유지) */}
          {OVERLAYS.map((o, i) => {
            const showPx = resolveShowToPx(o.show);
            const visible = scrollY >= showPx;
            const after   = Math.max(0, scrollY - showPx);

            const leftPx = typeof o.left === "string" && o.left.endsWith("vw")
              ? (parseFloat(o.left) / 100) * vw
              : (typeof o.left === "string" && o.left.endsWith("px"))
                ? parseFloat(o.left)
                : (typeof o.left === "number" ? o.left : 0);

            const w = overlayRefs[i]?.current ? overlayRefs[i].current.clientWidth : overlayWidths[i] || vw;
            const offX = leftPx + w + 24;

            const tx   = -Math.min(offX, after * OVERLAY_SPEED);
            const prog = clamp(after / APPEAR_RANGE, 0, 1);
            const scale = START_SCALE + (1 - START_SCALE) * easeOutCubic(prog);

            return visible && (
              <img
                key={i}
                ref={overlayRefs[i]}
                src={o.src}
                alt={`overlay-${i + 1}`}
                style={{
                  position: "absolute",
                  left: o.left,
                  top: o.top,
                  maxHeight: `calc(100vh - ${o.top} - ${o.bottom})`,
                  height: "auto",
                  width: "auto",
                  transform: `translate3d(${tx}px,0,0) scale(${scale})`,
                  transformOrigin: "left top",
                  pointerEvents: "none",
                  willChange: "transform",
                  zIndex: 10 + i
                }}
              />
            );
          })}
        </section>
      </div>

      {/* 기존 web5-2 오버레이 */}
      <WebAppOverlay
        open={showWebApp}
        onClose={() => setShowWebApp(false)}
        src={WEB5_2_URL}
      />

      {/* ✅ About 이미지 오버레이 */}
      <ImageOverlay
        open={showAbout}
        onClose={() => setShowAbout(false)}
        src={aboutImg}
        alt="About"
      />
    </>
  );
}
