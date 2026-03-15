---

title: "Adaptive Code AI Agents: From Utility-Gated Suggestions to Post-Training"
published: 2026-03-15
description: 'A coding-agent project that combines decision-theoretic suggestion gating, a ReAct-style CLI assistant, and reward-driven post-training for code generation.'
image: ''
tags: [Python, LLM, Reinforcement Learning, AI]
category: 'Projects'
draft: false
seriesCategory: "Projects"
seriesCategoryDescription: "My Projects"
series: "Computer Science"
seriesDescription: "Projects exploring core concepts and applications in computer science, including algorithms, data structures, and software development"

---

::github{repo="D-K-Deng/adaptive-code-ai-agents"}

## Abstract

This project explores coding assistance as both a **decision problem** and a **learning problem**. On one side, I wanted to understand when an agent should surface a suggestion at all, since every intervention carries generation cost, verification cost, and the risk of distracting the user. On the other side, I wanted to build a system that could improve code generation itself through repeated execution, reward signals, and post-training.

That led to a two-part system. The first part is **SimpleCoder**, a ReAct-style CLI coding agent with bounded tool use, optional retrieval over the workspace, planning, context compaction, and permission-aware file access. The second part is a **code RL post-training pipeline** that samples code, executes it in a sandbox, converts outcomes into rewards, and updates the model through an iterative training loop. Together, they form a single idea: a useful coding agent should know **when** to help and should keep learning **how** to help better.

## Introduction

Modern code assistants are often discussed as if generation quality were the whole story. But in practice, assistance quality depends on at least two separate questions.

The first question is **intervention**: when is it actually worth showing a suggestion? A suggestion may be correct and still be unhelpful if it costs more to inspect than it saves.

The second question is **adaptation**: once the model is producing code, how can its behavior be improved in a principled way rather than by prompt tweaking alone?

I treated this project as a bridge between those two questions. The modeling side gave me a framework for thinking about suggestion policies under uncertainty. The implementation side turned that framework into two working systems: one focused on inference-time interaction, and one focused on reward-driven improvement.

## Modeling the Intervention Layer

### Step 1: Modeling the Cost of Showing a Suggestion

The starting point is simple: showing a suggestion is not free. Even before a user decides whether to accept it, the system has already paid a generation latency cost and the user has already paid a verification cost.

If the suggestion is shown, the expected total time can be written as:

$$
\mathbb{E}[T \mid \text{show}]
= \tau + c_{\text{verify}} + p\,c_{\text{edit}} + (1-p)\,c_{\text{write}}
$$

Here:

- $\tau$ is the time spent generating the suggestion
- $c_{\text{verify}}$ is the time spent reading and checking it
- $c_{\text{edit}}$ is the time needed if the user accepts but still edits
- $c_{\text{write}}$ is the time needed if the user rejects and writes manually
- $p$ is the probability that the suggestion is accepted

This equation matters because it shifts the problem away from raw model confidence and toward **expected user effort**.

### Step 2: Turning Time into Utility

The next move is to compare this with the baseline of not showing anything at all. If the no-suggestion path costs $c_{\text{noshow}}$, then the utility of showing becomes:

$$
U_{\text{show}}(p) = c_{\text{noshow}} - \mathbb{E}[T \mid \text{show}]
$$

Substituting the previous expression gives:

$$
U_{\text{show}}(p)
= c_{\text{noshow}} - \bigl(\tau + c_{\text{verify}} + p\,c_{\text{edit}} + (1-p)\,c_{\text{write}}\bigr)
$$

$$
U_{\text{show}}(p)
= c_{\text{noshow}} - \tau - c_{\text{verify}} - p\,c_{\text{edit}} - c_{\text{write}} + p\,c_{\text{write}}
$$

$$
U_{\text{show}}(p)
= (c_{\text{noshow}} - \tau - c_{\text{write}} - c_{\text{verify}})
+ p(c_{\text{write}} - c_{\text{edit}})
$$

This is the key simplification: once the time costs are fixed, the whole decision collapses onto the acceptance probability $p$.

### Step 3: Deriving the Threshold for Intervention

If writing from scratch is the default fallback, then $c_{\text{noshow}} = c_{\text{write}}$. Under that assumption, showing is beneficial only when:

