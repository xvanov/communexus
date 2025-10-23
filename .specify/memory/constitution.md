# Cross-Platform Mobile Development Constitution

<!--
SYNC IMPACT REPORT - Constitution Amendment

Version Change: 1.0.0 → 1.1.0
Amendment Date: 2025-10-23
Ratification Date: 2025-10-23

MODIFIED PRINCIPLES:
- None

ADDED PRINCIPLES:
- VIII. CI/CD Discipline - New principle requiring local pipeline validation before commits

REMOVED PRINCIPLES:
- None

TEMPLATE UPDATES REQUIRED:
- ✅ plan-template.md - Constitution Check section aligns with CI/CD requirements
- ✅ spec-template.md - No changes needed (scope-level, CI/CD is implementation detail)
- ✅ tasks-template.md - Already includes validation tasks in Polish phase
- ✅ CI-CD-Pipeline.md - Already documents pre-commit checks (lines 82-97)

FOLLOW-UP ITEMS:
- None - all placeholders resolved

BUMP RATIONALE:
MINOR version bump (1.0.0 → 1.1.0) because this adds a new principle section
with new governance requirements without breaking existing principles.
-->

**Version**: 1.1.0  
**Ratified**: 2025-10-23  
**Last Amended**: 2025-10-23

## Core Principles

### I. Memory Bank Management

Every developer MUST read the memory bank (/memory-bank at repo root) before starting any work and MUST update it upon completion. The memory bank contains critical project context, decisions, patterns, and learnings that ensure continuity and prevent knowledge loss. No work begins without understanding the current project state, and no work is complete without documenting changes and insights.

- **Pre-Work Reading**: MUST read all memory bank files before starting any development task
- **Post-Work Updates**: MUST update relevant memory bank files after completing work
- **Context Preservation**: All significant decisions, patterns, and learnings MUST be documented
- **Knowledge Continuity**: Memory bank serves as the single source of truth for project evolution

### II. Test-Driven Development

Every feature MUST be developed using Test-Driven Development (TDD). Tests MUST be written BEFORE implementation code and MUST be quick to implement and simple to understand. Focus on critical tests that provide valuable feedback - tests that catch real user-impacting issues like authentication failures, API errors, or broken user flows. Avoid over-testing trivial operations like mathematical calculations. Tests serve as living documentation and specification.

### III. Critical Test Focus

- **End-to-End UI Tests**: High-level user journeys MUST be tested using simulators/emulators - these are the MOST critical tests
- **Authentication & API Tests**: Login failures, Firebase errors, and API integration failures MUST be tested
- **Cross-Platform Tests**: Critical features MUST be verified on iOS, Android, and Web platforms
- **Performance Tests**: Core performance metrics MUST be continuously monitored
- **Backend Critical Tests**: Non-visible critical code (data processing, business logic) MUST be tested
- **KISS Testing**: Keep tests simple and focused - avoid complex test setups and over-engineering

### IV. Simple Implementation Philosophy

- **KISS Principle**: Keep implementations as simple as possible while meeting requirements
- **Avoid Over-Engineering**: Resist the urge to add complexity "just in case"
- **Clear Code**: Code should be self-documenting and easy to understand
- **Minimal Dependencies**: Only add dependencies when absolutely necessary
- **Progressive Enhancement**: Start simple, add complexity only when needed

### V. Atomic Development Workflow

- **Small PRs**: Each PR MUST address a single, atomic change
- **Parallel Development**: Work MUST be structured to enable parallel development streams
- **Independent Features**: Features MUST be developed independently to avoid merge conflicts
- **Incremental Delivery**: Deliver value in small, frequent increments
- **Rollback Safety**: Each change MUST be easily reversible

### VI. Resource Constraints Reality

- **Finite Time & Compute**: All development operates under finite time and compute constraints
- **Fast Test Feedback**: Tests MUST provide feedback in seconds, not minutes - unit tests under 10 seconds, integration tests under 30 seconds
- **Pivot on Test Failures**: If a test fails repeatedly due to setup issues after 5+ development cycles, MUST pivot to different implementation/infrastructure
- **Test Framework Flexibility**: If tests are consistently flaky or complex, MUST switch to simpler testing approach/framework
- **Resource Efficiency**: Choose testing tools and approaches that maximize feedback speed per development hour invested

### VII. Cross-Platform Consistency

- **Unified UX**: User experience MUST be consistent across all platforms
- **Platform-Specific Optimization**: Leverage platform strengths while maintaining consistency
- **Responsive Design**: UI MUST adapt gracefully to different screen sizes and orientations
- **Accessibility**: All features MUST meet accessibility standards on all platforms

### VIII. CI/CD Discipline

Every project MUST have CI/CD pipelines configured from the start. Before ANY code is committed to version control, developers MUST run all CI/CD pipeline steps locally and ensure they pass. Only after local validation succeeds should code be committed and pushed to trigger remote CI/CD pipelines. This principle prevents broken commits, reduces CI/CD failures, and maintains a clean main branch.

- **Pipeline Setup Required**: CI/CD pipelines (linting, formatting, type checking, tests, builds) MUST be configured at project initialization
- **Local Validation First**: ALL CI/CD checks MUST pass locally before committing code
- **Pre-Commit Workflow**: The required workflow is: run local checks → verify all pass → commit → push → remote CI/CD validation
- **No Broken Commits**: Code that fails any CI/CD check MUST NOT be committed to version control
- **Fast Local Feedback**: Local CI/CD validation MUST complete in reasonable time (< 1 minutes for quick checks, < 2 minutes for full suite)
- **CI/CD Documentation**: Project MUST document all CI/CD steps and how to run them locally (see docs/CI-CD-Pipeline.md)

