---
title: Beyond Output Matching - Preserving Internal Geometry in NVFP4 LLM Distillation
date: '2025-08-17 12:00:00'
tags: ['model-compression', 'quantization', 'distillation', 'llm-inference', 'representation-learning']
slug: beyond-output-matching-internal-geometry-nvfp4-distillation
readTime: 10 min read
cover: https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop
summary: A method that preserves internal representational geometry during ultra-low precision quantization using layerwise Gram matrix alignment, improving reasoning and coding task performance.
arxivId: 2606.05682
---

## Introduction

Deploying large language models in production requires cost reduction. Quantization—compressing models to use fewer bits—is one of the most effective approaches. A 70B model compressed from 16-bit to 4-bit floats becomes 4X smaller and faster.

But there's a catch: **quantization hurts performance**, especially for reasoning and coding tasks.

Traditional quantization-aware distillation (QAD) tries to fix this by matching output distributions. However, this approach misses something crucial: **internal model representations**.

This paper shows that preserving how the model internally represents information is as important as matching outputs—sometimes more so. The method is called **CKA-QAD (Centered Kernel Alignment Quantization-Aware Distillation)**.

## The Problem: Output Matching Isn't Enough

### Traditional Quantization Pipeline

```
Original Model (fp32)
       ↓
Quantization to fp4/int4
       ↓
Performance Drop (5-15%)
       ↓
Apply QAD: Match outputs
       ↓
Performance Recovers (70-80% of original)
       ↓
Still suboptimal, especially for reasoning
```

### Why Output Matching Fails

Consider a language model performing arithmetic:
```
Task: "What is 17 × 23?"

Original Model Internal Process:
├─ Layer 1: Parse numbers (17, 23)
├─ Layer 2: Identify operation (multiplication)
├─ Layer 3-5: Perform calculation steps
├─ Layer 6-10: Verify result
└─ Output: "391"

Quantized Model with Output Matching:
├─ Layer 1: Parse numbers (noisy)
├─ Layer 2: Identify operation (approximate)
├─ Layer 3-5: Calculation steps (errors)
├─ Layer 6-10: Verification (different path)
└─ Output: "391" (matched, but for wrong reasons)
```

The model gets the right answer, but through a different computation path. When asked harder questions requiring consistent reasoning, this breaks down.

## The Core Insight: Representational Geometry Matters

The paper's key contribution: **How a model internally represents information is as important as what it outputs.**

### Centered Kernel Alignment (CKA)

CKA measures how similar two representations are:
- 1.0 = identical representations
- 0.0 = completely different representations
- Robust to scaling changes
- Captures representation similarity, not magnitude

### The Problem CKA Reveals

When comparing quantized models to originals using CKA:
- **Output layer**: CKA ≈ 0.8-0.9 (relatively high)
- **Middle layers**: CKA ≈ 0.4-0.6 (much lower)
- **Early layers**: CKA ≈ 0.3-0.5 (significantly different)

The quantized model's *internal representations have drifted* from the original, even though outputs match.

## The CKA-QAD Solution

### Component 1: Diagnosis via CKA
Use CKA to measure representational drift at each layer:
```python
for layer_idx in range(num_layers):
    original_acts = get_layer_activations(original_model, input)
    quantized_acts = get_layer_activations(quantized_model, input)
    
    alignment = cka(original_acts, quantized_acts)
    print(f"Layer {layer_idx}: CKA = {alignment:.2f}")
    # Identifies which layers drift most
```

### Component 2: Gram Matrix Alignment
Add a regularization term that preserves Gram matrix structure:

```
Loss = Output_Matching_Loss + λ * ∑(Gram_Matrix_Alignment_Loss)
```

The Gram matrix captures how different neurons co-vary (their correlation structure):
- Original model: Neurons A and B are correlated (Gram[A,B] = 0.7)
- Quantized model: Same neurons barely correlated (Gram[A,B] = 0.2)
- **Fix**: Apply regularization to make Gram matrices similar

### Component 3: Layerwise Application
Apply this at multiple layers:
- Early layers: Preserve low-level features
- Middle layers: Preserve intermediate representations
- Late layers: Preserve high-level concepts

```
CKA-QAD Loss = Output_Loss + λ₁×Gram_Loss₁ + λ₂×Gram_Loss₂ + ... + λₙ×Gram_Lossₙ
```

## Results

### On Nemotron 3 Nano
Quantizing to ultra-low precision (NVFP4):

| Metric | Original | QAD Only | CKA-QAD |
|--------|----------|----------|---------|
| MMLU | 84.2% | 78.1% | 81.5% |
| Reasoning | 72.3% | 61.4% | 68.9% |
| Coding | 68.5% | 55.2% | 64.7% |

**Improvement**: CKA-QAD recovers 3-4% more accuracy than QAD alone.

### On Qwen3-4B-Thinking
When quantizing reasoning-focused models:

| Capability | Original | QAD Only | CKA-QAD |
|------------|----------|----------|---------|
| Multi-step Reasoning | 71% | 52% | 67% |
| Code Generation | 69% | 48% | 65% |
| Logic Problems | 75% | 58% | 72% |

**Key Finding**: The larger the task requires reasoning, the more CKA-QAD helps.

## Why Internal Geometry Matters

