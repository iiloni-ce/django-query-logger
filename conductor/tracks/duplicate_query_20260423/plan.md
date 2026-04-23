# Implementation Plan

## Phase 1: Core Detection Logic & Types
- [ ] Task: Define types and configuration interfaces for N+1 detection (thresholds, timeframe).
- [ ] Task: Write Tests for query signature/normalization logic.
- [ ] Task: Implement query signature/normalization logic (to identify structurally similar queries).
- [ ] Task: Write Tests for grouping and time-window detection logic.
- [ ] Task: Implement grouping and time-window detection logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Core Detection Logic & Types' (Protocol in workflow.md)

## Phase 2: UI Configuration & Indicators
- [ ] Task: Write Tests for UI configuration component (threshold & timeframe inputs).
- [ ] Task: Implement UI configuration component in the frontend.
- [ ] Task: Write Tests for query row warning indicator.
- [ ] Task: Implement query row warning indicator in the main query list.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Configuration & Indicators' (Protocol in workflow.md)

## Phase 3: Exploration Drawer/Modal
- [ ] Task: Write Tests for N+1 exploration drawer/modal component.
- [ ] Task: Implement N+1 exploration drawer/modal component (displaying grouped queries and impact overview).
- [ ] Task: Write Tests for interaction between warning icon and drawer/modal.
- [ ] Task: Implement interaction (clicking warning opens drawer with correct group context).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Exploration Drawer/Modal' (Protocol in workflow.md)