**Rationale**: Running CI/CD checks locally before committing prevents wasted time on remote pipeline failures, keeps the commit history clean, enables faster feedback loops, and ensures the team can work efficiently without breaking the build for others. This is especially critical in team environments where broken commits block other developers.

## Technical Standards

### Code Quality Requirements

- **TypeScript Strict Mode**: All code MUST use TypeScript with strict type checking
- **ESLint Compliance**: Zero ESLint errors, warnings should be minimized
- **Prettier Formatting**: All code MUST be consistently formatted
- **Code Reviews**: All changes MUST be reviewed by at least one other developer
- **Documentation**: Public APIs and complex logic MUST be documented

### Testing Standards

- **Critical Test Coverage**: Focus on testing critical paths that impact user experience
- **Test Performance**: Unit tests MUST complete in under 10 seconds, integration tests under 30 seconds, E2E tests under 2 minutes
- **Test Reliability**: Tests MUST be deterministic and not flaky - if flaky, pivot to simpler approach
- **Test Simplicity**: Tests MUST be easy to write, understand, and maintain
- **Test Value**: Each test MUST provide meaningful feedback - avoid testing implementation details
- **Test Data**: Use consistent, minimal test data sets that represent real scenarios
- **Constraint Compliance**: All testing approaches MUST respect finite time and compute resources

### Performance Requirements

- **App Launch**: Initial load MUST complete within 3 seconds
- **UI Responsiveness**: All interactions MUST respond within 100ms
- **Memory Usage**: App MUST not exceed platform memory limits
- **Battery Efficiency**: Background processes MUST be optimized for battery life
- **Network Efficiency**: Minimize data usage and optimize for poor connections

### Cross-Platform Standards

- **React Native**: Use React Native for shared mobile codebase
- **Web Compatibility**: Ensure web version works on modern browsers
- **Platform APIs**: Use platform-specific APIs when necessary for optimal UX
- **Responsive Layout**: Support various screen sizes and orientations
- **Offline Support**: Core functionality MUST work offline

## Development Workflow

### Pre-Development Requirements

- **Memory Bank Review**: MUST read all memory bank files to understand current project state
- **Design Review**: UI/UX designs MUST be reviewed before implementation
- **Technical Planning**: Architecture decisions MUST be documented
- **Test Planning**: Test strategy MUST be defined before coding begins
- **Dependency Analysis**: Impact on existing code MUST be assessed

### Development Process

1. **Read Memory Bank**: Review all memory bank files to understand current project state
2. **Write Critical Tests First**: Implement simple, valuable tests before any production code
3. **Implement Feature**: Write minimal code to pass tests
4. **Refactor**: Improve code while keeping tests green
5. **End-to-End Verification**: Test critical user journeys using simulators
6. **Local CI/CD Validation**: Run ALL CI/CD pipeline steps locally and ensure they pass
   - Run linting: `npm run lint`
   - Run formatting check: `npm run format:check`
   - Run type checking: `npm run type-check`
   - Run test suite: `npm test`
   - Run build: `npm run build`
7. **Commit & Push**: Only after local validation succeeds, commit code and push to remote
8. **Code Review**: Submit PR - remote CI/CD pipelines will validate again
9. **Update Memory Bank**: Document changes, decisions, and learnings in memory bank

### Quality Gates

- **Automated Checks**: All CI/CD checks MUST pass before merge
  - Linting and formatting
  - Type checking
  - Unit test suite
  - Integration tests
  - UI tests (where applicable)
  - Security audit
  - Performance benchmarks
- **Manual Review**: Code review MUST be completed by qualified reviewer
- **Platform Testing**: Feature MUST be tested on at least 2 platforms
- **Documentation**: README and API docs MUST be updated if needed

### Release Standards

- **Version Control**: Use semantic versioning for all releases
- **Changelog**: Document all changes in changelog
- **Rollback Plan**: Have clear rollback procedure for each release
- **Monitoring**: Set up monitoring and alerting for critical metrics
- **User Feedback**: Collect and respond to user feedback systematically

## Governance

### Scope & Authority

This constitution applies to all cross-platform mobile development projects within the Communexus ecosystem. All development decisions MUST be justified against these principles. Violations require explicit documentation and team consensus.

### Amendment Procedure

1. **Proposal**: Any team member may propose amendments via pull request to `.specify/memory/constitution.md`
2. **Impact Analysis**: Proposer MUST include Sync Impact Report documenting affected templates and dependent artifacts
3. **Review**: Team reviews proposal against core principles and project needs
4. **Consensus**: Amendments require team consensus before adoption
5. **Version Update**: Constitution version MUST be incremented per semantic versioning:
   - **MAJOR** (X.0.0): Backward-incompatible changes, principle removals, or fundamental redefinitions
   - **MINOR** (0.X.0): New principles added, material expansions to guidance, new sections
   - **PATCH** (0.0.X): Clarifications, wording improvements, typo fixes, non-semantic refinements
6. **Propagation**: Update ALL dependent templates, documentation, and command files to maintain consistency
7. **Documentation**: Update `LAST_AMENDED_DATE` and prepend Sync Impact Report to constitution file

### Compliance Review

- **Pre-Development**: Every feature MUST pass Constitution Check before Phase 0 research begins
- **Post-Design**: Re-check constitution compliance after Phase 1 design completes
- **Continuous**: Development decisions MUST reference constitution principles when making architectural choices
- **Retrospective**: Team reviews constitution effectiveness quarterly and proposes amendments as needed

### Version History

- **1.1.0** (2025-10-23): Added Principle VIII (CI/CD Discipline) - local validation before commits
- **1.0.0** (2025-10-23): Initial ratification - Core principles I-VII established
