"""Trigonometry: the mathematics behind every neuron in this track, in flashcard order.

Sections stay empty until that neuron is built. The pages' scaffolding lives
in each topic folder and imports from here, and each page's "View the code"
popup shows the functions it uses from this file.
"""
import math

# _____________ T.1 Right-Triangle Trigonometric Ratios _____________

def sine(o: float, h: float):
    """sine = opposite / hypotenuse"""
    return o/h

def cosine(a: float, h: float):
    """cosine = adjacent / hypotenuse"""
    return a/h

def tangent(o: float, a: float):
    """tangent = opposite / adjacent"""
    return o/a

def cosecant(o: float, h: float):
    """cosecant = hypotenuse / opposite"""
    return h/o

def secant(a: float, h: float): 
    """secant = hypotenuse / adjacent"""
    return h/a

def cotangent(o: float, a:float):
    """cotangent = adjacent / opposite"""
    return a/o

def sine_theta(theta: float):
    """sine = opposite / hypotenuse"""
    return math.sin(theta)

def cosine_theta(theta: float):
    """cosine = adjacent / hypotenuse"""
    return math.cos(theta)

def tangent_theta(theta: float):
    """tangent = opposite / adjacent"""
    return math.tan(theta)

def cosecant_theta(theta: float):
    """cosecant = 1 / sin(θ)"""
    return 1 / sine_theta(theta)

def secant_theta(theta: float): 
    """secant = 1 / cos(θ)"""
    return 1 / cosine_theta(theta)

def cotangent_theta(theta:float):
    """cotangent = 1 / tan(θ)"""
    return 1 / tangent_theta(theta)


# _____________ T.2 Radians, Degrees & Angular Speed _____________

# _____________ T.3 Unit Circle & Exact Values _____________

# _____________ T.4 Pythagorean & Fundamental Identities _____________

# _____________ T.5 Sum & Difference Formulas _____________

# _____________ T.6 Double-Angle & Half-Angle Formulas _____________

# _____________ T.7 Law of Sines & Triangle Area _____________

# _____________ T.8 Law of Cosines _____________

# _____________ T.9 Graphs of Sinusoids _____________

# _____________ T.10 Inverse Trigonometric Functions _____________

# _____________ T.11 Polar Coordinates _____________

# _____________ T.12 Vectors, Dot Product & Cosine Similarity _____________

# _____________ T.13 Euler’s Formula & De Moivre’s Theorem _____________
