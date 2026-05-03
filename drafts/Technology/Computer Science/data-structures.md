---
title: "Data Structures"
description: "Specialized formats for organizing and storing data"
tags:
  - type: topic
    name: Data Structures
related:
  - algorithms
  - python-programming
---

# Data Structures

A data structure is a specialized format for organizing, processing, retrieving, and storing data. Choosing the right data structure is crucial for writing efficient software, as it directly impacts the time and space complexity of operations.

## Linear Data Structures

### Arrays

A collection of elements stored in contiguous memory locations. Arrays provide O(1) access by index but O(n) insertion and deletion in the worst case. They form the basis for many other data structures.

### Linked Lists

A sequence of nodes where each node contains data and a reference to the next node. Variants include **singly linked lists**, **doubly linked lists**, and **circular linked lists**. They offer O(1) insertion/deletion at known positions but O(n) access by index.

### Stacks

A Last-In-First-Out (LIFO) structure supporting `push` and `pop` operations in O(1) time. Used in function call management, expression evaluation, undo mechanisms, and backtracking algorithms.

### Queues

A First-In-First-Out (FIFO) structure supporting `enqueue` and `dequeue` operations. Variants include **priority queues** (elements dequeued by priority) and **deques** (double-ended queues allowing insertion/removal at both ends).

## Non-Linear Data Structures

### Trees

Hierarchical structures with a root node and child nodes. Important types include:

- **Binary Search Tree (BST)**: Left children are smaller, right children are larger
- **AVL Tree**: Self-balancing BST with O(log n) operations
- **Red-Black Tree**: Self-balancing BST used in many standard libraries
- **B-Tree**: Multi-way tree optimized for disk-based storage systems
- **Heap**: Complete binary tree used for priority queues

### Graphs

Collections of vertices connected by edges. Graphs can be **directed** or **undirected**, **weighted** or **unweighted**, **cyclic** or **acyclic**. They model networks, relationships, and many real-world problems.

### Hash Tables

Data structures that map keys to values using a hash function. They provide average O(1) lookup, insertion, and deletion. Collision resolution strategies include **chaining** and **open addressing**.

## Complexity Comparison

| Structure | Access | Search | Insert | Delete |
|-----------|--------|--------|--------|--------|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1) | O(1) |
| Hash Table | N/A | O(1)* | O(1)* | O(1)* |
| BST | O(log n)* | O(log n)* | O(log n)* | O(log n)* |
| Heap | O(n) | O(n) | O(log n) | O(log n) |

*Average case; worst case may differ.
