---
title: "Statistics"
description: "The science of collecting, analyzing, and interpreting data"
tags:
  - type: topic
    name: Statistics
related:
  - machine-learning
  - calculus
  - linear-algebra
---

# Statistics

Statistics is the discipline that concerns the collection, organization, analysis, interpretation, and presentation of data. It provides the mathematical framework for making inferences about populations based on sample data and is fundamental to scientific research, data science, and decision-making.

## Descriptive Statistics

Descriptive statistics summarize and describe the main features of a dataset:

- **Measures of Central Tendency**: Mean (average), median (middle value), mode (most frequent)
- **Measures of Spread**: Range, variance, standard deviation, interquartile range
- **Distribution Shape**: Skewness (asymmetry) and kurtosis (tail heaviness)

## Probability Distributions

### Discrete Distributions

- **Binomial**: Number of successes in n independent trials
- **Poisson**: Count of events occurring in a fixed interval
- **Geometric**: Number of trials until the first success

### Continuous Distributions

- **Normal (Gaussian)**: The bell curve, described by mean and standard deviation
- **Exponential**: Time between events in a Poisson process
- **Uniform**: Equal probability across an interval
- **Student's t**: Similar to normal but with heavier tails; used with small samples

## Inferential Statistics

### Hypothesis Testing

A systematic method for testing claims about a population:

1. State null hypothesis (H0) and alternative hypothesis (H1)
2. Choose a significance level (alpha, typically 0.05)
3. Calculate the test statistic and p-value
4. Reject H0 if p-value < alpha

Common tests include the t-test, chi-square test, ANOVA, and Mann-Whitney U test.

### Confidence Intervals

A range of values that is likely to contain the true population parameter. A 95% confidence interval means that if we repeated the sampling process many times, about 95% of the resulting intervals would contain the true parameter.

## Regression Analysis

Regression models the relationship between variables. **Linear regression** fits a line y = mx + b to minimize the sum of squared residuals. **Multiple regression** extends this to multiple predictors. **Logistic regression** models binary outcomes using the logistic function.

## Bayesian Statistics

An approach based on Bayes' theorem that updates the probability of a hypothesis as more evidence becomes available. Unlike frequentist statistics, Bayesian methods incorporate prior beliefs and produce posterior distributions over parameters.
