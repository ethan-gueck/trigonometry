import math

import pytest

from core import formula
from ratios.solver import NAMES, agree, angle_of, hypotenuse, solve, solve_angle

LEGS = [(3, 4), (4, 3), (5, 12), (8, 15), (6, 8), (1, 1), (2, 7), (0.5, 3), (10, 0.6)]
ANGLES = [(30, 2), (45, 1), (60, 2), (20, 10), (1, 3), (89, 1), (36.87, 5), (72, 0.5)]


def test_side_ratios_and_reciprocals():
    assert (formula.sine(3, 5), formula.cosine(4, 5), formula.tangent(3, 4)) == (0.6, 0.8, 0.75)
    assert (formula.cosecant(3, 5), formula.secant(4, 5), formula.cotangent(3, 4)) == (5 / 3, 1.25, 4 / 3)
    for o, a, h in [(3, 4, 5), (5, 12, 13)]:
        assert formula.cosecant(o, h) * formula.sine(o, h) == pytest.approx(1)
        assert formula.secant(a, h) * formula.cosine(a, h) == pytest.approx(1)
        assert formula.cotangent(o, a) * formula.tangent(o, a) == pytest.approx(1)


@pytest.mark.parametrize("degrees", [1, 30, 45, 60, 89])
def test_angle_ratios(degrees):
    theta = math.radians(degrees)
    assert formula.sine_theta(theta) == pytest.approx(math.sin(theta))
    assert formula.cosine_theta(theta) == pytest.approx(math.cos(theta))
    assert formula.tangent_theta(theta) == pytest.approx(math.tan(theta))
    assert formula.cosecant_theta(theta) == pytest.approx(1 / math.sin(theta))
    assert formula.secant_theta(theta) == pytest.approx(1 / math.cos(theta))
    assert formula.cotangent_theta(theta) == pytest.approx(1 / math.tan(theta))


@pytest.mark.parametrize("o, a", LEGS)
def test_legs_give_six_ratios_that_match_the_angle(o, a):
    s = solve(o, a)
    assert s.sides["h"] == pytest.approx(math.hypot(o, a))
    assert s.theta["deg"] == pytest.approx(math.degrees(math.atan2(o, a)))
    assert s.agree and agree(s.ratios, s.from_angle)
    for name in NAMES:
        assert s.ratios[name] == pytest.approx(s.from_angle[name])
    assert s.vertices == {"A": [0.0, 0.0], "B": [a, 0.0], "C": [a, o]}


@pytest.mark.parametrize("theta, h", ANGLES)
def test_angle_gives_the_legs(theta, h):
    s = solve_angle(theta, h)
    assert s.sides["o"] == pytest.approx(h * math.sin(math.radians(theta)))
    assert s.sides["a"] == pytest.approx(h * math.cos(math.radians(theta)))
    assert s.theta["deg"] == pytest.approx(theta) and s.agree
    assert s.sides["o"] ** 2 + s.sides["a"] ** 2 == pytest.approx(h * h)


def test_ratios_depend_only_on_the_angle():
    assert solve(3, 4).ratios == solve(6, 8).ratios == solve(30, 40).ratios


def test_helpers():
    assert hypotenuse(3, 4) == 5 and angle_of(1, 1) == pytest.approx(math.pi / 4)
    assert not agree({k: 1.0 for k in NAMES}, {**{k: 1.0 for k in NAMES}, "cot": 1.1})


def test_steps():
    legs = [step["math"] for step in solve(3, 4).steps]
    assert legs[0] == "o = 3, a = 4, h = √(o² + a²) = 5, so θ = 36.87°"
    assert legs[1:4] == ["sin θ = o/h = 3/5 = 0.6", "cos θ = a/h = 4/5 = 0.8", "tan θ = o/a = 3/4 = 0.75"]
    assert legs[4] == "csc θ = h/o = 5/3 = 1.667, sec θ = h/a = 5/4 = 1.25, cot θ = a/o = 4/3 = 1.333"
    assert legs[5].startswith("sin 36.87° = 0.6, cos 36.87° = 0.8, tan 36.87° = 0.75")
    angle = solve_angle(30, 2)
    assert angle.steps[0]["math"] == "θ = 30°, h = 2: o = h · sin θ = 1, a = h · cos θ = 1.732"
    assert angle.texts["sin"] == "0.5" and angle.texts["csc"] == "2" and angle.texts["cot"] == "1.732"
