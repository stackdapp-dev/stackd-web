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
- Always run all tests and build locally and successfuly before pushing commits to remote
- Run tasks in parallel by spinning off sub agents when possible

## Forbidden Actions
- Do not modify production configs
- Do not change database schemas without approval