/*
 * ratios.js — page controller for the right-triangle trigonometric ratios (SOH-CAH-TOA).
 *
 * Reads the Python-built config, wires the mode picker and the sliders, and
 * turns a solution into a Manim-style Timeline. The triangle has θ at A (the
 * origin), the adjacent side along the bottom to the right angle at B and the
 * opposite side rising to C. The timeline names the sides from θ, then lights
 * up each pair of sides in turn as sine, cosine and tangent are read off, flips
 * them for the reciprocals, and finally shows that C sits on a circle of
 * radius h at (h cos θ, h sin θ), so the ratios belong to the angle alone. The
 * ratio table builds up in the stage's corner as it goes. The figure keeps
 * equal units across and up so the angle is not distorted. The URL hash
 * (#o=3&a=4 for legs, #theta=30&h=2 for an angle) presets the page and is
 * watched, so links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate } = window.Manim;
  const { equalView, polar, wedge, arc, rightAngle } = window.TrigFigure;
  const { solve, solve_angle: solveAngle, FRACTIONS } = window.TrigRatiosMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    run: $("run"), error: $("error"), results: $("results"), steps: $("steps"), glossary: $("glossary"),
    mode: $("mode"), modeAbout: $("mode-about"),
  };
  const IDLE = "Press run to animate.";
  const KEYS = { sides: ["o", "a"], angle: ["theta", "h"] };
  const ABOUT = {
    sides: "Set the legs opposite (o) and adjacent (a) to the angle θ; the hypotenuse and θ follow.",
    angle: "Set an acute angle θ in degrees and the hypotenuse h; the legs are o = h sin θ and a = h cos θ.",
  };
  const SIDE_NAMES = { o: "opposite", a: "adjacent", h: "hypotenuse" };

  const TERMS = {
    "θ (theta)": "The acute angle the ratios describe. The sides are named from where it sits.",
    "Opposite o": "The leg across the triangle from θ, not touching it.",
    "Adjacent a": "The leg that runs from θ to the right angle.",
    "Hypotenuse h": "The side opposite the right angle: the longest side, and one arm of θ.",
    "sin, cos, tan": "SOH-CAH-TOA: sine = opposite / hypotenuse, cosine = adjacent / hypotenuse, tangent = opposite / adjacent.",
    "csc, sec, cot": "The reciprocals, each its partner's fraction flipped: cosecant = 1 / sin = h/o, secant = 1 / cos = h/a, cotangent = 1 / tan = a/o.",
    "From θ alone": "Every right triangle with the same angle θ is the same shape at a different size, so the six ratios depend only on θ: sin θ, cos θ and tan θ.",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme });
  let timeline = null;
  let current = null;

  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;
  const written = new WeakMap();
  const setHTML = (node, markup) => { if (written.get(node) !== markup) { node.innerHTML = markup; written.set(node, markup); } };

  function renderGlossary() {
    el.glossary.innerHTML = Object.entries(TERMS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  /** e.g. sin: "o/h = 3/5 = 0.6". */
  function ratioText(name, t) {
    const [top, bottom] = FRACTIONS[name];
    return `${top}/${bottom} = ${t[top]}/${t[bottom]} = ${t[name]}`;
  }

  // ---- Panels -----------------------------------------------------------------
  const rows = (items) => items.map(([id, k, v, term]) =>
    `<dt data-step="${id}" title="${TERMS[term || k] || ""}">${k}</dt><dd data-step="${id}">${v}</dd>`).join("");

  function renderResults(sol) {
    const t = sol.texts;
    const ratio = (name, id, term) => [id, `${name} θ`, ratioText(name, t), term];
    setHTML(el.results, rows([
      ["triangle", "Angle θ", `${t.deg}° = ${t.rad} rad`, "θ (theta)"],
      ["triangle", "Sides o, a, h", `${swatch(C.o)}${t.o}, ${swatch(C.a)}${t.a}, ${swatch(C.h)}${t.h}`, "Hypotenuse h"],
      ratio("sin", "sin", "sin, cos, tan"),
      ratio("cos", "cos", "sin, cos, tan"),
      ratio("tan", "tan", "sin, cos, tan"),
      ratio("csc", "reciprocals", "csc, sec, cot"),
      ratio("sec", "reciprocals", "csc, sec, cot"),
      ratio("cot", "reciprocals", "csc, sec, cot"),
      ["angle", "From θ alone", sol.agree
        ? `<span class="verdict-yes">the same six numbers</span>`
        : `<span class="verdict-no">differs</span>`, "From θ alone"],
    ]));
  }

  function renderSteps(sol) {
    setHTML(el.steps, sol.steps.map(({ id, title, math }) =>
      `<li class="steps__item" data-step="${id}"><p class="steps__title">${title}</p><p class="steps__math">${math}</p></li>`).join(""));
  }

  function highlight(step) {
    el.narration.textContent = step ? step.caption : IDLE;
    document.querySelectorAll("[data-step]").forEach((node) => {
      node.classList.toggle("is-active", !!step && node.dataset.step === step.id);
    });
  }

  // ---- Figure -----------------------------------------------------------------
  /** The three sides with where their labels sit (pixel offsets, outward from the triangle). */
  function edges(sol) {
    const { A, B, C: P } = sol.vertices;
    const { o, a, h } = sol.sides;
    return {
      a: { key: "a", from: A, to: B, color: C.a, dx: 0, dy: 18, align: "center" },
      o: { key: "o", from: B, to: P, color: C.o, dx: 12, dy: 0, align: "left" },
      h: { key: "h", from: A, to: P, color: C.h, dx: (-o / h) * 18, dy: (-a / h) * 18, align: "right" },
    };
  }

  const mid = (e) => [(e.from[0] + e.to[0]) / 2, (e.from[1] + e.to[1]) / 2];

  function sideLabel(e, text, p) {
    const [x, y] = mid(e);
    scene.label(text, x, y, p, e.color, { dx: e.dx, dy: e.dy, align: e.align, size: 14 });
  }

  /** A side drawn thick, pulsing in and back out over the step (a highlight that leaves nothing behind). */
  function pulse(e, p) {
    const strength = Math.sin(Math.PI * p);
    if (strength <= 0.01) return;
    scene.withClip(() => {
      const { ctx } = scene;
      ctx.save();
      ctx.globalAlpha = strength;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(scene.px(e.from[0]), scene.py(e.from[1]));
      ctx.lineTo(scene.px(e.to[0]), scene.py(e.to[1]));
      ctx.stroke();
      ctx.restore();
    });
  }

  /** Row `i` of the ratio table, pinned under the caption in the stage's top-left corner. */
  function tableRow(i, text, p, color) {
    if (!state.show.table || p <= 0) return;
    const { ctx } = scene;
    ctx.save();
    ctx.font = scene.font(14, 500);
    ctx.textBaseline = "middle";
    const x = 14, y = 50 + i * 22, w = ctx.measureText(text).width;
    ctx.globalAlpha = p;
    ctx.fillStyle = scene.theme.plate;
    ctx.fillRect(x - 4, y - 10, w + 8, 20);
    ctx.fillStyle = color;
    ctx.fillText(text, x + (1 - p) * 8, y);
    ctx.restore();
  }

  const markSize = (sol) => Math.min(0.3 * sol.sides.a, 0.25 * sol.sides.h);  // the θ wedge, well inside the triangle

  // ---- Timeline -------------------------------------------------------------
  function buildSteps(tl, sol) {
    const show = state.show;
    const t = sol.texts;
    const E = edges(sol);
    const { B, C: P } = sol.vertices;
    const deg = sol.theta.deg;
    const r = markSize(sol);
    const square = Math.min(0.12 * Math.min(sol.sides.a, sol.sides.o), 0.5);
    const caption = (id) => sol.steps.find((s) => s.id === id);
    const row = (name) => `${name} θ = ${ratioText(name, t)}`;

    tl.add({
      id: "triangle",
      caption: sol.mode === "sides"
        ? `Legs o = ${t.o} and a = ${t.a}: the hypotenuse is h = ${t.h} and the angle θ = ${t.deg}°`
        : `θ = ${t.deg}° and h = ${t.h}: the legs are o = h sin θ = ${t.o} and a = h cos θ = ${t.a}`,
      duration: 1.6, parallel: show.grid,
      draw: (p) => {
        [E.a, E.o, E.h].forEach((e, i) => {
          const local = Math.min(Math.max(p * 3 - i, 0), 1);
          if (local > 0) scene.line(e.from[0], e.from[1], e.to[0], e.to[1], local, e.color, { width: 3 });
          if (show.labels && local > 0.6) sideLabel(e, `${SIDE_NAMES[e.key]} ${e.key} = ${t[e.key]}`, (local - 0.6) / 0.4);
        });
        rightAngle(scene, B[0], B[1], 90, square, C.corner, { opacity: p });
        wedge(scene, 0, 0, r, 0, deg * p, C.angle, { alpha: 0.28, width: 2 });
        if (show.labels && p > 0.7) {
          const [x, y] = polar(0, 0, r, deg / 2);
          scene.label(`θ = ${t.deg}°`, x, y, (p - 0.7) / 0.3, C.angle, { dx: 10, dy: -4, align: "left", size: 13 });
        }
      },
    });

    // SOH, CAH, TOA: light up the two sides in each fraction, and add its row to the table.
    const pairs = { sin: [E.o, E.h], cos: [E.a, E.h], tan: [E.o, E.a] };
    ["sin", "cos", "tan"].forEach((name, i) => {
      tl.add({
        id: name, caption: `${caption(name).title.split(":")[0]}: ${row(name)}`, duration: 1.3,
        draw: (p) => {
          pairs[name].forEach((e) => pulse(e, p));
          tableRow(i, row(name), p, C[FRACTIONS[name][0]]);
        },
      });
    });

    tl.add({
      id: "reciprocals", caption: `Flip each fraction: csc θ = ${t.csc}, sec θ = ${t.sec}, cot θ = ${t.cot}`, duration: 1.6, wait: 0.2,
      draw: (p) => ["csc", "sec", "cot"].forEach((name, i) => {
        const local = Math.min(Math.max(p * 3 - i, 0), 1);
        tableRow(3 + i, row(name), local, C[FRACTIONS[name][0]]);
      }),
    });

    tl.add({
      id: "angle",
      caption: show.circle
        ? `C sits on a circle of radius h at (h cos θ, h sin θ) = (${t.a}, ${t.o}): the ratios belong to θ alone`
        : caption("angle").math,
      duration: show.circle ? 1.5 : 1.0, rate: show.circle ? rate.smooth : rate.linear,
      draw: (p) => {
        if (!show.circle) return;
        arc(scene, 0, 0, sol.sides.h, 0, 90 * p, C.circle, { width: 1.5, dash: [5, 6] });
        if (show.labels && p > 0.6) {
          scene.label(`(h cos θ, h sin θ)`, P[0], P[1], (p - 0.6) / 0.4, C.h, { dx: 10, dy: -14, align: "left", size: 13 });
        }
      },
    });
    tl.add({ id: "angle", duration: 0.7, parallel: true, rate: rate.linear, draw: (p) => scene.flash(P[0], P[1], p, C.h) });
  }

  function buildTimeline(sol) {
    const tl = new Timeline(scene, {
      onFrame: (time, length) => { el.scrub.value = length ? Math.round((time / length) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);
    if (state.show.grid) tl.add({ id: "triangle", duration: 0.6, draw: (p) => scene.grid(p) });
    buildSteps(tl, sol);
    return tl;
  }

  // ---- Camera: the whole figure, equal units across and up, room for the table ---------
  function ideal(sol) {
    const { o, a, h } = sol.sides;
    const points = [[0, 0], [a, 0], [a, o]];
    if (state.show.circle) points.push([h, 0], [0, h]);
    let x0 = Math.min(...points.map((q) => q[0])), x1 = Math.max(...points.map((q) => q[0]));
    const y0 = Math.min(...points.map((q) => q[1])), y1 = Math.max(...points.map((q) => q[1]));
    const size = Math.max(x1 - x0, y1 - y0);
    if (state.show.table) x0 -= 0.85 * size;  // the ratio table sits to the left, under the caption
    if (state.show.labels) x1 += 0.35 * size;  // the label on the opposite side
    return equalView(scene, [x0, x1, y0, y1], 0.12 * size);
  }

  function frame(sol) {
    scene.moveTo(ideal(sol), { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    el.mode.value = state.mode;
    el.modeAbout.textContent = ABOUT[state.mode];
    document.querySelectorAll(".field[data-input-mode]").forEach((field) => { field.hidden = field.dataset.inputMode !== state.mode; });
    for (const key of KEYS[state.mode]) {
      $(`${key}-range`).value = state[key];
      $(`${key}-num`).value = state[key];
    }
  }

  function writeHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    Object.values(KEYS).flat().forEach((key) => params.delete(key));
    KEYS[state.mode].forEach((key) => params.set(key, state[key]));
    history.replaceState(null, "", `#${params.toString()}`);
  }

  function invalid() {
    if (state.mode === "sides") {
      return ["o", "a"].some((key) => !Number.isFinite(state[key]) || state[key] <= 0) && "Enter lengths greater than 0 for o and a.";
    }
    if (!Number.isFinite(state.theta) || state.theta <= 0 || state.theta >= 90) return "θ must be an acute angle: more than 0° and less than 90°.";
    return (!Number.isFinite(state.h) || state.h <= 0) && "Enter a hypotenuse h greater than 0.";
  }

  function update({ fromConfig = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    const problem = invalid();
    if (problem) {
      el.error.textContent = problem;
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    const sol = fromConfig ? config.solution : state.mode === "sides" ? solve(state.o, state.a) : solveAngle(state.theta, state.h);
    current = sol;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol);
    writeHash();
  }

  /** The mode is read from which keys the hash carries: o, a for legs; theta, h for an angle. */
  function readHash() {
    const values = PPParams.read(["o", "a", "theta", "h"]);
    if ("theta" in values || "h" in values) {
      Object.assign(state, { theta: 45, h: 1 }, values, { mode: "angle" });
      return true;
    }
    if ("o" in values || "a" in values) {
      Object.assign(state, { o: 3, a: 4 }, values, { mode: "sides" });
      return true;
    }
    return false;
  }

  function play() {
    if (!timeline) return;
    el.run.hidden = true;
    timeline.play();
    setPlaying(true);
  }

  for (const key of Object.values(KEYS).flat()) {
    for (const suffix of ["range", "num"]) {
      $(`${key}-${suffix}`).addEventListener("input", (event) => {
        state[key] = event.target.value === "" ? NaN : Number(event.target.value);
        $(`${key}-${suffix === "range" ? "num" : "range"}`).value = event.target.value;
        update();
      });
    }
  }
  el.mode.addEventListener("change", () => {
    // Switching mode keeps the same triangle: its angle and hypotenuse, or its two legs.
    if (current) {
      if (el.mode.value === "angle") Object.assign(state, { theta: Number(current.texts.deg), h: current.sides.h });
      else Object.assign(state, { o: Number(current.texts.o), a: Number(current.texts.a) });
    }
    state.mode = el.mode.value;
    syncInputs();
    update();
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const [mode, list] = button.dataset.preset.split(":");
      const values = list.split(",").map(Number);
      state.mode = mode;
      KEYS[mode].forEach((key, i) => { state[key] = values[i]; });
      syncInputs();
      update();
      play();
    });
  });
  document.querySelectorAll("[data-show]").forEach((box) => {
    box.addEventListener("change", () => { state.show[box.dataset.show] = box.checked; update(); });
  });
  el.play.addEventListener("click", () => {
    if (!timeline) return;
    if (timeline.playing) { timeline.stop(); setPlaying(false); return; }
    el.run.hidden = true;
    timeline.play({ from: timeline.time });
    setPlaying(true);
  });
  el.run.addEventListener("click", play);
  el.finish.addEventListener("click", () => { if (timeline) { timeline.finish(); setPlaying(false); } });
  el.scrub.addEventListener("input", () => { if (timeline) { timeline.seek(el.scrub.value / 1000); setPlaying(false); } });
  el.speed.addEventListener("change", () => { if (timeline) timeline.speed = Number(el.speed.value); });
  // A new canvas shape changes the units per pixel, so re-square the figure.
  scene.onResize = () => { if (current) scene.setView(ideal(current)); if (timeline) timeline.render(); };
  window.addEventListener("hashchange", () => { if (readHash()) { syncInputs(); update(); } });

  renderGlossary();
  const fromHash = readHash();
  syncInputs();
  scene.setView(ideal(config.solution));
  update({ fromConfig: !fromHash });
})();
