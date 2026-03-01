# CLAUDE.md - Project Rules

## Approval Levels

### Auto-executable (Level 1)
- Style adjustments
- Adding comments
- Minor bug fixes

### Requires approval (Level 3)
- Multiple file changes
- Architectural changes
- Dependency changes

## Workflow Rules
- Always run tests before committing
- Use TDD methodology
- Think hard before complex changes
- Always run all tests and build locally and successfully before pushing commits to remote
- Run tasks in parallel by spinning off sub agents when possible

## Forbidden Actions
- Do not modify production configs
- Do not change database schemas without approval

---

## Local Development

### Port Configuration
- **Always run local dev on port 3000**
- If port 3000 is in use, kill the existing process first:
  ```bash
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  npm run dev
  ```
- Never run on alternative ports without explicit approval

---

# Orchestrated Agent Team Pattern

## Overview

This section defines a reusable pattern for coordinating multi-agent software development using Claude Code. An **orchestrator agent** manages the entire workflow, delegating work to **parallel agents** that follow Test-Driven Development (TDD). Parallel agents may further delegate isolated, trivial subtasks to **sub-agents**. Every level of the hierarchy enforces shared contracts, worktree isolation, and TDD discipline to produce criteria-adherent code.

---

## 1. Hierarchy & Responsibilities

```
ORCHESTRATOR (Opus 4.6 extended thinking)
│  Owns: planning, contracts, PR review, merge gating, context forwarding
│
├── Parallel Agent A (Sonnet 4.6 or Opus 4.6 — see Model Selection, own worktree + feature branch)
│   │  Owns: TDD cycle, PR to develop, sub-agent coordination
│   ├── Sub-Agent A1 (Haiku 4.5, commits to Agent A's branch)
│   └── Sub-Agent A2 (Haiku 4.5, commits to Agent A's branch)
│
├── Parallel Agent B (Sonnet 4.6 or Opus 4.6 — see Model Selection, own worktree + feature branch)
│   └── Sub-Agent B1 (Haiku 4.5, commits to Agent B's branch)
│
└── Parallel Agent C (Sonnet 4.6, own worktree + feature branch)
    └── (no sub-agents — task is small enough)
```

### 1.1 Orchestrator Agent (Opus 4.6 Extended Thinking)

The orchestrator is the main Claude Code session. It never writes feature code directly (except Phase 0 shared contracts). It:

1. **Plans the scope of work** — produces the Orchestration & Parallelization Matrix (see Section 6)
2. **Defines shared contracts** (Phase 0) — interfaces, types, protocols that all agents import
3. **Creates branches and worktrees** for each parallel agent before launching them
4. **Reviews PRs** from parallel agents — runs full test suite, inspects code quality, verifies requirements adherence
5. **Gates between phases** — only proceeds to the next phase after all current-phase PRs are merged and green
6. **Feeds context forward** — provides actual merged code (not specs) to downstream agents
7. **Cleans up** — removes worktrees after merging each phase

### 1.2 Parallel Agents (Sonnet 4.6 or Opus 4.6 — see Model Selection)

Each parallel agent works in its own git worktree on its own feature branch. It:

1. **Follows TDD strictly** — investigate → write failing tests → minimal logic to pass → run all tests
2. **Creates a PR to develop** when complete (does NOT merge — orchestrator merges)
3. **May spawn sub-agents** for isolated, parallelizable subtasks (see Section 4 for criteria)
4. **Owns sub-agent coordination** — handles merge conflicts from sub-agents, runs full test suite before PR
5. **Commits are atomic and well-described** — each commit should represent a logical unit of work

### 1.3 Sub-Agents (Haiku 4.5 Extended Thinking)

Sub-agents are optional. They handle trivial, isolated subtasks delegated by a parallel agent. They:

1. **Commit to the parent agent's branch in the parent agent's worktree** — they do NOT get their own branch or worktree
2. **Follow TDD** — even trivial tasks get a failing test first
3. **Never interact with other sub-agents** — if coordination is needed, it's not a sub-agent task
4. **Return control to the parent agent** — the parent reviews, resolves conflicts, and runs the full suite

---

## 2. When to Use Each Pattern

### Use a Solo Agent (no team) when:
- The task is self-contained (single module, no cross-module interfaces)
- No other agent's output will affect this agent's implementation
- The task is pure research, exploration, or a single-file change
- Bug fixes (follow TDD directly, no sub-agents needed)

