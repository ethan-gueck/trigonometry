import json
import re

from ratios.html import build_ratios_html
from ratios.style import ROLES

T1 = ("sine", "cosine", "tangent", "cosecant", "secant", "cotangent",
      "sine-theta", "cosine-theta", "tangent-theta", "cosecant-theta", "secant-theta", "cotangent-theta")


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_ratios_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.TrigFmt" in document and "window.TrigRatiosMath" in document and "window.TrigFigure" in document
    assert "stage-settings" in document and 'data-show="circle"' in document and 'data-show="table"' in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in T1:
        assert f'id="pp-code-0-{name}"' in dialog
    assert "angle_of" not in dialog and "T.2 Radians" not in dialog  # only the T.1 section, no page plumbing


def test_config_carries_solution_and_roles():
    legs = _config(build_ratios_html(5, 12, output_path=None))
    assert legs["initial"] == {"mode": "sides", "o": 5, "a": 12}
    assert legs["solution"]["texts"]["h"] == "13" and legs["solution"]["agree"] is True
    angle = _config(build_ratios_html(theta=30, h=2, output_path=None))
    assert angle["initial"] == {"mode": "angle", "theta": 30, "h": 2} and angle["solution"]["texts"]["sin"] == "0.5"
    assert set(ROLES.values()) <= set(legs["theme"]["stage"])


def test_fields_do_not_use_data_mode():
    # <html data-mode="dark"> is how general/ marks dark mode, so a [data-mode] selector here would hide the whole page.
    document = build_ratios_html(output_path=None)
    assert '<div class="field" data-mode' not in document and 'querySelectorAll("[data-mode]")' not in document
