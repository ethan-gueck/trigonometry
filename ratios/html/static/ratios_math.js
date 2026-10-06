/*
 * ratios_math.js — browser mirror of ratios/solver.py and the T.1 section of core/formula.py.
 *
 * Loaded after shared/static/fmt.js (window.TrigFmt). Python stays the source of
 * truth: tests/test_js_parity.py runs this file and compares solve() and
 * solve_angle() with the Python output. Exposes window.TrigRatiosMath (browser)
 * or module.exports (Node).
 */
(function (global) {
  "use strict";
  const { clean, fmt } = global.TrigFmt;

  // ---- core/formula.py: T.1 Right-Triangle Trigonometric Ratios -------------------
  const sine = (o, h) => o / h;
  const cosine = (a, h) => a / h;
  const tangent = (o, a) => o / a;
  const cosecant = (o, h) => h / o;
  const secant = (a, h) => h / a;
  const cotangent = (o, a) => a / o;
  const sineTheta = (theta) => Math.sin(theta);
  const cosineTheta = (theta) => Math.cos(theta);
  const tangentTheta = (theta) => Math.tan(theta);
  const cosecantTheta = (theta) => 1 / sineTheta(theta);
  const secantTheta = (theta) => 1 / cosineTheta(theta);
  const cotangentTheta = (theta) => 1 / tangentTheta(theta);

  // ---- ratios/solver.py -------------------------------------------------------------
  const NAMES = ["sin", "cos", "tan", "csc", "sec", "cot"];
  const FRACTIONS = { sin: ["o", "h"], cos: ["a", "h"], tan: ["o", "a"], csc: ["h", "o"], sec: ["h", "a"], cot: ["a", "o"] };

  const sideRatios = (o, a, h) => ({
    sin: clean(sine(o, h)), cos: clean(cosine(a, h)), tan: clean(tangent(o, a)),
    csc: clean(cosecant(o, h)), sec: clean(secant(a, h)), cot: clean(cotangent(o, a)),
  });

  const angleRatios = (theta) => ({
    sin: clean(sineTheta(theta)), cos: clean(cosineTheta(theta)), tan: clean(tangentTheta(theta)),
    csc: clean(cosecantTheta(theta)), sec: clean(secantTheta(theta)), cot: clean(cotangentTheta(theta)),
  });

  /** h = √(o² + a²): page plumbing (G.3). */
  const hypotenuse = (o, a) => (o * o + a * a) ** 0.5;
  /** θ in radians from its opposite and adjacent sides: page plumbing (T.10). */
  const angleOf = (o, a) => Math.atan2(o, a);
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const toDegrees = (radians) => radians * 180 / Math.PI;

  const vertices = (o, a) => ({ A: [0, 0], B: [clean(a), 0], C: [clean(a), clean(o)] });

  const agree = (ratios, fromAngle) =>
    NAMES.every((k) => Math.abs(ratios[k] - fromAngle[k]) <= 1e-9 * Math.max(1, Math.abs(ratios[k])));

  function fraction(name, t) {
    const [top, bottom] = FRACTIONS[name];
    return `${top}/${bottom} = ${t[top]}/${t[bottom]}`;
  }

  function steps(mode, t) {
    const first = mode === "sides"
      ? { id: "triangle", title: "The sides, named from θ: opposite, adjacent, hypotenuse",
          math: `o = ${t.o}, a = ${t.a}, h = √(o² + a²) = ${t.h}, so θ = ${t.deg}°` }
      : { id: "triangle", title: "The sides from θ and the hypotenuse",
          math: `θ = ${t.deg}°, h = ${t.h}: o = h · sin θ = ${t.o}, a = h · cos θ = ${t.a}` };
    const ratio = (name) => `${name} θ = ${fraction(name, t)} = ${t[name]}`;
    return [
      first,
      { id: "sin", title: "SOH: sine = opposite / hypotenuse", math: ratio("sin") },
      { id: "cos", title: "CAH: cosine = adjacent / hypotenuse", math: ratio("cos") },
      { id: "tan", title: "TOA: tangent = opposite / adjacent", math: ratio("tan") },
      { id: "reciprocals", title: "The reciprocals: csc = 1 / sin, sec = 1 / cos, cot = 1 / tan",
        math: ["csc", "sec", "cot"].map(ratio).join(", ") },
      { id: "angle", title: "From θ alone: the same six numbers",
        math: `sin ${t.deg}° = ${t.sin}, cos ${t.deg}° = ${t.cos}, tan ${t.deg}° = ${t.tan}: `
          + "every right triangle with this angle has these ratios, whatever its size" },
    ];
  }

  function solution(mode, inputs, o, a, h, theta) {
    const sides = { o: clean(o), a: clean(a), h: clean(h) };
    const angle = { deg: clean(toDegrees(theta)), rad: clean(theta) };
    const ratios = sideRatios(o, a, h);
    const fromAngle = angleRatios(theta);
    const texts = {};
    for (const group of [sides, angle, ratios]) for (const [k, v] of Object.entries(group)) texts[k] = fmt(v);
    return {
      mode,
      inputs,
      sides,
      theta: angle,
      ratios,
      from_angle: fromAngle,
      agree: agree(ratios, fromAngle),
      vertices: vertices(o, a),
      texts,
      verdict: `sin θ = ${texts.sin}, cos θ = ${texts.cos}, tan θ = ${texts.tan}`,
      steps: steps(mode, texts),
    };
  }

  /** Same shape as solve() in Python: the legs opposite and adjacent to θ. */
  const solve = (o, a) => solution("sides", { o, a }, o, a, hypotenuse(o, a), angleOf(o, a));

  /** Same shape as solve_angle() in Python: θ in degrees and the hypotenuse. */
  function solveAngle(theta, h) {
    const rad = toRadians(theta);
    return solution("angle", { theta, h }, h * sineTheta(rad), h * cosineTheta(rad), h, rad);
  }

  const api = {
    solve, solve_angle: solveAngle, fmt, FRACTIONS,
    sine, cosine, tangent, cosecant, secant, cotangent,
    sine_theta: sineTheta, cosine_theta: cosineTheta, tangent_theta: tangentTheta,
    cosecant_theta: cosecantTheta, secant_theta: secantTheta, cotangent_theta: cotangentTheta,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.TrigRatiosMath = api;
})(typeof window !== "undefined" ? window : globalThis);