### Use an Agent Team when:
- 3+ modules will produce code that must interoperate
- Tasks define types/interfaces consumed by other tasks
- There's a dependency graph (A's output feeds B's input)
- Integration risk is high (merge conflicts, type mismatches, interface drift)

### Spawn Sub-Agents only when ALL of these are true:
- The subtask is **parallelizable** — no dependency on other concurrent work
- The subtask is **isolated** — touches a single module or file set with no cross-cutting concerns
- The subtask is **small** — can be completed in one focused pass (logic libraries, utility functions, minor fixes)
- The subtask requires **no complex investigation** — the problem and solution are well-understood
- The **token savings justify the overhead** — spawning a sub-agent has coordination cost; if the task takes fewer tokens to do inline, do it inline

---

## 3. Test-Driven Development Protocol (Mandatory at Every Level)

Every agent and sub-agent follows the same TDD cycle. No code is written without a failing test first.

### TDD Cycle

```
1. INVESTIGATE  → Understand the problem, read existing code, identify affected areas
2. WRITE TESTS  → Write tests that describe the expected fixed/new behavior
3. VERIFY FAIL  → Run the tests — they MUST fail (proves the behavior doesn't exist yet)
4. IMPLEMENT    → Write the minimal code to make the failing tests pass
5. VERIFY PASS  → Run the new tests — they MUST pass
6. REGRESSION   → Run the FULL test suite — nothing else should break
7. COMMIT       → Atomic commit with descriptive message
```

### Test Hierarchy

| Test Type | Scope | When to Write |
|-----------|-------|---------------|
| **Unit tests** | Single function/class, mocked dependencies | Always — every agent writes these |
| **Integration tests** | Module interactions, API endpoints, DB queries | When the task involves cross-module behavior |
| **E2E tests** | Full user-facing workflow | When the task changes user-visible behavior |

### TDD Rules

- **Tests encode intended behavior.** If tests fail after a merge, fix the implementation to match the tests. Only change tests with explicit user approval — explain what the test verifies and why it should change.
- **Failing tests are a feature.** A test that passes before you write code means it's not testing the new behavior.
- **Minimal implementation.** Don't gold-plate. Write the least code needed to make tests green.
- **No skipping the regression run.** Every commit must have a passing full suite. Broken windows compound.

### Bugfix Workflow
For bugfixes:
- **No sub agents needed** — proceed directly with TDD
- Checkout from develop, create a bugfix branch and worktree
- Write a test that reproduces the bug (test should fail)
- Fix the bug to make the test pass
- Pull develop into bugfix branch, resolve conflicts
- Run entire test suite
- Create PR to develop

---

## 4. Git Branching & Worktree Strategy

### Branch Naming Convention

```
claude/feat-<phase#><agent-letter>-<description>    # features
claude/fix-<description>                             # bug fixes
```

Examples: `claude/feat-1a-auth-service`, `claude/feat-2b-api-routes`, `claude/fix-login-race`

### Worktree Isolation (REQUIRED for parallel agents)

Parallel agents share the host filesystem. If one agent checks out a branch, it moves the working tree for all others. **Every parallel agent MUST work in its own git worktree.**

**Orchestrator creates branches AND worktrees before launching agents:**

```bash
# From the main repo directory:
git branch claude/feat-1a-description develop
git branch claude/feat-1b-description develop

git worktree add ../<repo-name>-feat-1a claude/feat-1a-description
git worktree add ../<repo-name>-feat-1b claude/feat-1b-description
```

**Worktree naming convention:**
```
../<repo-name>-feat-<phase><letter>
```
Worktrees live as **siblings of the main repo directory** (one level up), not inside the repo.

**Each agent's prompt MUST include the worktree absolute path.** The agent works exclusively in that directory — all file reads, writes, test runs, and git commits happen there.

**Sub-agents do NOT get their own worktrees.** They commit directly to the parent agent's branch in the parent agent's worktree. The parent agent coordinates sequential access if needed.

**Worktree cleanup (orchestrator does this AFTER merging each phase):**
```bash
git worktree remove ../<repo-name>-feat-1a
git worktree remove ../<repo-name>-feat-1b
```

### PR & Merge Protocol

Each parallel agent's workflow ends with a PR to `develop`:

