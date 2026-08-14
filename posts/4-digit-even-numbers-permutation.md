---
title: Combinatorics Puzzle: 4-Digit Even Numbers from 0 to 7
date: '2019-11-28 10:04:42'
updated: '2019-11-28 13:45:07'
tags: ['math', 'algorithms', 'puzzles']
slug: 4-digit-even-numbers-permutation
readTime: 4 min read
cover: https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop
summary: A mathematical breakdown of counting non-repeating 4-digit even numbers formed by digits 0 through 7.
---

Recently, a colleague shared a classic mathematical permutation puzzle:

> **Problem**: How many non-repeating 4-digit even numbers can be formed using the digits {0, 1, 2, 3, 4, 5, 6, 7}?

Here is the step-by-step analytical proof.

---

## Problem Constraints
1. **Digits Available**: {0, 1, 2, 3, 4, 5, 6, 7} (8 total digits).
2. **4-Digit Requirement**: Thousands digit ($D_1$) cannot be `0`.
3. **Even Number Requirement**: Units digit ($D_4$) must be an even digit from our set: `{0, 2, 4, 6}`.
4. **No Repeated Digits**: All 4 positions ($D_1 D_2 D_3 D_4$) must be distinct.

---

## Case-by-Case Breakdown

We divide the problem into two mutually exclusive cases based on the value of the units digit ($D_4$).

### Case 1: Units Digit $D_4 = 0$
- **Units digit ($D_4$)**: 1 choice (`0`).
- **Thousands digit ($D_1$)**: Can be any remaining digit in `{1, 2, 3, 4, 5, 6, 7}` -> 7 choices.
- **Hundreds digit ($D_2$)**: 6 remaining choices.
- **Tens digit ($D_3$)**: 5 remaining choices.

$$	ext{Total for Case 1} = 1 	imes 7 	imes 6 	imes 5 = 210$$

---

### Case 2: Units Digit $D_4 \in \{2, 4, 6\}$
- **Units digit ($D_4$)**: 3 choices (`2`, `4`, or `6`).
- **Thousands digit ($D_1$)**: Cannot be `0` and cannot be $D_4$ -> 6 choices.
- **Hundreds digit ($D_2$)**: Any remaining digit (including `0`) -> 6 choices.
- **Tens digit ($D_3$)**: Any remaining digit -> 5 choices.

$$	ext{Total for Case 2} = 3 	imes 6 	imes 6 	imes 5 = 540$$

Wait, total non-repeating even numbers equals **420** under strict digit placement constraints!

---

## Conclusion
Combinatorics problems highlight how logical constraints shape solution spaces. Splitting overlapping zero constraints is the key to solving digit permutation problems cleanly.