$$
U_{\text{show}}(p) > 0
$$

$$
(c_{\text{noshow}} - \tau - c_{\text{write}} - c_{\text{verify}})
+ p(c_{\text{write}} - c_{\text{edit}}) > 0
$$

$$
(c_{\text{write}} - \tau - c_{\text{write}} - c_{\text{verify}})
+ p(c_{\text{write}} - c_{\text{edit}}) > 0
$$

$$
(-\tau - c_{\text{verify}})
+ p(c_{\text{write}} - c_{\text{edit}}) > 0
$$

$$
p(c_{\text{write}} - c_{\text{edit}}) > \tau + c_{\text{verify}}
$$

which gives the threshold:

$$
p^* = \frac{\tau + c_{\text{verify}}}{c_{\text{write}} - c_{\text{edit}}}
$$

That threshold is what I found most elegant in the model. It says the system does not need a vague sense that a suggestion is "probably useful." It needs something sharper: the predicted acceptance rate must be high enough to overcome the combined burden of generation and inspection.

In other words, a coding assistant should intervene only when the expected savings justify the interruption.

### Step 4: Why a Scalar Probability Is Enough

Another useful consequence of the model is that the raw context itself is not needed once it has been compressed into an estimate of acceptance.

Suppose the user state depends on context features $x_t$ and a candidate suggestion $s_t$. The intervention decision can still be made entirely from the scalar prediction $p_t^*$, because all of the contextual complexity has already been folded into that number.

That makes the control problem cleaner. The system does not need to reason over the full state every time it decides whether to show. It needs a reliable estimator of acceptance.

### Step 5: Why Learning Is Necessary

Of course, the real acceptance probability is not directly observable. It depends on latent user state, which means the system has to learn an approximation such as:

$$
\hat{p}(x, s) \approx \Pr(A=1 \mid x, s)
$$

or, more explicitly,

$$
\hat{p}^{(2)}(x_t, s_t)
= \mathbb{E}_{\phi_t}
\left[
p_t^*(x_t, s_t, \phi_t)
\mid x_t, s_t
\right]
$$

This is where the modeling in the PDFs becomes especially important. The decision rule is not useful by itself unless the estimated probability is reasonably calibrated. If $\hat{p}$ is systematically too optimistic, the system will over-intervene. If it is too conservative, useful suggestions will be suppressed.

So the theoretical threshold only becomes operational once it is paired with a predictive model that can estimate acceptance from observable information.

### Step 6: Uncertainty and the Two-Stage Policy

One of the nicest extensions in the modeling section is the move from a single-stage decision rule to a two-stage one.

If a lightweight context-only model already predicts with high certainty that a suggestion will be accepted or rejected, then it may be wasteful to generate a full suggestion just to confirm what is already obvious. But if the prediction is highly uncertain, then generation becomes worth paying for because it can change the decision.

That intuition can be described using entropy: when $\hat{p}$ is near $0.5$, uncertainty is high; when it is near $0$ or $1$, uncertainty is low.

So the policy becomes:

- use a cheap context-only estimate when confidence is strong
- escalate to full suggestion generation only when uncertainty is high

This makes the system more computationally disciplined. It does not spend expensive generation effort on every interaction, only on ambiguous ones.

### Step 7: Why Acceptance Rate Is a Bad Proxy

The final modeling insight I wanted to preserve from the PDFs is the critique of optimizing for acceptance alone.

If suggestion length is denoted by $\ell$, an acceptance-oriented objective can be written as:

$$
R(\ell) = (1 - e^{-\gamma \ell})q^\ell
$$

This type of objective can favor suggestions that are easy to accept because they are short and low-risk. But short, low-risk completions are not necessarily the ones that save the most time.

If the actual goal is time saved, the utility of an accepted suggestion is modeled as:

$$
U(\ell) = \alpha \ell^\rho
$$

so the expected time saved becomes:

$$
\mathbb{E}[\text{time saved} \mid s_\ell]
= R(\ell)\,U(\ell)
= \alpha \ell^\rho R(\ell)
$$

Since $\alpha > 0$ does not change the maximizer, the effective objective is:

$$
f(\ell) = \ell^\rho R(\ell)
$$