```
1. Agent completes TDD cycle for all subtasks
2. Agent resolves any sub-agent merge conflicts on its branch
3. Agent pulls latest develop into its branch, resolves conflicts
4. Agent runs the FULL test suite — must pass
5. Agent creates PR to develop (using gh pr create)
6. Orchestrator reviews the PR:
   a. Runs full test suite independently
   b. Reviews code quality and requirements adherence
   c. If issues found → sends agent back with specific feedback
   d. If clean → merges PR to develop
7. Orchestrator removes the agent's worktree
```

**Merge order:** Orchestrator merges PRs in order of least → most conflict-prone. After each merge, the full test suite runs. If tests fail, fix the implementation (not the tests).

---

## 5. Model Strategy & Token Efficiency

### Intelligent Model Selection

Choose the model based on task characteristics, not just hierarchy position. The right model depends on what the task demands.

| Role | Default Model | Upgrade/Downgrade Criteria |
|------|---------------|---------------------------|
| **Orchestrator** | **Opus 4.6** (always) | Never downgrade — orchestration requires the strongest reasoning |
| **Parallel agents** | **Sonnet 4.6** (default) | Upgrade to **Opus 4.6** when criteria below are met |
| **Sub-agents** | **Haiku 4.5** (default) | Upgrade to **Sonnet 4.6** for moderate complexity (see below) |

### When to Upgrade a Parallel Agent to Opus 4.6

Use Opus 4.6 for a parallel agent when **2+ of these apply**:

- **Significant investigation required** — the task involves debugging, root cause analysis, or exploring unfamiliar code paths before implementation can begin
- **Cross-cutting concerns** — the task touches multiple modules, requires understanding system-wide implications, or involves architectural decisions within its scope
- **Complex state management** — the task involves intricate state machines, race conditions, concurrency, or distributed system coordination
- **Ambiguous requirements** — the acceptance criteria leave room for interpretation, requiring judgment calls about the right approach
- **High integration risk** — the task's output will be consumed by many other modules, so getting the interface right is critical

Use Sonnet 4.6 (the default) when the task is:
- Well-scoped with clear contracts and acceptance criteria
- Standard feature implementation following established patterns
- CRUD operations, API endpoints, UI components with clear specs
- Tasks where the "what" is clear even if the "how" requires effort

### When to Upgrade a Sub-Agent to Sonnet 4.6

Use Sonnet 4.6 instead of Haiku 4.5 for a sub-agent when:
- The subtask requires reading and understanding moderate amounts of existing code
- The subtask involves non-trivial logic (not just boilerplate/mechanical)
- The subtask needs to make judgment calls about edge cases

Keep Haiku 4.5 (the default) for sub-agents when:
- The task is purely mechanical (add fields, write simple validators, create boilerplate)
- The instructions are completely unambiguous
- No existing code needs to be understood beyond a few lines

### Token Efficiency Rules

1. **Don't spawn agents for work you can do faster inline.** If a task takes 500 tokens to describe to a sub-agent and 300 tokens to just do, do it yourself.
2. **Sub-agents are not free.** Each spawn has prompt overhead (context, instructions, contracts). Only spawn when the parallelism or isolation benefit outweighs this cost.
3. **Prefer fewer, larger agents over many small ones.** 3 well-scoped parallel agents beat 8 micro-agents. Each agent needs full context loading.
4. **Feed actual code, not prose descriptions.** Reading a 200-line file into a prompt is cheaper than the agent guessing wrong and needing a retry.
5. **Orchestrator should batch reviews.** Review multiple agent outputs in sequence rather than spawning review sub-agents.
6. **Kill agents that are stuck.** If an agent is spinning (repeated failures, wrong approach), terminate it, adjust the prompt, and relaunch. Don't let it burn tokens.
7. **Model cost awareness.** Opus 4.6 costs ~5x Sonnet 4.6, and Sonnet 4.6 costs ~5x Haiku 4.5. Only upgrade when the task complexity genuinely demands it — a well-prompted Sonnet 4.6 handles most implementation work.

### Task Tool Configuration

```python
# Parallel agent (default — well-scoped task)
Task(
    description="Build auth service",
    prompt="...",
    subagent_type="general-purpose",
    model="sonnet"  # Sonnet 4.6
)

# Parallel agent (upgraded — complex/ambiguous task)
Task(
    description="Design event sourcing pipeline",
    prompt="...",
    subagent_type="general-purpose",
    model="opus"  # Opus 4.6 — significant investigation + cross-cutting
)

# Sub-agent (default — trivial/mechanical task)
Task(
    description="Add input validators",
    prompt="...",
    subagent_type="general-purpose",
    model="haiku"  # Haiku 4.5
)

# Sub-agent (upgraded — moderate complexity)
Task(
    description="Implement retry logic with backoff",
    prompt="...",
    subagent_type="general-purpose",
    model="sonnet"  # Sonnet 4.6 — non-trivial logic, edge cases
)
```

