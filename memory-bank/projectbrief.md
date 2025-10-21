# Project Brief: Communexus Core Messaging Platform

## Project Overview

Communexus is a production-quality messaging app designed for contractors and service business operators to centralize communication with clients, team members, and vendors. The app combines real-time chat infrastructure with AI-powered features for task extraction, priority detection, and decision tracking.

## Core Requirements

### Primary Goal

Achieve 90+ points on GauntletAI MessageAI project rubric

### Long-term Vision

Evolve into a multi-channel communication platform embeddable in vertical apps

## Three-Phase Development Approach

### Phase 1: MVP Gate

- **Goal**: Pass hard gate with all 10 core messaging features
- **Focus**: Core messaging infrastructure, real-time delivery, offline support
- **Success Criteria**: All core messaging works reliably on 2+ devices

### Phase 2: Assignment Submission

- **Goal**: Achieve 90+ points on rubric with polished AI features
- **Focus**: All 5 required AI features + Proactive Assistant with LangChain
- **Target Scoring**: 93/100 points

### Phase 3: Platform Evolution

- **Goal**: Transform into embeddable multi-channel communication platform
- **Focus**: Multi-channel integration (SMS, email, WhatsApp), SDK extraction

## Technology Stack

- **Mobile**: React Native (Expo SDK 50+), TypeScript strict mode
- **Backend**: Firebase (Firestore, Cloud Functions, Auth, Storage, FCM)
- **AI**: OpenAI GPT-4 API via Cloud Functions, LangChain for Proactive Assistant
- **State**: Zustand for global state, React Query for server state
- **Testing**: Physical devices required, Expo Go for distribution

## Performance Targets

- Sub-200ms message delivery
- 60 FPS scrolling through 1000+ messages
- <2 second app launch
- <5 second AI response times
- 99.9% message delivery reliability

## Current Status

- **Phase**: Phase 1 Complete ✅, Phase 2 Ready to Begin
- **Current Task**: T008 - Setup Firebase Firestore with security rules
- **Next Steps**: Begin Phase 2 foundational Firebase services
- **Architecture**: Mobile + Backend (React Native + Firebase) - Complete

## Key Constraints

- Must pass MVP gate before proceeding to Phase 2
- All features must directly contribute to rubric scoring
- Offline-capable with sub-200ms real-time delivery
- 2+ device testing required
- API keys must be secured in Cloud Functions

## Success Metrics

- **MVP Gate**: All 10 core features functional, tested on 2+ devices
- **Assignment**: 90+ rubric points, demo video complete
- **Platform**: Multi-channel integration working, SDK extractable
