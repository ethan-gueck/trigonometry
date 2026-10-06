"""Interactive page: SOH-CAH-TOA and the reciprocal ratios on a right triangle, from its legs or from an angle."""

from __future__ import annotations

from pathlib import Path

from general.styles import WIDGET
from general.themes import Theme
from general.web import CodeFile, render_page, write_page
from shared.fmt import FIGURE_SCRIPT, FMT_SCRIPT

from ..solver import solve, solve_angle
from ..style import ROLES

HTML_DIR = Path(__file__).resolve().parent
STATIC = HTML_DIR / "static"
TEMPLATE = HTML_DIR / "templates" / "ratios.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "ratios.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the Trigonometry track's mathematics, one section per neuron

# fmt comes from the shared browser module, so it loads first.
MATH_SCRIPTS = (FMT_SCRIPT, STATIC / "ratios_math.js")
BUNDLE = WIDGET.extend(css=[STATIC / "ratios.css"], js=[*MATH_SCRIPTS, FIGURE_SCRIPT, STATIC / "ratios.js"])
# The "View the code" popup shows only the concept: the T.1 section of core/formula.py.
MATH = (
    "module",
    "sine", "cosine", "tangent", "cosecant", "secant", "cotangent",
    "sine_theta", "cosine_theta", "tangent_theta", "cosecant_theta", "secant_theta", "cotangent_theta",
)
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("labels", "Labels"), ("table", "Ratio table"), ("circle", "Circle of radius h"), ("grid", "Grid", False))
CODE = (CodeFile(FORMULA, "The six trigonometric ratios in Python: from a right triangle's sides, and from the angle θ alone.", only=MATH),)


def build_ratios_html(
    o: float = 3,
    a: float = 4,
    *,
    theta: float | None = None,
    h: float | None = None,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    theme: str | Theme | None = None,
    title: str = "Right-Triangle Trigonometric Ratios",
) -> Path | str:
    """Build the page with legs o and a preloaded, or with an angle θ (degrees) and hypotenuse h when both are given.

    ``output_path=None`` returns the HTML.
    """
    if theta is None or h is None:
        initial, solution = {"mode": "sides", "o": o, "a": a}, solve(o, a)
    else:
        initial, solution = {"mode": "angle", "theta": theta, "h": h}, solve_angle(theta, h)
    config = {"initial": initial, "solution": solution.to_dict(), "roles": ROLES}
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