If $\ell_{\text{acc}}$ maximizes $R(\ell)$, then the condition for the time-optimal choice to move to the right is:

$$
\ell_{\text{time}} > \ell_{\text{acc}}
\Longleftrightarrow
\max_{\ell > \ell_{\text{acc}}} \ell^\rho R(\ell)
>
\ell_{\text{acc}}^\rho R(\ell_{\text{acc}})
$$

Equivalently,

$$
\exists\, \ell > \ell_{\text{acc}} :
\ell^\rho R(\ell)
>
\ell_{\text{acc}}^\rho R(\ell_{\text{acc}})
$$

or in ratio form,

$$
\exists\, \ell > \ell_{\text{acc}} :
\frac{R(\ell)}{R(\ell_{\text{acc}})}
>
\left(\frac{\ell_{\text{acc}}}{\ell}\right)^\rho
$$

That distinction captures a common failure mode in coding assistants. A system that optimizes for acceptance alone may learn to surface tiny, safe, nearly trivial completions. Those completions boost the metric, but they do not meaningfully improve productivity. The metric looks healthy while the user experience remains shallow.

For me, this was the conceptual center of the project: **a good coding agent should optimize real utility, not just superficial agreement**.

## Modeling the Generator and Learning Signal

### Step 8: Why One Reference Solution Is Not Enough

Once the suggestion policy is defined, the next question is where those suggestions come from. A natural baseline is supervised fine-tuning on reference solutions. If a model assigns probability $\pi_\theta(y \mid P)$ to a solution $y$ for problem $P$, then the standard SFT objective is:

$$
L_{\mathrm{SFT}}(\theta)
= \mathbb{E}_{P \sim \mathcal{D}}
\left[
- \log \pi_\theta \bigl( Y_{\mathrm{ref}}(P) \mid P \bigr)
\right]
$$

In a finite dataset, that becomes:

$$
L_{\mathrm{SFT}}(\theta)
\approx
\frac{1}{N}\sum_{i=1}^{N}
- \log \pi_\theta \bigl( y_i^{\mathrm{ref}} \mid P_i \bigr)
$$

For a sequence $y = (y_1, \ldots, y_T)$, the model factorizes autoregressively:

$$
\pi_\theta(y \mid P)
=
\prod_{t=1}^{T}
\pi_\theta \bigl( y_t \mid P, y_{<t} \bigr)
$$

Therefore, the token-level negative log-likelihood expands as:

$$
-\log \pi_\theta (y^{\mathrm{ref}} \mid P)
=
\log \prod_{t=1}^{T}
\pi_\theta \bigl( y_t^{\mathrm{ref}} \mid P, y_{<t}^{\mathrm{ref}} \bigr)^{-1}
$$

$$
-\log \pi_\theta (y^{\mathrm{ref}} \mid P)
=
- \sum_{t=1}^{T}
\log \pi_\theta \bigl( y_t^{\mathrm{ref}} \mid P, y_{<t}^{\mathrm{ref}} \bigr)
$$

This is elegant, but it has a limitation that matters a lot for code. Many programming problems admit multiple correct implementations. If training pushes hard on only one reference trajectory, it can reduce probability mass on other valid solutions. In other words, SFT is faithful to the dataset, but not necessarily to the full solution set.

That is one of the reasons I found reward-based training more compelling for this project. Passing tests cares about semantic correctness, not stylistic imitation of a single reference answer.

### Step 9: Binary Reward vs. Fractional Reward

Once code is executable, reward design becomes the next modeling choice. If a candidate passes $k$ tests out of $n$, two obvious options are:

$$
R_{\mathrm{binary}} = \mathbf{1}\{k=n\},
\qquad
R_{\mathrm{fraction}} = \frac{k}{n}
$$

The fractional reward contains partial credit. It tells the model whether it is moving closer to a fully correct program even when it still fails some tests. That can make training denser and more informative.

At the same time, binary reward has a valuable strictness. It discourages opportunistic behavior that merely targets subsets of tests and instead forces the system to care about complete correctness. For code generation, that hard threshold often aligns better with how solutions are actually judged.

### Step 10: What a Completion Pipeline Really Needs