---

## 6. Orchestration & Parallelization Matrix

Every scope of work MUST begin with a matrix that maps the full task breakdown. This matrix identifies what runs in parallel vs sequentially, and at which level of the hierarchy.

### Matrix Template

```
SCOPE: [Feature/Epic Name]

PHASE 0 — Shared Contracts (Orchestrator, sequential)
├── [ ] Define interfaces and shared types
├── [ ] Commit to develop
└── Estimated tokens: [low/medium]

PHASE 1 — Independent Work (Parallel Agents)
┌─────────────────────────────────────────────────────────────────┐
│ Agent A: [Task Name]          │ Agent B: [Task Name]            │
│ Branch: claude/feat-1a-xxx    │ Branch: claude/feat-1b-xxx      │
│ Model: Sonnet 4.6             │ Model: Opus 4.6                 │
│ Rationale: clear specs, CRUD  │ Rationale: ambiguous reqs,      │
│                               │   cross-cutting concerns        │
│ Deps: Phase 0 contracts       │ Deps: Phase 0 contracts         │
│ Sub-agents:                   │ Sub-agents:                     │
│   └── A1: [subtask] (Haiku)   │   └── (none)                   │
│   └── A2: [subtask] (Haiku)   │                                 │
│ Est. tokens: [medium]         │ Est. tokens: [low]              │
│ Manual testing needed: [Y/N]  │ Manual testing needed: [Y/N]    │
└─────────────────────────────────────────────────────────────────┘
GATE: Orchestrator reviews PRs, merges to develop, runs full suite

PHASE 2 — Dependent Work (Parallel where possible)
┌─────────────────────────────────────────────────────────────────┐
│ Agent C: [Task Name]          │ Agent D: [Task Name]            │
│ Depends on: Agent A's output  │ Depends on: Agent B's output    │
│ Model: Sonnet 4.6             │ Model: Sonnet 4.6               │
│ Context: [merged files from A]│ Context: [merged files from B]  │
└─────────────────────────────────────────────────────────────────┘
GATE: Orchestrator reviews PRs, merges to develop, runs full suite

PHASE 3 — Integration (Sequential, Orchestrator or single agent)
├── [ ] Wire modules together
├── [ ] Full E2E test suite
├── [ ] Manual testing checklist: [items requiring human verification]
└── GATE: All tests green, user approval for merge to main
```

### Matrix Rules

- **Every task appears exactly once** in the matrix
- **Dependencies are explicit** — "Depends on: Agent A's output" not "depends on auth"
- **Manual testing is flagged** — tasks requiring human verification are marked, not buried
- **Token estimates drive decisions** — if a sub-agent task estimates higher token cost than inline, don't spawn it
- **Model choice is justified** — each agent's model assignment includes a brief rationale
- **The matrix is a living document** — update it as work progresses and reality diverges from plan

---

## 7. Shared Contracts (Phase 0)

Before any agent starts, the orchestrator defines the interfaces that all agents code against. This eliminates type drift, merge conflicts on shared types, and interface mismatches.

### What Goes in Contracts

Define shared enums, data models, and module interfaces/protocols in a single location that all agents import from. For this TypeScript/React project, this means exported `interface` and `type` definitions.

```typescript
// Example: TypeScript
// src/contracts/index.ts (or contracts/ directory for larger scopes)

// --- Shared Enums ---
export enum Status { ... }

// --- Shared Data Models ---
export interface SomeInput { ... }
export interface SomeOutput { ... }

// --- Module Interfaces (what each module must expose) ---
export interface ServiceA {
  doThing(input: SomeInput): Promise<SomeOutput>;
}

export interface ServiceB {
  doOtherThing(id: string): Promise<SomeOutput | null>;
}
```

### Contract Rules

- Contracts are committed to `develop` before any agent branch is created
- All agents import from contracts — they do NOT define their own versions of shared types
- If an agent needs a type not in contracts, define it locally and flag it: `// TODO: promote to shared contracts if other modules need this`
- Contract changes require orchestrator approval and a rebase of all active agent branches

