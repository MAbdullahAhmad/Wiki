---
title: "Linear Algebra"
description: "The branch of mathematics dealing with vectors, matrices, and linear transformations"
tags:
  - type: topic
    name: Linear Algebra
related:
  - calculus
  - machine-learning
  - deep-learning
  - quantum-mechanics
  - statistics
---

# Linear Algebra

Linear algebra is the branch of mathematics concerning linear equations, linear maps, and their representations in vector spaces and through matrices. It is central to almost all areas of mathematics and is fundamental to the sciences and engineering.

## Vectors

A vector is a quantity with both magnitude and direction, represented as an ordered list of numbers. Key operations include:

- **Addition**: (a1, a2) + (b1, b2) = (a1+b1, a2+b2)
- **Scalar Multiplication**: c * (a1, a2) = (c*a1, c*a2)
- **Dot Product**: a . b = a1*b1 + a2*b2 + ... + an*bn
- **Cross Product** (3D): Produces a vector perpendicular to both inputs
- **Norm**: ||v|| = sqrt(v1^2 + v2^2 + ... + vn^2)

## Matrices

A matrix is a rectangular array of numbers. Operations include addition, scalar multiplication, matrix multiplication, transpose, and inversion.

### Key Properties

- **Determinant**: A scalar value encoding certain properties of the matrix. A matrix is invertible if and only if its determinant is non-zero.
- **Rank**: The maximum number of linearly independent rows or columns.
- **Trace**: The sum of diagonal elements.
- **Inverse**: A^(-1) such that A * A^(-1) = I (identity matrix).

## Eigenvalues and Eigenvectors

An eigenvector of a square matrix A is a non-zero vector v such that **Av = lambda * v**, where lambda is the corresponding eigenvalue. Eigendecomposition is essential in principal component analysis, quantum mechanics, and systems of differential equations.

## Linear Transformations

A function T: V -> W between vector spaces that preserves addition and scalar multiplication. Every linear transformation can be represented by a matrix. Common examples include rotations, reflections, projections, and scaling.

## Applications

- **Machine Learning**: Feature spaces, PCA, SVD for dimensionality reduction
- **Computer Graphics**: 3D transformations, projections, and rendering
- **Quantum Mechanics**: State vectors, operators, and measurements
- **Data Science**: Regression, recommendation systems, network analysis
- **Engineering**: Systems of equations, signal processing, control systems