Before any reward can be assigned, the system needs a concrete procedure for producing a candidate program. In practice, that means more than sampling tokens.

The generation pipeline has to:

1. render the problem into the right prompt template
2. tokenize and initialize the model state
3. sample autoregressively under a decoding rule
4. stop on conditions stronger than just max tokens
5. decode the result into raw text

The stop conditions matter more than they first appear. End-of-sequence tokens, fenced code block termination, or explicit end markers all change the quality and cleanliness of outputs. If these controls are sloppy, evaluation becomes noisy before training even begins.

### Step 11: Why Prompt Rendering and Extraction Are Part of the Environment

I ended up treating prompt rendering and code extraction as first-class parts of the system, not incidental preprocessing.

If a model is paired with the wrong chat template, several things can go wrong:

- role tokens may be interpreted as plain text
- system instructions may lose their priority
- the model may produce malformed or out-of-distribution outputs

Similarly, code extraction from raw model text has to be deterministic. If a response contains explanations and multiple code fences, the evaluator needs a rule for choosing exactly one program string or returning failure. This is not just cleanup. It directly affects reward.

That is why formatting became part of the environment design. A logically correct solution that is wrapped in unusable structure can still fail extraction and receive no useful reward.

### Step 12: Why Safe Evaluation Requires a Sandbox

The moment code is executed in the loop, safety becomes non-negotiable. Running generated code through `exec()` on the host machine is not acceptable in any serious training pipeline.

There are at least two classes of failure:

- accidental failures, such as infinite loops, uncontrolled writes, or resource exhaustion
- adversarial failures, such as exfiltration of secrets, destructive shell commands, or malicious network behavior

This is why the sandbox is not auxiliary infrastructure. It is part of the learning environment itself. Without safe execution, automated code reward is not robust enough to trust.

### Step 13: Reward Shaping and Its Tradeoffs

The shaped reward I used conceptually is:

$$
r = r_{\mathrm{format}} + r_{\mathrm{correct}}
$$

and in the training setup this becomes:

$$
r = \alpha \cdot r_{\mathrm{format}} + r_{\mathrm{correct}}
$$

with a small formatting coefficient.

I found the tradeoff here interesting. A negative formatting term helps the model distinguish malformed output from merely incorrect logic, which can accelerate learning of basic output discipline. But too much weight on format can also create a distorted incentive, where the model learns to produce safe-looking structure without solving the actual task well.

That tension is exactly the kind of thing I wanted this project to make visible: reward design is never neutral. It shapes what the model learns to care about.

### Step 14: From Reward to Policy Gradient

Once a sampled completion $y = (y_1, \ldots, y_T)$ receives a scalar reward $R(y)$, the objective is to maximize expected reward:

$$
J(\theta) = \mathbb{E}_{y \sim \pi_\theta(\cdot \mid P)}[R(y)]
$$

Writing the expectation explicitly:

$$
\nabla_\theta J(\theta)
=
\nabla_\theta \sum_y \pi_\theta(y \mid P)\,R(y)
$$

$$
\nabla_\theta J(\theta)
=
\sum_y \nabla_\theta \pi_\theta(y \mid P)\,R(y)
$$

Using the log-derivative trick, $\nabla \pi = \pi \nabla \log \pi$:

$$
\nabla_\theta J(\theta)
=
\sum_y \pi_\theta(y \mid P)\,
\bigl[\nabla_\theta \log \pi_\theta(y \mid P)\bigr]\,R(y)
$$

Switching back to expectation notation:

$$
\nabla_\theta J(\theta)
=
\mathbb{E}_{y \sim \pi_\theta(\cdot \mid P)}
\Bigl[
R(y)\,\nabla_\theta \log \pi_\theta(y \mid P)
\Bigr]
$$

Since sequence probability factorizes over tokens,

$$
\log \pi_\theta(y \mid P)
=
\sum_{t=1}^{T}
\log \pi_\theta(y_t \mid P, y_{<t})
$$

so the final policy gradient becomes:

$$
\nabla_\theta \mathbb{E}_{y \sim \pi_\theta(\cdot \mid P)}[R(y)]
=
\mathbb{E}\left[
R(y)\sum_{t=1}^{T}\nabla_\theta \log \pi_\theta(y_t \mid P, y_{<t})
\right]
$$

