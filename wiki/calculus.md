---
title: "Calculus"
description: "The mathematical study of continuous change"
tags:
  - type: topic
    name: Calculus
related:
  - linear-algebra
  - statistics
  - classical-mechanics
---

# Calculus

Calculus is the mathematical study of continuous change. It has two major branches: **differential calculus** (concerning rates of change and slopes of curves) and **integral calculus** (concerning accumulation of quantities and areas under curves). These two branches are related by the fundamental theorem of calculus.

## Limits

The concept of a limit is the foundation of calculus. A limit describes the value that a function approaches as the input approaches some value.

**lim(x->a) f(x) = L** means that f(x) gets arbitrarily close to L as x approaches a.

Key limit properties include the sum rule, product rule, quotient rule, and the squeeze theorem.

## Derivatives

The derivative of a function measures its instantaneous rate of change. For a function f(x), the derivative is defined as:

**f'(x) = lim(h->0) [f(x+h) - f(x)] / h**

### Common Derivative Rules

- **Power Rule**: d/dx [x^n] = n * x^(n-1)
- **Product Rule**: d/dx [f*g] = f'*g + f*g'
- **Quotient Rule**: d/dx [f/g] = (f'*g - f*g') / g^2
- **Chain Rule**: d/dx [f(g(x))] = f'(g(x)) * g'(x)

## Integrals

Integration is the inverse operation of differentiation. The definite integral computes the accumulated quantity (area under the curve):

**integral from a to b of f(x) dx**

### Integration Techniques

- **Substitution**: Reverse of the chain rule
- **Integration by Parts**: integral(u dv) = uv - integral(v du)
- **Partial Fractions**: Decomposing rational functions
- **Numerical Methods**: Trapezoidal rule, Simpson's rule

## The Fundamental Theorem of Calculus

This theorem links differentiation and integration:

1. If F(x) = integral from a to x of f(t) dt, then F'(x) = f(x)
2. integral from a to b of f(x) dx = F(b) - F(a), where F is any antiderivative of f

## Applications

Calculus is essential in physics (motion, forces, energy), engineering (optimization, signal processing), economics (marginal analysis, optimization), biology (population modeling, growth rates), and computer science (machine learning optimization, computer graphics).
