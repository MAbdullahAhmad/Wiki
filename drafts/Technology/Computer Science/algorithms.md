---
title: "Algorithms"
description: "Step-by-step procedures for solving computational problems"
tags:
  - type: topic
    name: Algorithms
related:
  - data-structures
  - python-programming
---

# Algorithms

An algorithm is a finite sequence of well-defined instructions for solving a class of problems or performing a computation. Algorithm design and analysis is a fundamental discipline in computer science that determines how efficiently problems can be solved.

## Sorting Algorithms

Sorting arranges elements in a specific order. Key algorithms include:

- **Quicksort**: Divide-and-conquer approach with average O(n log n) time. Picks a pivot and partitions elements around it.
- **Merge Sort**: Stable divide-and-conquer algorithm with guaranteed O(n log n) time and O(n) extra space.
- **Heap Sort**: Uses a binary heap for in-place O(n log n) sorting.
- **Insertion Sort**: Simple O(n^2) algorithm that is efficient for small or nearly sorted datasets.

## Searching Algorithms

- **Linear Search**: Scans every element sequentially in O(n) time.
- **Binary Search**: Requires sorted data and finds elements in O(log n) by repeatedly halving the search space.
- **Hash-Based Search**: O(1) average lookup using hash tables.

## Graph Algorithms

### Traversal

- **Breadth-First Search (BFS)**: Explores all neighbors at the current depth before moving deeper. Uses a queue.
- **Depth-First Search (DFS)**: Explores as far as possible along each branch before backtracking. Uses a stack or recursion.

### Shortest Path

- **Dijkstra's Algorithm**: Finds shortest paths from a source in graphs with non-negative weights. Time: O((V + E) log V) with a priority queue.
- **Bellman-Ford**: Handles negative edge weights. Time: O(VE).
- **A* Search**: Uses heuristics to guide the search for faster pathfinding.

## Dynamic Programming

A method for solving complex problems by breaking them into overlapping subproblems and storing their solutions. Classic examples include the Fibonacci sequence, knapsack problem, longest common subsequence, and edit distance.

## Big O Notation

Big O notation describes the upper bound of an algorithm's growth rate:

| Notation | Name | Example |
|----------|------|---------|
| O(1) | Constant | Array access by index |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear search |
| O(n log n) | Linearithmic | Merge sort |
| O(n^2) | Quadratic | Bubble sort |
| O(2^n) | Exponential | Recursive Fibonacci |

## Algorithm Design Paradigms

- **Divide and Conquer**: Split the problem, solve sub-problems, combine results
- **Greedy**: Make locally optimal choices at each step
- **Backtracking**: Explore all possibilities, pruning invalid paths
- **Branch and Bound**: Systematic enumeration with bounds to prune the search space
