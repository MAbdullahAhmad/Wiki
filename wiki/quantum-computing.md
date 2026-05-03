---
title: "Quantum Computing"
description: "Computing using quantum mechanical phenomena like superposition"
tags:
  - type: subtopic
    name: Quantum Computing
related:
  - quantum-mechanics
  - algorithms
  - linear-algebra
---

# Quantum Computing

Quantum computing is a type of computation that harnesses quantum mechanical phenomena such as superposition, entanglement, and interference to process information. Quantum computers use quantum bits (qubits) instead of classical bits, enabling them to solve certain problems exponentially faster than classical computers.

## Qubits

Unlike classical bits that are either 0 or 1, a qubit can exist in a **superposition** of both states simultaneously. This is represented as:

**|psi> = alpha|0> + beta|1>**

where alpha and beta are complex probability amplitudes satisfying |alpha|^2 + |beta|^2 = 1. When measured, the qubit collapses to |0> with probability |alpha|^2 or |1> with probability |beta|^2.

## Quantum Gates

Quantum computations are performed using quantum gates that manipulate qubits:

- **Hadamard (H)**: Creates superposition from a basis state
- **Pauli-X**: Quantum equivalent of a NOT gate
- **CNOT**: Controlled-NOT gate for creating entanglement
- **Toffoli**: Universal reversible gate (controlled-controlled-NOT)
- **Phase Gates**: Rotate the phase of a qubit state

## Key Algorithms

### Shor's Algorithm

Factors large integers in polynomial time, threatening RSA encryption. A quantum computer with enough stable qubits could break most current public-key cryptography.

### Grover's Algorithm

Searches an unsorted database of N items in O(sqrt(N)) time, providing a quadratic speedup over classical linear search.

### Variational Quantum Eigensolver (VQE)

A hybrid quantum-classical algorithm for finding the ground state energy of molecular systems, useful in quantum chemistry simulations.

## Current Hardware

Quantum computing platforms include superconducting qubits (IBM, Google), trapped ions (IonQ, Quantinuum), photonic systems (Xanadu, PsiQuantum), and neutral atoms (QuEra). Current devices are in the **Noisy Intermediate-Scale Quantum (NISQ)** era, with tens to hundreds of qubits affected by noise and decoherence.

## Challenges

Major challenges include achieving quantum error correction, scaling up the number of qubits, maintaining coherence times, and developing practical quantum algorithms that provide real advantages over classical computing for useful problems.
