# CLAUDE.md - Project Rules

in any feature request or bugfix i ask for, always follow TDD. write tests that match the intended logic, make sure the tests fail on current logic that is non compliant, then write or revise the current logic to match the test. 

for bugfixes, there is no need for sub agents. just proceed by following TDD and avoid regressions of the same bug in the future. 

if it is a large task or epic level feature request, break down the task into subtasks and mark which of these sub tasks needs manual testing vs what can be built following TDD by a sub agent or agents in parallel

layout and breakdown the plan including prompts per agent so that i can assign each task to an agent or sub agent (each one using Claude Opus 4.5) so that they can all work in parallel where possible. each should have their own git worktree and feature branch. don't implement anything yet, just add this to the plan. follow the naming convention, such that the worktree and branch are named "claude/feat-<#>-<description>" (follow this naming convention for all tasks). always branch off from the develop branch.


finally add a post completion merge order to minimize conflicts. create a new branch from develop called "claude/merge-branches-<task-numbers>" for these merge steps. ensure that each agent has instructions where for each merge step, the agent;
1. merges the target branch
2. resolves conflicts automatically
3. runs all tests and runs build to ensure everything is working correctly before proceeding to merge the next branch
4. if there are test failures after merging in any of the steps above, make sure to adjust logic to fit the test and not the other way around. if you're not sure or if you find that you need to adjust the test, ask me for approval and explain how the test works and why you want to change it. always create a PR back to develop. 

when running local dev, always run it on port 3000. if there is an existing process on 3000, kill it, then run local dev on 3000. 

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
- Always run all tests and build locally and successfuly before pushing commits to remote
- Run tasks in parallel by spinning off sub agents when possible

## Forbidden Actions
- Do not modify production configs
- Do not change database schemas without approval