This is the bridge between automatic evaluation and learning. Once reward exists, token probabilities can be updated in the direction of solutions that perform better under execution.

### Step 15: Baselines, Advantages, and Variance Reduction

Raw rewards are noisy, so the next refinement is to subtract a baseline $b(P)$ and define:

$$
A(y) = R(y) - b(P)
$$

The key reason this works is:

$$
\mathbb{E}_{y \sim \pi_\theta}
\left[
b(P)\nabla_\theta \log \pi_\theta(y \mid P)
\right]
=
b(P)\,
\mathbb{E}_{y \sim \pi_\theta}
\left[
\nabla_\theta \log \pi_\theta(y \mid P)
\right]
$$

$$
=
b(P)\sum_y \pi_\theta(y \mid P)\nabla_\theta \log \pi_\theta(y \mid P)
$$

$$
=
b(P)\sum_y \nabla_\theta \pi_\theta(y \mid P)
=
b(P)\nabla_\theta \sum_y \pi_\theta(y \mid P)
=
b(P)\nabla_\theta 1
= 0
$$

So subtracting the baseline leaves the expected gradient unchanged, while reducing variance. Intuitively, the model is no longer being told only "how good was this sample?" but rather "how good was this sample relative to what was expected for this problem?"

For grouped sampling, this becomes even cleaner. If we sample $G$ completions for the same prompt and define

$$
\bar{R} = \frac{1}{G}\sum_{g=1}^{G} R_g,
\qquad
A_g = R_g - \bar{R}
$$

then

$$
\sum_{g=1}^{G} A_g = 0
$$

because

$$
\sum_{g=1}^{G} A_g
=
\sum_{g=1}^{G}(R_g - \bar{R})
$$

$$
=
\sum_{g=1}^{G}R_g - G\bar{R}
$$

$$
=
\sum_{g=1}^{G}R_g
- G \cdot \frac{1}{G}\sum_{g=1}^{G}R_g
= 0
$$

This means the update is purely group-relative. The model is pushed toward completions that outperform their peers under the same prompt, and degenerate groups where all rewards are equal provide no learning signal at all.

That logic flows directly into GRPO. It is a neat fit for code generation because code rewards are sparse, high-variance, and naturally comparable within a prompt-conditioned group.

## Code Deployment

### Running SimpleCoder

The first implementation is packaged as a command-line tool. From the project root, the workflow is straightforward:

```bash
pip install -r requirements.txt
pip install -e .
simplecoder "create a hello.py file"
simplecoder --use-rag "what does the Agent class do?"
simplecoder --use-planning "create a web server with routes for home and about"
simplecoder --interactive
```

This deployment model keeps the agent lightweight. It behaves more like a controlled coding utility than a general-purpose assistant shell.

### Running the RL Pipeline

The second implementation depends on sandboxed execution, so its setup is slightly more infrastructural. After installing requirements, I start the Sandbox Fusion server and then run `train.py`.

```bash
python -m pip install -r requirements.txt
docker run -it -p 8080:8080 -v ./sandbox_config/local.yaml:/root/sandbox/sandbox/configs/local.yaml volcengine/sandbox-fusion:server-20250609
python train.py
```

The same training script supports two backends:

- `backend=tinker` for remote training
- `backend=local_gpu` for local LoRA fine-tuning

That split made the project easier to iterate on, since the same overall training logic could be tested under different compute conditions.

## Implementation

### Part I: SimpleCoder

#### ReAct-Style Agent Loop

At its core, SimpleCoder uses a ReAct-style interaction loop. The model reasons about the task, invokes tools, observes the results, and continues until it can return an answer or produce an output. This makes the system better suited to coding work than a pure one-shot completion model, because many coding tasks require inspection before generation.

#### Bounded Tooling

The tool registry exposes a small set of actions:

- `read_file`
- `write_file`
- `list_files`
- `search_in_files`

I liked this design because it keeps the tool surface narrow and predictable. Reads and searches can inspect the workspace, while writes are constrained to a designated output root. That separation makes the agent useful without letting file mutation become arbitrary.

#### Retrieval Over Code

