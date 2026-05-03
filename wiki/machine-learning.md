---
title: "Machine Learning"
description: "A subset of AI that enables systems to learn from data"
tags:
  - type: subtopic
    name: Machine Learning
related:
  - artificial-intelligence
  - deep-learning
  - statistics
  - python-programming
  - linear-algebra
---

# Machine Learning

Machine Learning (ML) is a branch of artificial intelligence that focuses on building systems that learn from data to improve their performance on a specific task without being explicitly programmed. It is one of the most actively researched areas in computer science today.

## Types of Learning

### Supervised Learning

The algorithm learns from labeled training data, mapping inputs to known outputs. Common tasks include **classification** (predicting categories) and **regression** (predicting continuous values).

### Unsupervised Learning

The algorithm discovers hidden patterns in unlabeled data. Key techniques include **clustering** (grouping similar data points) and **dimensionality reduction** (reducing the number of features).

### Reinforcement Learning

An agent learns to make decisions by performing actions in an environment and receiving rewards or penalties. This approach powers game-playing AI and robotics control systems.

## Common Algorithms

- **Linear Regression**: Models the relationship between variables using a linear equation
- **Decision Trees**: Tree-like models of decisions and their consequences
- **Support Vector Machines**: Finds the optimal hyperplane separating classes
- **k-Nearest Neighbors**: Classifies based on similarity to nearby data points
- **k-Means Clustering**: Partitions data into k distinct clusters
- **Random Forests**: Ensemble of decision trees for improved accuracy
- **Gradient Boosting**: Sequential ensemble method that corrects previous errors

## Model Evaluation

Evaluating ML models requires careful methodology:

| Metric | Use Case |
|--------|----------|
| Accuracy | Overall correctness for balanced datasets |
| Precision | When false positives are costly |
| Recall | When false negatives are costly |
| F1 Score | Balance between precision and recall |
| AUC-ROC | Binary classification performance |
| MSE/RMSE | Regression error measurement |

## Feature Engineering

The process of selecting, transforming, and creating input variables to improve model performance. Techniques include normalization, one-hot encoding, polynomial features, and domain-specific transformations. Good feature engineering often matters more than the choice of algorithm.
