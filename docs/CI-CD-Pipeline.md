# Communexus CI/CD Pipeline

## Overview

This project includes a comprehensive GitHub Actions CI/CD pipeline that automatically tests, builds, and deploys the application on every push and pull request.

## Pipeline Jobs

### 1. Test Suite (`test`)
- **Triggers**: Every push and pull request
- **Runs**: ESLint, Prettier, TypeScript type checking, Jest tests
- **Artifacts**: Test results and coverage reports

### 2. Build Project (`build`)
- **Triggers**: After successful test completion
- **Runs**: Firebase Functions build, Expo project build
- **Artifacts**: Build artifacts for deployment

### 3. Deploy Firebase Functions (`deploy-firebase`)
- **Triggers**: Only on pushes to `main` branch
- **Runs**: Firebase Functions deployment
- **Requirements**: `FIREBASE_TOKEN` secret must be configured

### 4. Security Scan (`security-scan`)
- **Triggers**: Every push and pull request
- **Runs**: npm audit, CodeQL analysis
- **Purpose**: Identify security vulnerabilities

### 5. Notify Status (`notify`)
- **Triggers**: After all other jobs complete
- **Purpose**: Provide status notifications

## Required Secrets

Configure these secrets in your GitHub repository settings:

- `FIREBASE_TOKEN`: Firebase CLI token for deployment
  - Generate with: `firebase login:ci`
  - Required for: Firebase Functions deployment

## Pipeline Features

### Code Quality Gates
- **ESLint**: Code linting with React Native rules
- **Prettier**: Code formatting validation
- **TypeScript**: Strict type checking
- **Jest**: Unit test execution

### Security Features
- **npm audit**: Dependency vulnerability scanning
- **CodeQL**: Static code analysis for security issues
- **Secret management**: Secure handling of sensitive data

### Deployment Features
- **Conditional deployment**: Only deploys from `main` branch
- **Artifact management**: Build artifacts preserved for debugging
- **Rollback capability**: Previous builds available for rollback

## Local Development

### Pre-commit Checks
Run these commands locally before pushing:

```bash
# Check code quality
npm run lint
npm run format:check
npm run type-check

# Run tests
npm test

# Build project
npm run build
```

### CI/CD Testing
Test the pipeline locally using GitHub Actions CLI:

```bash
# Install GitHub Actions CLI
npm install -g @actions/cli

# Run pipeline locally
act push
```

## Pipeline Configuration

The pipeline is configured in `.github/workflows/ci-cd.yml` and includes:

- **Node.js 18**: Consistent runtime environment
- **npm ci**: Fast, reliable dependency installation
- **Parallel jobs**: Optimized execution time
- **Artifact caching**: Improved build performance
- **Error handling**: Graceful failure management

## Monitoring

### Pipeline Status
- View pipeline runs in GitHub Actions tab
- Monitor job status and logs
- Set up notifications for failures

### Metrics
- Test coverage reports
- Build time tracking
- Deployment success rates
- Security scan results

## Troubleshooting

### Common Issues

1. **Firebase deployment fails**
   - Verify `FIREBASE_TOKEN` secret is configured
   - Check Firebase project permissions
   - Ensure functions build successfully

2. **Tests fail**
   - Run tests locally first
   - Check for environment-specific issues
   - Verify test dependencies

3. **Build fails**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

### Getting Help

- Check GitHub Actions logs for detailed error messages
- Review pipeline configuration in `.github/workflows/ci-cd.yml`
- Consult project documentation for setup requirements

## Future Enhancements

- **E2E testing**: Add end-to-end test automation
- **Performance testing**: Include performance benchmarks
- **Multi-environment**: Support staging and production deployments
- **Slack notifications**: Add team notification integration
