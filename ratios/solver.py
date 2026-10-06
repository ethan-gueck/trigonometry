"""Right-triangle trigonometric ratios: SOH-CAH-TOA and the three reciprocals, from two legs or from an angle.

The mathematics lives in core/formula.py (section T.1 Right-Triangle
Trigonometric Ratios): sine, cosine and tangent as side ratios, their
reciprocals cosecant, secant and cotangent, and the same six from the angle θ
alone (sine_theta … cotangent_theta). This module calls those and adds what the
page needs around them: the side or angle that was not given (page plumbing,
not part of the T.1 card), where to draw the corners, and each step written out
with the numbers. The JavaScript mirror (html/static/ratios_math.js) is kept
identical by tests/test_js_parity.py.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass

from core import formula
from shared.fmt import clean, fmt

NAMES = ("sin", "cos", "tan", "csc", "sec", "cot")
# Each ratio as (numerator, denominator) sides: o opposite θ, a adjacent to θ, h the hypotenuse.
FRACTIONS = {"sin": ("o", "h"), "cos": ("a", "h"), "tan": ("o", "a"), "csc": ("h", "o"), "sec": ("h", "a"), "cot": ("a", "o")}


def side_ratios(o: float, a: float, h: float) -> dict:
    """The six ratios from the sides (T.1: sine … cotangent)."""
    return {
        "sin": clean(formula.sine(o, h)),
        "cos": clean(formula.cosine(a, h)),
        "tan": clean(formula.tangent(o, a)),
        "csc": clean(formula.cosecant(o, h)),
        "sec": clean(formula.secant(a, h)),
        "cot": clean(formula.cotangent(o, a)),
    }


def angle_ratios(theta: float) -> dict:
    """The six ratios from the angle alone, θ in radians (T.1: sine_theta … cotangent_theta)."""
    return {
        "sin": clean(formula.sine_theta(theta)),
        "cos": clean(formula.cosine_theta(theta)),
        "tan": clean(formula.tangent_theta(theta)),
        "csc": clean(formula.cosecant_theta(theta)),
        "sec": clean(formula.secant_theta(theta)),
        "cot": clean(formula.cotangent_theta(theta)),
    }


def hypotenuse(o: float, a: float) -> float:
    """h = √(o² + a²). Page plumbing (the Pythagorean theorem, G.3), not part of the T.1 card."""
    return (o * o + a * a) ** 0.5


def angle_of(o: float, a: float) -> float:
    """θ in radians from its opposite and adjacent sides. Page plumbing (an inverse function, T.10)."""
    return math.atan2(o, a)


def to_radians(degrees: float) -> float:
    return degrees * math.pi / 180


def to_degrees(radians: float) -> float:
    return radians * 180 / math.pi


def vertices(o: float, a: float) -> dict:
    """Corners to draw: θ at A (the origin), the adjacent side along the x-axis to the right angle at B, C above B."""
    return {"A": [0.0, 0.0], "B": [clean(a), 0.0], "C": [clean(a), clean(o)]}


def agree(ratios: dict, from_angle: dict) -> bool:
    """The side ratios and the angle's ratios are the same six numbers."""
    return all(abs(ratios[k] - from_angle[k]) <= 1e-9 * max(1.0, abs(ratios[k])) for k in NAMES)


def fraction(name: str, texts: dict) -> str:
    """e.g. sin with o = 3, h = 5: 'o/h = 3/5'."""
    top, bottom = FRACTIONS[name]
    return f"{top}/{bottom} = {texts[top]}/{texts[bottom]}"


def steps(mode: str, texts: dict) -> list[dict]:
    """The sides, SOH, CAH, TOA, the reciprocals and the angle's own ratios, with these numbers in them."""
    t = texts
    if mode == "sides":
        first = {"id": "triangle", "title": "The sides, named from θ: opposite, adjacent, hypotenuse",
                 "math": f"o = {t['o']}, a = {t['a']}, h = √(o² + a²) = {t['h']}, so θ = {t['deg']}°"}
    else:
        first = {"id": "triangle", "title": "The sides from θ and the hypotenuse",
                 "math": f"θ = {t['deg']}°, h = {t['h']}: o = h · sin θ = {t['o']}, a = h · cos θ = {t['a']}"}
    ratio = lambda name: f"{name} θ = {fraction(name, t)} = {t[name]}"
    return [
        first,
        {"id": "sin", "title": "SOH: sine = opposite / hypotenuse", "math": ratio("sin")},
        {"id": "cos", "title": "CAH: cosine = adjacent / hypotenuse", "math": ratio("cos")},
        {"id": "tan", "title": "TOA: tangent = opposite / adjacent", "math": ratio("tan")},
        {"id": "reciprocals", "title": "The reciprocals: csc = 1 / sin, sec = 1 / cos, cot = 1 / tan",
         "math": ", ".join(ratio(name) for name in ("csc", "sec", "cot"))},
        {"id": "angle", "title": "From θ alone: the same six numbers",
         "math": f"sin {t['deg']}° = {t['sin']}, cos {t['deg']}° = {t['cos']}, tan {t['deg']}° = {t['tan']}: "
                 "every right triangle with this angle has these ratios, whatever its size"},
    ]


@dataclass(frozen=True)
class RatiosSolution:
    """Everything the page needs, computed once."""

    mode: str
    inputs: dict
    sides: dict
    theta: dict
    ratios: dict
    from_angle: dict
    agree: bool
    vertices: dict
    texts: dict
    verdict: str
    steps: list

    def to_dict(self) -> dict:
        return asdict(self)


def _solution(mode: str, inputs: dict, o: float, a: float, h: float, theta: float) -> RatiosSolution:
    sides = {"o": clean(o), "a": clean(a), "h": clean(h)}
    angle = {"deg": clean(to_degrees(theta)), "rad": clean(theta)}
    ratios = side_ratios(o, a, h)
    from_angle = angle_ratios(theta)
    texts = {**{k: fmt(v) for k, v in sides.items()}, **{k: fmt(v) for k, v in angle.items()}, **{k: fmt(v) for k, v in ratios.items()}}
    return RatiosSolution(
        mode=mode,
        inputs=inputs,
        sides=sides,
        theta=angle,
        ratios=ratios,
        from_angle=from_angle,
        agree=agree(ratios, from_angle),
        vertices=vertices(o, a),
        texts=texts,
        verdict=f"sin θ = {texts['sin']}, cos θ = {texts['cos']}, tan θ = {texts['tan']}",
        steps=steps(mode, texts),
    )


def solve(o: float, a: float) -> RatiosSolution:
    """The two legs, opposite and adjacent to θ: the hypotenuse, θ and all six ratios, with the steps."""
    return _solution("sides", {"o": o, "a": a}, o, a, hypotenuse(o, a), angle_of(o, a))


def solve_angle(theta: float, h: float) -> RatiosSolution:
    """An acute angle θ in degrees and the hypotenuse: the legs and all six ratios, with the steps."""
    rad = to_radians(theta)
    o = h * formula.sine_theta(rad)
    a = h * formula.cosine_theta(rad)
    return _solution("angle", {"theta": theta, "h": h}, o, a, h, rad)