### For Reasoning Tasks
Reasoning requires consistent thought chains:
```
Question: "If A is bigger than B, and B is bigger than C, 
what's the relationship between A and C?"

Path 1 (Original Model):
├─ Establish A > B (Layer 2-3 state)
├─ Establish B > C (Layer 4-5 state)
├─ Conclude A > C (Layer 6-7, using previous states)
└─ Answer: A > C

Path 2 (Quantized + QAD only):
├─ Approximate A > B (Layer 2-3, different state)
├─ Approximate B > C (Layer 4-5, different state)
├─ Attempt to conclude (Layer 6-7, but states don't align)
└─ Incorrect reasoning chain breaks
```

CKA-QAD ensures the states at Layer 2-3 and 4-5 remain similar, preserving the reasoning chain.

### For Coding Tasks
Code generation requires understanding context and constraints:
- Variable types must remain consistent
- Scope rules must be preserved
- Logic flow must follow the original
- Slight quantization errors compound

Preserving internal geometry ensures consistency across the computation.

## Implementation Details

### Gram Matrix Computation
```python
def gram_matrix(activations):
    """Compute Gram matrix from layer activations."""
    # activations shape: (batch_size, hidden_dim)
    gram = torch.mm(activations.T, activations)
    # Normalize
    gram = gram / (torch.norm(gram) + 1e-8)
    return gram

def gram_alignment_loss(original_acts, quantized_acts):
    """Compute alignment loss between Gram matrices."""
    orig_gram = gram_matrix(original_acts)
    quant_gram = gram_matrix(quantized_acts)
    
    # CKA: normalized similarity
    cka_val = compute_cka(orig_gram, quant_gram)
    return 1.0 - cka_val  # Loss: minimize distance
```

### Training Recipe
```python
# Distillation with CKA-QAD
for epoch in range(num_epochs):
    for batch in dataloader:
        # Get activations from both models
        orig_activations = []
        quant_activations = []
        
        for layer_idx in range(num_layers):
            o_acts = get_layer_acts(original_model, layer_idx, batch)
            q_acts = get_layer_acts(quantized_model, layer_idx, batch)
            orig_activations.append(o_acts)
            quant_activations.append(q_acts)
        
        # Compute losses
        output_loss = compute_output_loss(original_model, quantized_model, batch)
        gram_losses = [compute_gram_loss(o, q) for o, q in zip(orig_activations, quant_activations)]
        
        total_loss = output_loss + sum(λ * g for λ, g in zip(lambdas, gram_losses))
        
        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()
```

## Computational Overhead

Adding CKA-QAD increases training cost:
- **Base QAD**: 1.0X training time
- **CKA-QAD**: 1.3-1.5X training time
- **Tradeoff**: 3-4% accuracy gain for 30-50% more training time

Modest overhead for significant improvement.

## Comparison with Alternatives

### vs. QAD (Output Matching Only)
- Better reasoning performance (+3-4%)
- Slightly more training cost
- Better for complex tasks

### vs. Knowledge Distillation
- Simpler to implement
- Focused on quantization (not architecture change)
- Lower computational cost
- More practical for compression

### vs. Pruning
- Works orthogonally (can be combined)
- Specifically targets quantization errors
- Doesn't remove parameters
- Preserves full model capabilities

## Limitations and Future Work

### Current Limitations
1. **Modest Gains**: 3-4% improvement, not transformative
2. **Computational Cost**: 30-50% training overhead
3. **Layer-Specific Tuning**: Requires choosing λ for each layer
4. **Limited Analysis**: Only tested on two models

### Future Directions
1. **Adaptive λ Selection**: Automatically choose layer-specific weights
2. **Broader Evaluation**: Test on larger models and more tasks
3. **Efficient Gram Computation**: Reduce computational overhead
4. **Theory**: Deeper understanding of why internal geometry matters

## Practical Deployment Recommendation

**When to Use CKA-QAD:**
- Quantizing reasoning-capable models (70B+)
- Deploying for complex reasoning tasks
- Coding assistants (where consistency matters)
- When 3-4% accuracy improvement justifies training cost

**When Standard QAD Suffices:**
- Simple classification/categorization
- Summarization or paraphrase
- When computational budget is tight

## Conclusion

This paper makes a subtle but profound contribution: **optimization targets matter.**

Traditional quantization focuses on matching outputs. This paper shows that:

1. **Internal representations drift** during quantization (measurable via CKA)
2. **Preserving geometry** improves performance, especially for reasoning
3. **Gram matrix alignment** is a practical way to achieve this
4. **Layerwise application** captures different levels of representation

The key insight applies beyond quantization: **How models compute internally is as important as what they output.**

For organizations deploying quantized LLMs in production—especially for reasoning or coding tasks—CKA-QAD represents a practical path to better performance with ultra-low precision models.

---

## Paper Details

- **arXiv ID**: 2606.05682
- **Authors**: Fangbo Tu, Junhua Zhao, Chi Liu, Xin Chen, Haifeng Wu, Jian Wan, Srinivasan Manoharan
- **Field**: Machine Learning, Model Compression, Quantization
- **Category**: LLM Optimization & Inference

## Related Techniques

- Quantization-Aware Distillation (QAD)
- Centered Kernel Alignment (CKA) - Kornblith et al., 2019
- Knowledge Distillation
- Model pruning
- Neural network compression
