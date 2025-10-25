#!/bin/bash

# Communexus Deployment Script
# This script handles building and deploying the app to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Communexus"
APP_ID="com.communexus.app"
VERSION=$(node -p "require('./package.json').version")

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if EAS CLI is installed
    if ! command -v eas &> /dev/null; then
        error "EAS CLI is not installed. Please install it with: npm install -g @expo/eas-cli"
    fi
    
    # Check if logged in to EAS
    if ! eas whoami &> /dev/null; then
        error "Not logged in to EAS. Please run: eas login"
    fi
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
    fi
    
    # Check if logged in to Firebase
    if ! firebase projects:list &> /dev/null; then
        error "Not logged in to Firebase. Please run: firebase login"
    fi
    
    success "All prerequisites met"
}

# Build functions
build_development() {
    log "Building development version..."
    eas build --platform all --profile development --non-interactive
    success "Development build completed"
}

build_preview() {
    log "Building preview version..."
    eas build --platform all --profile preview --non-interactive
    success "Preview build completed"
}

build_production() {
    log "Building production version..."
    eas build --platform all --profile production --non-interactive
    success "Production build completed"
}

build_testflight() {
    log "Building TestFlight version..."
    eas build --platform ios --profile testflight --non-interactive
    success "TestFlight build completed"
}

# Deploy functions
deploy_firebase_functions() {
    log "Deploying Firebase Functions..."
    cd functions
    npm run build
    firebase deploy --only functions
    cd ..
    success "Firebase Functions deployed"
}

deploy_firestore_rules() {
    log "Deploying Firestore rules..."
    firebase deploy --only firestore:rules
    success "Firestore rules deployed"
}

deploy_storage_rules() {
    log "Deploying Storage rules..."
    firebase deploy --only storage
    success "Storage rules deployed"
}

deploy_firebase_all() {
    log "Deploying all Firebase services..."
    firebase deploy
    success "All Firebase services deployed"
}

# Submit functions
submit_testflight() {
    log "Submitting to TestFlight..."
    eas submit --platform ios --profile testflight --non-interactive
    success "App submitted to TestFlight"
}

submit_app_store() {
    log "Submitting to App Store..."
    eas submit --platform ios --profile production --non-interactive
    success "App submitted to App Store"
}

submit_play_store() {
    log "Submitting to Play Store..."
    eas submit --platform android --profile production --non-interactive
    success "App submitted to Play Store"
}

# Testing functions
run_tests() {
    log "Running tests..."
    npm test
    success "Tests completed"
}

run_lint() {
    log "Running linter..."
    npm run lint
    success "Linting completed"
}

run_type_check() {
    log "Running TypeScript type check..."
    npx tsc --noEmit
    success "Type check completed"
}

# Validation functions
validate_build() {
    log "Validating build..."
    
    # Check if build artifacts exist
    if [ ! -d "dist" ]; then
        error "Build artifacts not found. Please run a build first."
    fi
    
    # Check package.json version
    if [ -z "$VERSION" ]; then
        error "Version not found in package.json"
    fi
    
    success "Build validation passed"
}

validate_environment() {
    log "Validating environment..."
    
    # Check required environment variables
    if [ -z "$EXPO_PROJECT_ID" ]; then
        warning "EXPO_PROJECT_ID not set"
    fi
    
    if [ -z "$FIREBASE_PROJECT_ID" ]; then
        warning "FIREBASE_PROJECT_ID not set"
    fi
    
    success "Environment validation completed"
}

# Cleanup functions
clean_build() {
    log "Cleaning build artifacts..."
    rm -rf dist/
    rm -rf functions/lib/
    success "Build artifacts cleaned"
}

clean_dependencies() {
    log "Cleaning dependencies..."
    rm -rf node_modules/
    rm -rf functions/node_modules/
    npm install
    cd functions && npm install && cd ..
    success "Dependencies cleaned and reinstalled"
}

# Main deployment workflow
deploy_all() {
    log "Starting full deployment workflow..."
    
    # Pre-deployment checks
    check_prerequisites
    validate_environment
    run_tests
    run_lint
    run_type_check
    
    # Build
    build_production
    
    # Deploy backend
    deploy_firebase_all
    
    # Submit to stores
    submit_testflight
    submit_play_store
    
    success "Full deployment completed!"
}

# Quick deployment for development
deploy_dev() {
    log "Starting development deployment..."
    
    check_prerequisites
    run_tests
    build_development
    deploy_firebase_functions
    
    success "Development deployment completed!"
}

# Show help
show_help() {
    echo "Communexus Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build-dev        Build development version"
    echo "  build-preview    Build preview version"
    echo "  build-prod       Build production version"
    echo "  build-testflight Build TestFlight version"
    echo ""
    echo "  deploy-functions Deploy Firebase Functions only"
    echo "  deploy-firebase  Deploy all Firebase services"
    echo "  deploy-all       Full deployment workflow"
    echo "  deploy-dev       Quick development deployment"
    echo ""
    echo "  submit-testflight Submit to TestFlight"
    echo "  submit-appstore  Submit to App Store"
    echo "  submit-playstore Submit to Play Store"
    echo ""
    echo "  test            Run tests"
    echo "  lint            Run linter"
    echo "  type-check      Run TypeScript type check"
    echo "  validate        Validate build and environment"
    echo ""
    echo "  clean           Clean build artifacts"
    echo "  clean-deps      Clean and reinstall dependencies"
    echo ""
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy-dev          # Quick dev deployment"
    echo "  $0 build-prod          # Build production version"
    echo "  $0 deploy-all           # Full production deployment"
}

# Main script logic
case "${1:-help}" in
    "build-dev")
        check_prerequisites
        build_development
        ;;
    "build-preview")
        check_prerequisites
        build_preview
        ;;
    "build-prod")
        check_prerequisites
        build_production
        ;;
    "build-testflight")
        check_prerequisites
        build_testflight
        ;;
    "deploy-functions")
        check_prerequisites
        deploy_firebase_functions
        ;;
    "deploy-firebase")
        check_prerequisites
        deploy_firebase_all
        ;;
    "deploy-all")
        deploy_all
        ;;
    "deploy-dev")
        deploy_dev
        ;;
    "submit-testflight")
        check_prerequisites
        submit_testflight
        ;;
    "submit-appstore")
        check_prerequisites
        submit_app_store
        ;;
    "submit-playstore")
        check_prerequisites
        submit_play_store
        ;;
    "test")
        run_tests
        ;;
    "lint")
        run_lint
        ;;
    "type-check")
        run_type_check
        ;;
    "validate")
        validate_build
        validate_environment
        ;;
    "clean")
        clean_build
        ;;
    "clean-deps")
        clean_dependencies
        ;;
    "help"|*)
        show_help
        ;;
esac