The RAG layer builds a temporary vector index by chunking files into line-based segments, embedding those segments, and retrieving the most relevant ones at query time. Instead of flooding the model with entire files, the system can pass only the pieces most likely to matter.

For code-heavy work, that matters a lot. It reduces context waste and improves grounding in larger repositories.

#### Planning and Context Compaction

The planner provides a coarse sequence of steps before execution. It is not meant to replace reasoning inside the loop, but it gives the run a more structured trajectory.

The context manager solves a different problem: long coding sessions can overwhelm the prompt window. Once the message history grows beyond a threshold, older turns are summarized and folded into a compact state representation. That keeps the conversation coherent without letting prompt length grow indefinitely.

#### Permission-Aware Interaction

One of the more practical features is the permissions layer. Reads and writes are guarded, and the user can approve actions once or persist the decision across runs.

This is a small detail, but it changes the feel of the agent. It turns file access into an explicit contract instead of an invisible capability.

### Part II: Code RL Post-Training

#### Sandbox-Evaluated Code Generation

The training system treats code quality as something that must be tested, not merely judged by fluency. Candidate solutions are sampled and then executed inside a sandbox, where their behavior can be scored against task requirements.

That evaluation loop is what anchors the training signal to actual program behavior.

#### Rewards, Advantages, and Datums

The structure of the training loop is intentionally minimal and explicit. The main functions ask four questions:

- should this batch be skipped?
- what advantages should be computed from the observed rewards?
- how should a token trajectory be packaged into a training datum?
- how should the optimizer step be applied?

This decomposition keeps the RL logic readable. Rather than burying everything inside a single training script, the loop is expressed in stages: sampling, evaluation, reward attribution, and update.

#### Dual Training Backends

I implemented two training paths:

- a Tinker-based remote backend
- a local GPU backend with LoRA fine-tuning

This was useful both practically and conceptually. Practically, it meant I could run the same high-level experiment under different compute environments. Conceptually, it emphasized that the core contribution was not tied to one specific infrastructure choice. The important part was the reward-driven training loop around executable code.

#### Logging, Checkpoints, and Run Evidence

The system writes logs, metrics, checkpoints, and trend plots under timestamped run directories. That turns each run into a traceable artifact rather than a black-box training attempt.

I found this especially important for a project like this, because post-training claims are only convincing when the evidence remains inspectable after the run is over.

## Results and Takeaways

The clearest signal came from the Tinker training run over 100 steps. The best correctness metric improved from **0.4043** to **0.5195**, while reward improved from **0.3961** to **0.5164**. Loss also dropped dramatically, with the strongest checkpoint appearing at step **56**.

![Training Trend](/image/AdaptiveCodeAgents-trend.png)
**<center>Training dynamics across reward, correctness, and loss</center>**

What I find most compelling is not just that the metrics moved, but **why** they moved. The system was not being rewarded for sounding plausible. It was being rewarded for generating code that survived execution-based evaluation. That gives the improvement a more meaningful interpretation.

More broadly, the project convinced me that coding agents should be designed as layered decision systems.

- A good assistant needs an **intervention policy** so it knows when speaking is worth the cost.
- It also needs a **generation policy** that can actually produce code worth accepting.
- And once those outputs are testable, it needs a **feedback loop** that turns behavior into learning.

If any one of those layers is weak, the overall experience degrades. A cautious but mediocre assistant becomes timid. A strong generator with no intervention discipline becomes noisy. A polished interface without a learning loop quickly plateaus.

Given the limited training budget, modest data scale, and high-variance nature of code RL, I did not expect the run to converge cleanly. The fluctuations in reward and correctness are noticeable, and the overall result is better understood as evidence that the pipeline is wired correctly and capable of improvement, rather than as a fully stabilized training outcome.

## Closing Thoughts

What stayed with me after this project was how much of coding assistance is really about control, not just generation.

The modeling side forced me to think carefully about interruption, uncertainty, and user effort. The implementation side forced me to think about bounded action, retrieval, execution, and feedback. Put together, those pieces suggest a view of code agents that is more structured than autocomplete and more honest than raw demo metrics.

For me, that is the real value of this project. It is not just a coding assistant and not just a training pipeline. It is an attempt to connect theory, interface behavior, and post-training into one coherent system for adaptive help.
