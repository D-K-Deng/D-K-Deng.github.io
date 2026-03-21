---

title: "PwnGPT Pipeline: LLM-Guided Reverse Engineering and Exploit Iteration"
published: 2026-03-18
description: 'An LLM-assisted reverse engineering pipeline that analyzes binaries, generates exploit attempts, verifies them automatically, and iterates through reflection, tool use, and repair.'
image: ''
tags: [Python, Security, Reverse Engineering]
category: 'Projects'
draft: false
seriesCategory: "Projects"
seriesCategoryDescription: "My Projects"
series: "Computer Science"
seriesDescription: "Projects exploring core concepts and applications in computer science, including algorithms, data structures, and software development"

---

::github{repo="D-K-Deng/LLM-RevTool"}

## Abstract

This project is an LLM-guided reverse engineering pipeline built to move from binary analysis to exploit generation through a controlled iterative loop. Instead of treating exploit synthesis as a single prompt-and-pray interaction, the system decomposes the task into analysis, planning, evidence gathering, code generation, verification, reflection, and repair.

What makes the pipeline interesting to me is that it treats exploit development as a feedback system rather than a one-shot completion problem. The model is allowed to reason over structured analysis, request additional evidence, produce exploit drafts, observe concrete verification failures, and then revise its strategy. That makes the workflow much closer to how real debugging and binary exploitation actually proceed.

## Introduction

I wanted this project to explore a practical question: how far can an LLM be pushed in reverse engineering work if it is embedded inside a disciplined iterative pipeline rather than asked to improvise in free-form conversation?

Reverse engineering is an especially demanding setting for language models. The problem is not just generating code. It is understanding a target binary, deciding what evidence matters, choosing a plausible exploitation strategy, interacting with the execution environment safely, and then adapting when the first attempt fails.

That is why I built the pipeline around explicit stages rather than a monolithic agent:

- binary analysis to extract structured facts
- prompt construction from those facts
- tool and shell evidence collection
- exploit generation and format repair
- verification against the actual target
- reflection over failures and retry
- batch evaluation for broader testing

The result is less of a chatbot and more of an orchestration layer for exploit reasoning.

## Pipeline Design

### Binary Analysis as the First Stage

The pipeline begins with static analysis. The `BinaryAnalyzer` produces an `AnalysisReport.json` that becomes the structured context for later stages. This matters because exploit generation becomes much more stable when the model starts from normalized binary facts rather than raw terminal noise.

That analysis is also prunable, which is important in practice. Reverse engineering artifacts can easily become too verbose, and LLM quality drops fast when the context is cluttered with irrelevant details. Starting with a structured report keeps the later prompts grounded.

### Evidence Gathering Before Generation

One of the stronger design choices in the project is that the model is not limited to the initial analysis report. Before each major generation step, it can propose additional tool requests and command requests. Those requests are executed through dedicated runners rather than unconstrained ad hoc interaction.

This turns the pipeline into a hybrid system:

- the analyzer produces a first-pass summary
- tools collect extra evidence on demand
- the orchestrator merges those results back into the generation context

That loop gives the model more than static input. It gives it a chance to refine its understanding before committing to code.

### Generation, Reflection, and Repair

The exploit generation layer is handled by `ExploitGenerator`. It builds prompts from the analysis, feedback from prior attempts, previous code, tool output, and reflection summaries. If the model returns usable Python directly, the pipeline proceeds. If the structure is malformed, the system enters a format-repair stage and asks the model to rewrite its response into the required form.

I found this especially important for exploitation tasks because output quality is not just about strategy. Formatting discipline matters too. An exploit that is conceptually promising but structurally unusable is still a failed attempt in an automated pipeline.

Reflection adds another layer. After a failed round, the system asks the model to reason about what went wrong before trying again. That makes retries feel less like blind repetition and more like guided revision.

### Verification as the Core Feedback Signal

Verification is what keeps the project honest. Generated exploit scripts are executed in a subprocess against the target binary with controlled environment variables and runtime working directories. The verifier checks:

- whether the exploit timed out
- whether the process crashed
- whether required libraries were missing
- whether the binary path was handled incorrectly
- whether any configured success regex was matched

This is the point where the pipeline stops being speculative. Every attempt is forced into contact with the actual target.

I also liked the fact that verification returns structured failure feedback instead of a vague pass/fail signal. That lets the next round use concrete evidence such as stderr tails, exit codes, timeout status, and heuristic success markers.

