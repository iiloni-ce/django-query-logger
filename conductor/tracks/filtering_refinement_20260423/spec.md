# Specification - Filtering Refinement

## Goal
Improve the filtering capabilities of the Django Query Logger UI by separating inclusive and exclusive filters, persisting them in local storage, and providing a dedicated clear button for filters.

## Requirements

### Functional Requirements
1. **Separate Inclusive and Exclusive Filters**:
    - Users should be able to define filters that *must* be present in the query (Inclusive).
    - Users should be able to define filters that *must not* be present in the query (Exclusive).
2. **Persistence**:
    - Both inclusive and exclusive filters must be saved to `localStorage` so they persist across page reloads.
3. **Dedicated Filter Controls**:
    - A dedicated "Clear Filters" button should be added to clear only the filter sets, without clearing the captured queries.
    - The existing "Clear" button should continue to clear all captured queries, but its relationship with filters should be clarified (it currently clears filters too, which we might want to separate or keep as a "Reset All" action). *Decision: The "Clear" button will now focus on clearing data, while "Clear Filters" focuses on filters.*
4. **UI Updates**:
    - Two distinct chip input areas: one for Inclusive filters and one for Exclusive filters.
    - Clear visual distinction between the two types of filters.

### Technical Requirements
- **State Management**: Update `AppComponent` to manage `inclusiveFilters` and `exclusiveFilters` (as `Set<string>` or `string[]`).
- **Filter Predicate**: Update `MatTableDataSource.filterPredicate` to logically combine both sets: `query` matches if it contains ALL inclusive strings AND NONE of the exclusive strings.
- **Local Storage**: Use a service or direct `localStorage` access to load/save filter state.

## Implementation Details

### Data Model
- `inclusiveFilters: string[]`
- `exclusiveFilters: string[]`

### Logic
```typescript
this.dataSource.filterPredicate = (query, filterJSON) => {
  const { inclusive, exclusive } = JSON.parse(filterJSON);
  const matchesInclusive = inclusive.every(f => query.sql.toLowerCase().includes(f));
  const matchesExclusive = !exclusive.some(f => query.sql.toLowerCase().includes(f));
  return matchesInclusive && matchesExclusive;
}
```

### UI Layout
- Sidenav or Header section containing:
    - [Input] Inclusive Filters (Chips)
    - [Input] Exclusive Filters (Chips)
    - [Button] Clear Filters
