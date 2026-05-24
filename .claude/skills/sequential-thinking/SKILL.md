---
name: sequential-thinking
description: Break down complex problems into explicit sequential reasoning steps with revision, branching, hypothesis generation, and verification
user_invocable: true
---

# Sequential Thinking

## Overview

A structured, reflective problem-solving process that breaks complex problems into numbered thought steps. Each thought can build on, question, or revise previous insights as understanding deepens.

**Core principle:** think step by step. Revise freely. Verify before concluding.

## When to Use

- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope is not clear initially
- Problems requiring a multi-step solution
- Tasks needing context maintained over many steps
- Filtering out irrelevant information
- Architecture decisions with trade-offs
- Debugging where multiple hypotheses exist

## Tool Integration

This project has the `mcp__sequential-thinking__sequentialthinking` tool available. Prefer the tool for non-trivial reasoning — it produces a structured trace that the user can audit.

When the tool isn't available (or for short reasoning), use the inline format below.

## The Process

### Step 1: Estimate Scope

Before your first thought, estimate how many steps you will need. The estimate can adjust up or down as you progress.

### Step 2: Execute Thought Steps

Each thought:

```
**[Thought N/Total]**
[Your current thinking step]
```

A thought may include:

- Regular analytical steps
- Revisions of previous thoughts
- Questions about previous decisions
- Realizations needing more analysis
- Changes in approach
- Hypothesis generation
- Hypothesis verification

### Step 3: Revise When Needed

When a previous thought was wrong or incomplete:

```
**[Revision: Thought N revises Thought M]**
[Why the previous thought was wrong, plus the corrected thinking]
```

Do not pretend earlier thoughts were correct. Mark corrections explicitly.

### Step 4: Branch When Needed

When exploring an alternative from an earlier point:

```
**[Branch from Thought N: branch-name]**
[Alternative reasoning]
```

You can have multiple branches. Label them clearly so outcomes can be compared.

### Step 5: Generate and Verify Hypotheses

When you have enough reasoning to form a hypothesis:

```
**[Hypothesis]**
[Your proposed solution or conclusion]

**[Verification]**
[Check the hypothesis against your chain of thought]
[Does it hold up? Are there contradictions?]
```

If verification fails, return to thought steps. Do not force a broken hypothesis through.

### Step 6: Conclude

Only when you are genuinely satisfied:

```
**[Answer]**
[Your final, verified conclusion]
```

## Rules

1. **Start with an initial estimate**, but adjust freely
2. **Question and revise** previous thoughts whenever warranted
3. **Add more thoughts** if needed, even after the initial estimate
4. **Express uncertainty** when present — don't pretend to know
5. **Mark revisions and branches** explicitly so reasoning is traceable
6. **Filter noise** at each step
7. **Generate a hypothesis** when you have enough evidence
8. **Verify the hypothesis** against your chain of thought before concluding
9. **Repeat** hypothesis–verification cycles until satisfied
10. **Only conclude** when you have a genuinely verified answer

## Anti-Patterns

| Anti-Pattern                                 | Correction                                                           |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Skipping to answer without steps             | Always show the reasoning chain                                      |
| Pretending early thoughts were right         | Use revision markers explicitly                                      |
| Never revising                               | If nothing needs revision, you may not be thinking critically enough |
| Forcing a conclusion when verification fails | Return to thought steps instead                                      |
| Ignoring branches when alternatives exist    | Explore them explicitly                                              |
| Vague thoughts ("this seems right")          | Be specific: what exactly and why                                    |
| Adjusting the estimate down to rush          | Add thoughts if the problem warrants them                            |

## Example

Given: "Should we use a microservices or modular-monolith architecture for this project?"

```
**[Thought 1/6]**
Constraints first: team size, deployment, expected scale. A 4-dev team with
a single deployment target leans monolith. Independent scaling needs lean
microservices.

**[Thought 2/6]**
The team is 4 developers. Microservices = each person owns 2-3 services
including ops. That's high overhead for a small team.

**[Thought 3/6]**
Scaling: read path needs 10x write capacity. Independent scaling of the read
service is a microservices argument.

**[Revision: Thought 4 revises Thought 2]**
"High overhead" was too quick. A modular monolith with extractable boundaries
gives us optional later splitting without upfront ops cost. Addresses the
scaling concern from Thought 3 while keeping the team-size win.

**[Thought 5/6]**
Deployment: client requires single-artifact, air-gapped delivery.
Microservices with orchestration adds significant complexity here.

**[Hypothesis]**
A modular monolith with explicit module boundaries is right. Fits team size,
meets the deployment constraint, allows future read-path extraction if scale
demands it.

**[Verification]**
- Team size (4): monolith manageable ✓
- Scaling (10x read): modules allow future extraction ✓
- Deployment (air-gapped, single artifact): monolith simplest ✓
- No contradictions in the chain.

**[Answer]**
Modular monolith with explicit boundaries between read and write paths.
Fits team and deployment constraints now; preserves the option to extract
the read path later.
```

## Integration With Other Skills

- After reasoning about a bug, use `systematic-debugging` for the fix
- After settling architecture, use `hexagonal-architecture-scaffolder` to implement
- After choosing a testing strategy, use `test-driven-development` to execute
- Use `verification-before-completion` to confirm your answer holds in practice
