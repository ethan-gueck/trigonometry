"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("ratios/ratios", "solve", 3, 4)
    PP.call("ratios/ratios", "solve_angle", 30, 2)
    PP.embed("#el", "ratios/ratios", { o: 3, a: 4 })          // the legs opposite and adjacent to θ
    PP.embed("#el", "ratios/ratios", { theta: 30, h: 2 })     // an angle in degrees and the hypotenuse
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.ratios_page import MATH_SCRIPTS, build_ratios_html


def _build_page(output_path, theme=None):
    return build_ratios_html(3, 4, output_path=output_path, theme=theme)


TOPIC = Topic(
    title="Right-Triangle Trigonometric Ratios",
    description="SOH-CAH-TOA: sine, cosine and tangent as ratios of a right triangle's sides, their reciprocals cosecant, secant and cotangent, and the same six from the angle alone.",
    cards=("T.1",),  # flashcard: Right-Triangle Trigonometric Ratios
    modules=(
        JSModule(
            name="ratios",
            global_name="TrigRatiosMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "solve_angle": solver.solve_angle,
                "sine": formula.sine,
                "cosine": formula.cosine,
                "tangent": formula.tangent,
                "cosecant": formula.cosecant,
                "secant": formula.secant,
                "cotangent": formula.cotangent,
                "sine_theta": formula.sine_theta,
                "cosine_theta": formula.cosine_theta,
                "tangent_theta": formula.tangent_theta,
                "cosecant_theta": formula.cosecant_theta,
                "secant_theta": formula.secant_theta,
                "cotangent_theta": formula.cotangent_theta,
            },
        ),
    ),
    pages=(
        Page(
            name="ratios",
            title="Right-Triangle Trigonometric Ratios",
            description="Interactive walkthrough of SOH-CAH-TOA and the reciprocal ratios on a right triangle, set from its two legs or from an angle and the hypotenuse.",
            build=_build_page,
            params=("o", "a", "theta", "h"),
            example={"o": 3, "a": 4},
        ),
    ),
)
