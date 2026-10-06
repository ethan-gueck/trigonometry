"""T.1 Right-Triangle Trigonometric Ratios: SOH-CAH-TOA, the three reciprocals, and the same six ratios from the angle alone.

    solver.py    the page's calculations, built on core/formula.py (T.1)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve, solve_angle

__all__ = ["solve", "solve_angle"]
