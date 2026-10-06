"""The browser module (html/static/ratios_math.js) must match solver.py exactly."""

import json

import pytest

from general.jsrun import AVAILABLE, assert_close, run_js
from ratios.api import TOPIC
from ratios.solver import solve, solve_angle

from .test_core import ANGLES, LEGS

MODULE = TOPIC.modules[0]

pytestmark = pytest.mark.skipif(not AVAILABLE, reason="no JavaScript runtime (node or osascript)")


def test_solve_matches_python():
    # No values that are 4-significant-digit ties (1.5625): Python .4g and JS toPrecision round those differently.
    cases = LEGS + [(7, 24), (9, 40), (2.5, 6), (11, 3.2)]
    calls = f"{json.dumps(cases)}.map(function (t) {{ return window.{MODULE.global_name}.solve(t[0], t[1]); }})"
    for case, js in zip(cases, run_js(list(MODULE.scripts), calls)):
        assert_close(json.loads(json.dumps(solve(*case).to_dict())), js, str(case))


def test_solve_angle_matches_python():
    cases = ANGLES + [(15, 4), (75, 3), (53.13, 10)]
    calls = f"{json.dumps(cases)}.map(function (t) {{ return window.{MODULE.global_name}.solve_angle(t[0], t[1]); }})"
    for case, js in zip(cases, run_js(list(MODULE.scripts), calls)):
        assert_close(json.loads(json.dumps(solve_angle(*case).to_dict())), js, str(case))


def test_every_published_function_exists_in_js():
    assert set(MODULE.functions) <= set(run_js(list(MODULE.scripts), f"Object.keys(window.{MODULE.global_name})"))