### Iteration Instead of One-Shot Solving

The `SolveOrchestrator` is the heart of the project. It creates a run directory, writes every intermediate artifact, optionally tries a heuristic exploit before the first model call, and then enters an outer attempt loop with inner reflection-and-generation rounds.

This gives the pipeline a layered retry structure:

1. analyze the binary
2. gather bootstrap evidence
3. try a heuristic exploit if one is derivable
4. generate a model-based exploit
5. verify it
6. reflect on failure
7. gather more evidence if needed
8. repair or regenerate

That organization makes the system much more legible than a single opaque agent loop. It also leaves a complete trail of artifacts for inspection after the run is over.

## Code Deployment

The pipeline exposes three CLI entry points:

- `analyze` to generate a structured analysis report
- `solve` to run the full iterative exploit loop
- `eval` to batch-evaluate multiple targets from a manifest

The interface is defined in `cli.py`, and the configuration is centralized through `PipelineConfig`. That makes the project easy to run with different providers, models, retry budgets, prompt templates, and verification settings.

A typical solve flow looks like this conceptually:

```bash
python -m pwngpt_pipeline solve --binary /path/to/target
```

while analysis and evaluation are available through:

```bash
python -m pwngpt_pipeline analyze --binary /path/to/target
python -m pwngpt_pipeline eval --manifest /path/to/manifest.json
```

The value here is not just convenience. A clean CLI makes experimentation reproducible, which matters a lot in a system with many moving parts.

## Implementation

### CLI and Configuration Layer

The CLI supports provider overrides, reflection-model overrides, retry limits, artifact directories, verification timeouts, prompt-template overrides, and toggles for output strictness and context pruning. That tells you immediately what kind of system this is: one designed for iteration and ablation, not just a single hardcoded happy path.

The config layer also separates primary generation from reflection and repair, which is a subtle but useful design choice. It lets the pipeline use different model behavior for different cognitive roles inside the loop.

### Orchestration and Artifact Tracking

`SolveOrchestrator` ties everything together. It resolves the binary path, ensures executability, creates per-run and per-attempt directories, stores analysis artifacts, and records every round of generation, tool use, reflection, and verification.

That artifact discipline is one of the strongest parts of the system. Every run becomes auditable:

- `AnalysisReport.json`
- bootstrap evidence
- tool plans and tool results
- generated exploit code
- reflection text
- verification results

This is exactly the kind of traceability that an LLM-heavy security workflow needs.

### Generation and Prompting

The prompting layer is modular. `generation.py` does not simply ask for an exploit. It builds different prompts for generation, exploit planning, tool requests, reflection, and format repair. It can also switch into a scaffolded generation mode for more complex exploit families.

That separation makes the system much easier to control. Rather than relying on one giant prompt to do everything, the pipeline splits reasoning into stages with different output expectations.

### Verification and Runtime Isolation

`verification.py` is deliberately strict. It launches exploit scripts in a subprocess, injects environment variables such as `TARGET_BINARY`, `TARGET_RUNTIME_DIR`, and `TARGET_CHALLENGE_DIR`, augments the runtime library path when needed, and interprets the result through status categories like `success`, `timeout`, and `failed`.

This is a small but important systems detail: verification is not just "did the script run?" It is "did it run in the right environment, against the right target, under the right success conditions?"

### Evaluation and Scaling the Workflow

The presence of `evaluation.py` and `launcher.py` makes the project more than a single-target exploit assistant. It becomes a framework for repeated testing. Once a pipeline can analyze, solve, and evaluate across multiple binaries, it starts to become useful for benchmarking and controlled experimentation.

That broader framing is one reason I liked this project. It treats reverse engineering not only as a one-off challenge but as a structured workflow that can be measured and improved.

## What This Project Taught Me

What I found most valuable here is how clearly the project exposes the difference between raw model intelligence and systems intelligence.

An LLM may produce a plausible exploit script, but that alone is not enough. The hard part is making the whole loop reliable:

- the right binary facts have to be extracted
- the right evidence has to be gathered
- the prompt has to demand the right structure
- verification has to be concrete and executable
- failures have to become useful feedback
- retries have to remain organized rather than chaotic

That is what this pipeline gave me. It made exploit generation feel less like a magic trick and more like an engineering process. For reverse engineering work, I think that shift matters a lot.