---

## 8. Agent Prompt Templates

### Parallel Agent Prompt

```
You are building [MODULE_NAME] for [PROJECT_NAME].

## Working Directory
Your working directory is: `<WORKTREE_ABSOLUTE_PATH>`
ALL file operations (reads, writes, edits) and ALL commands (tests, git) MUST use this directory.
Do NOT cd to or operate on the main repo directory.

## Git Branch
You are working on branch: `claude/feat-[PHASE][LETTER]-[description]`
This branch is already checked out in your worktree. Commit your work to this branch.

## Shared Contracts
You MUST import and implement against these shared interfaces:
[paste the actual contracts code or reference the file path in the worktree]

## Dependencies Available
The following modules are already implemented and merged. You may import from them:
[paste relevant code or file paths from already-completed agents]

## Your Task
[specific task description with acceptance criteria]

## TDD Protocol (MANDATORY)
Follow this cycle for every piece of functionality:
1. Investigate the problem — read existing code, understand the current state
2. Write tests that describe the expected behavior — unit tests at minimum,
   integration/E2E if the task involves cross-module behavior
3. Run the tests — they MUST fail (if they pass, your tests aren't testing new behavior)
4. Write minimal code to make the tests pass
5. Run the full test suite — nothing else should break
6. Commit with a descriptive message

## Sub-Agent Policy
You MAY spawn sub-agents ONLY when ALL of these are true:
- The subtask is parallelizable (no dependency on other concurrent work)
- The subtask is isolated (single module/file, no cross-cutting concerns)
- The subtask is small (completable in one focused pass)
- The subtask requires no complex investigation
- The token savings justify the coordination overhead

Default sub-agent model: haiku. Upgrade to sonnet if the subtask involves
non-trivial logic, edge case handling, or understanding moderate existing code.

Sub-agents commit to YOUR branch in YOUR worktree. You handle their merge conflicts
and run the full test suite before creating your PR.

## Interface Compliance
- Your public API MUST match the interface defined in the shared contracts
- Use the shared data models for all cross-module data
- Do NOT define your own versions of shared types

## Completion Checklist
Before creating your PR:
- [ ] All new code has tests (written BEFORE implementation)
- [ ] All tests pass (unit + integration + E2E as applicable)
- [ ] Full test suite passes (not just your tests)
- [ ] Latest develop is pulled into your branch
- [ ] No merge conflicts remain
- [ ] Code follows project conventions
- [ ] Create PR to develop using: gh pr create --base develop
```

### Sub-Agent Prompt

```
You are completing a subtask for [PARENT_MODULE_NAME] in [PROJECT_NAME].

## Working Directory
Your working directory is: `<PARENT_WORKTREE_ABSOLUTE_PATH>`
ALL file operations MUST use this directory. You are committing to the parent agent's branch.

## Your Subtask
[specific, narrow task description]

## TDD Protocol (MANDATORY even for trivial tasks)
1. Write a failing test for the expected behavior
2. Write minimal code to make it pass
3. Run the tests relevant to your change
4. Commit with message: "sub-agent: [description of change]"

## Constraints
- Do NOT modify files outside your subtask scope
- Do NOT create new shared types — use what exists in contracts
- Do NOT interact with other sub-agents
- Keep your changes minimal and focused
```

---

## 9. Task-Specific Modes

### MODE: Feature Requests

**When the user asks for a new feature or capability:**

1. **Validate the Why**
   - Is this solving a real problem or feature creep?
   - What's the opportunity cost vs other priorities?
   - Does it fit the project's architecture and direction?

2. **Planning Phase**
   - Produce the Orchestration & Parallelization Matrix (Section 6)
   - Identify shared contracts needed (Section 7)
   - Flag tasks requiring manual testing
   - Write test cases FIRST (what success looks like)
   - API contract/interface design
   - Edge cases and failure modes
   - Dependencies and breaking changes

3. **Implementation**
   - All agents follow TDD Protocol (Section 3)
   - Minimal viable version first
   - Migration path if changing existing behavior

4. **Delivery Format**
   - Priority assessment (high/medium/low with reasoning)
   - Orchestration matrix with token estimates and model rationale
   - Risk analysis (what could go wrong)
   - Code with tests, not just pseudocode

**Red flags to call out:**
- Feature doesn't have clear success metric
- Adds complexity without proportional value
- Conflicts with existing architecture

