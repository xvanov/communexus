<!--
Sync Impact Report:
Version change: 2.3.0 → 2.3.1 (fixed principle numbering)
Modified principles:
  - Memory Bank Management - Restored as Principle I (was missing)
  - All principles correctly numbered I-VII
Added sections: N/A
Removed sections: N/A
Templates requiring updates: N/A (no template files found)
Follow-up TODOs: None
-->

# Cross-Platform Mobile Development Constitution

## Core Principles

### I. Memory Bank Management (NON-NEGOTIABLE)

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
6. **Code Review**: Submit PR with tests that provide meaningful feedback
7. **Update Memory Bank**: Document changes, decisions, and learnings in memory bank

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

This constitution applies to all cross-platform mobile development projects. Amendments require team consensus and must maintain the core principles of test-driven development, simplicity, and cross-platform consistency. All development decisions must be justified against these principles.

**Version**: 2.3.1 | **Ratified**: 2024-12-19 | **Last Amended**: 2024-12-19
