# Implementation Plan - Filtering Refinement

This plan outlines the steps to separate inclusive and exclusive filters, add persistence via local storage, and enhance the filter UI.

## Phase 1: Preparation & State Refactoring

- [x] Task: Research existing filter implementation in `AppComponent` 7f8a9b2
- [x] Task: Refactor `AppComponent` state to support separate inclusive and exclusive filters a1b2c3d
    - Replace `filters: Set<string>` with `inclusiveFilters: Set<string>` and `exclusiveFilters: Set<string>`
    - Update `filterPredicate` to handle both sets
- [x] Task: Implement filter persistence logic b2c3d4e
    - Add methods to save/load filters from `localStorage`
    - Call load logic in `OnInit` or `constructor`

## Phase 2: UI Implementation

- [x] Task: Update `app.component.html` to support two filter inputs c3d4e5f
    - Add section for Inclusive filters with chips
    - Add section for Exclusive filters with chips
    - Ensure clear labeling for each
- [x] Task: Add "Clear Filters" button d4e5f6g
    - Implement `clearFilters()` method in `AppComponent`
    - Add button to UI (likely near the filter inputs)
- [x] Task: Adjust existing "Clear" button e5f6g7h
    - Ensure it only clears query data, not filters (as per spec)
- [x] Task: UI Polish - Ensure constant height for filter inputs f6g7h8i

## Phase 3: Validation & Polish

- [~] Task: Verify filtering logic works as expected (Inclusive AND Exclusive)
- [ ] Task: Verify persistence across page reloads
- [ ] Task: Manual verification of UI responsiveness and accessibility
- [ ] Task: Conductor - User Manual Verification 'Filtering Refinement' (Protocol in workflow.md)
