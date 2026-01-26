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

## TDD (Test-Driven Development) Guidelines

### Core Principle
For ALL feature requests and bugfixes, always follow TDD:
1. **Write tests first** that match the intended logic
2. **Verify tests fail** on current non-compliant logic
3. **Write or revise logic** to make tests pass
4. **Refactor** if needed while keeping tests green

### Bugfix Workflow
For bugfixes:
- **No sub agents needed** - proceed directly with TDD
- Write a test that reproduces the bug (test should fail)
- Fix the bug to make the test pass
- This prevents regressions of the same bug in the future
- Run all tests and build before committing

### Large Task / Epic Feature Request Workflow

When receiving a large task or epic-level feature request:

1. **Break down into subtasks** and categorize each as:
   - **TDD-automatable**: Can be built by a sub agent following TDD
   - **Manual testing required**: Needs human verification (UI/UX, integrations, etc.)

2. **Create a plan with prompts per agent** including:
   - Task description and acceptance criteria
   - Specific test cases to write
   - Files likely to be modified
   - Dependencies on other subtasks

3. **Git worktree and branch setup per agent**:
   - Each agent gets their own git worktree
   - Each agent gets their own feature branch
   - **Naming convention**: `claude/feat-<#>-<description>`
   - **Always branch off from `develop`**

4. **Do not implement yet** - present the plan for approval first

### Agent Task Template

For each subtask, provide:

```
## Task: feat-<#>-<description>

### Branch
- Worktree: `worktrees/feat-<#>-<description>`
- Branch: `claude/feat-<#>-<description>`
- Base: `develop`

### Description
[What needs to be built]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Test Cases to Write
1. Test case 1
2. Test case 2

### Files to Modify
- `path/to/file1.ts`
- `path/to/file2.ts`

### Dependencies
- Depends on: [none | feat-<#>]
- Blocks: [none | feat-<#>]

### Testing Type
- [ ] TDD (automated)
- [ ] Manual testing required

### Agent Prompt
[Full prompt to give to the sub agent]
```

---

## Post-Completion Merge Process

After all agents complete their tasks, merge branches in order to minimize conflicts.

### Merge Branch
Create a new branch: `claude/merge-branches-<task-numbers>`
- Example: `claude/merge-branches-1-2-3-4`

### Merge Steps (Per Agent)

For each branch to merge, the agent must:

1. **Merge the target branch**
   ```bash
   git checkout claude/merge-branches-<task-numbers>
   git merge claude/feat-<#>-<description>
   ```

2. **Resolve conflicts automatically**
   - Use best judgment to resolve conflicts
   - Preserve intended functionality from both branches

3. **Run all tests and build**
   ```bash
   npm test
   npm run build
   ```
   - Ensure everything passes before proceeding

4. **Handle test failures**
   - **Adjust logic to fit the test, NOT the other way around**
   - If you believe a test needs adjustment:
     - STOP and ask for approval
     - Explain how the test works
     - Explain why you want to change it
   - Only proceed after approval

5. **Create PR back to develop**
   - Include summary of all merged features
   - List any conflict resolutions made
   - Confirm all tests pass

### Merge Order Principles
- Merge branches with fewer dependencies first
- Merge foundational/shared code before feature-specific code
- Group related features to minimize conflicts

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
