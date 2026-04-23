# Specification: N+1 / Duplicate Query Warning

## Overview
Implement a feature to detect and visually flag potential N+1 or duplicate query problems in the realtime query stream. This helps developers easily identify inefficient database interactions originating from their Django applications.

## Functional Requirements
1. **Query Detection Logic**:
   - The system must identify similar queries executed within a configurable timeframe.
   - "Similar queries" are defined as queries with the same structural signature but potentially different parameter values.
   - The detection logic should group similar queries that happen close to each other, indicating a potential N+1 issue.
2. **Visual Indicators**:
   - **Row Warning**: Add a warning icon to the affected query rows in the main query list.
   - **Exploration Modal/Drawer**: Introduce a UI component (modal or side drawer) that allows the user to click on the warning to explore the entire group of matched queries.
   - **Impact Overview**: The modal/drawer must display an overview of the group's impact (e.g., total execution time, number of queries in the group).
3. **Configuration**:
   - The thresholds for triggering the warning (e.g., number of similar queries and the timeframe window) must be configurable by the user via the UI.

## Non-Functional Requirements
- **Performance**: The detection logic must run efficiently in real-time as queries are streamed, without causing noticeable lag in the UI or backend.

## Acceptance Criteria
- [ ] Users can configure the N+1 warning threshold (count and timeframe) in the UI.
- [ ] The system correctly identifies and groups structurally similar queries within the configured timeframe.
- [ ] Affected query rows display a clear warning icon.
- [ ] Clicking the warning icon opens a modal/drawer.
- [ ] The modal/drawer displays the group of matched queries and their collective performance impact.