### MODE: Bug Fixes

**When the user reports a bug or broken behavior:**

1. **Confirm the Bug**
   - Reproduce the issue from the description
   - Distinguish: actual bug vs expected behavior user doesn't like
   - Assess severity: critical (blocks work), major (workaround exists), minor (cosmetic)

2. **Root Cause Analysis**
   - Don't just fix symptoms
   - Show *why* it broke (what assumption failed)
   - Check if other areas have the same vulnerability

3. **Fix Approach (TDD — no sub-agents for bug fixes)**
   - Checkout from develop, create a bugfix branch and worktree
   - Write failing test that captures the bug
   - Minimal change to make test pass
   - Verify no regressions
   - Pull develop into bugfix branch, resolve conflicts
   - Run entire test suite
   - Create PR to develop

4. **Delivery Format**
   - Severity classification with reasoning
   - Root cause explanation (1-2 sentences)
   - Fix with before/after test results
   - Prevention: how to avoid this class of bug going forward

**Red flags to call out:**
- If the "bug" is actually a feature request in disguise
- If fixing properly requires architectural changes (then it's a refactor, not a patch)
- If the fix is papering over a deeper design flaw

### MODE: Research Tasks

**When the user asks for analysis, strategy, or exploration:**

1. **Clarify the Decision**
   - What is the user actually trying to decide?
   - What's the time horizon?

2. **Research Approach**
   - Primary sources over summaries
   - Quantitative data over anecdotes
   - Recent data for evolving domains

3. **Delivery Format**
   - Executive summary (2-3 sentences)
   - Key findings (3-5 bullets, no fluff)
   - Recommended action with specific next steps
   - What is unknown (gaps in available data)

### MODE: Miscellaneous

1. **Classify First** — Is this actually a feature/bug/research in disguise?
2. **Bias toward action** — deliver usable output, not theoretical frameworks
3. **Clear next action** — what should the user do with this output?

---

## 10. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do This Instead |
|---|---|---|
| **No shared contracts** | Agents independently define overlapping types → merge hell | Phase 0: define contracts before any agent starts |
| **Big bang merge** | All agents merge at end → conflicts compound, context is stale | Merge and test after EACH agent |
| **No orchestrator review** | Agent output goes straight to dependent agents without verification | Orchestrator reviews every PR before merge |
| **Copy-paste context** | Describing interfaces in prose → agents guess wrong | Feed actual merged code as context |
| **Parallel everything** | Running dependent agents in parallel with stubs → integration failures | Wait for real implementations, then feed forward |
| **Always using Opus for agents** | Burns quota ~5x faster for tasks Sonnet 4.6 handles equally well | Default to Sonnet 4.6, upgrade to Opus only when complexity warrants it |
| **Always using Haiku for sub-agents** | Haiku fails on non-trivial logic, causing retries that waste more tokens | Upgrade sub-agents to Sonnet 4.6 when the subtask has real logic |
| **Parallel agents in same directory** | One checkout moves the working tree for all others | Git worktrees: one per parallel agent |
| **Sub-agents on their own branches** | Coordination overhead exceeds benefit | Sub-agents commit to parent agent's branch |
| **Changing tests to fix merge failures** | Tests encode intended behavior — changing them hides bugs | Fix implementation to match tests; only change tests with user approval |
| **Spawning sub-agents for complex tasks** | Haiku can't handle investigation or cross-cutting concerns | Keep complex work in the parallel agent (Sonnet 4.6 or Opus 4.6) |
| **No parallelization matrix** | Ad-hoc agent spawning leads to dependency violations and wasted tokens | Always produce the matrix before launching agents |

---

## 11. Checklist: Before Launching Any Agent Team

- [ ] Scope of work is defined with acceptance criteria
- [ ] Orchestration & Parallelization Matrix is complete (Section 6)
- [ ] Shared contracts are written and committed to develop (Section 7)
- [ ] Model assignments are justified for each agent (default Sonnet 4.6, upgrades documented)
- [ ] Branches are created for all Phase 1 agents
- [ ] Worktrees are created and verified (`git -C <path> branch --show-current`)
- [ ] Each agent's prompt includes: worktree path, branch name, contracts, task, TDD protocol
- [ ] Token budget is estimated and model assignments are set
- [ ] Manual testing tasks are identified and flagged in the matrix
- [ ] Merge order is planned (least → most conflict-prone)
