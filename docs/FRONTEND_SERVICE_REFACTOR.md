# Frontend Event Service Refactoring Log

**Date:** 2026-02-14
**Goal:** Synchronize the frontend service structure with the existing backend architecture for `event` services.

## Overview

The `event` service logic in the frontend was previously contained in a single file (`frontend/src/services/eventService.js`). This structure did not align with the backend's modular structure (`backend/service/event/`), making it harder to track feature parity and business logic separation.

We have refactored the frontend service to mirror the backend structure, separating concerns into Queries, Actions, and Approvals.

## Changes Made

### 1. Replaced Legacy Service File

*   **Deleted:** `frontend/src/services/eventService.js`
*   **Created:** `frontend/src/services/event/` directory

### 2. New Modular Service Structure

The new structure in `frontend/src/services/event/` directly maps to the backend files in `backend/service/event/`:

| Frontend File (`frontend/src/services/event/`) | Backend File (`backend/service/event/`) | Purpose |
| :--- | :--- | :--- |
| `event.query.js` | `event.query.js` | Dedicated to **Read Operations** (fetching data). |
| `event.action.js` | `event.action.js` | Dedicated to **Write Operations** (create, update, delete). |
| `event.approval.js` | `event.approval.js` | Dedicated to **Business Logic/Approvals** (approve, reject, feedback). |

### 3. File Contents & Logic Distribution

#### `event.query.js`
Handles all data fetching.
*   `getEvents(page, limit)`: Fetches paginated event list (Admin view).
*   `getEventsByCategory()`: Fetches categorized events (User dashboard view). *New function added to match backend capability.*

#### `event.action.js`
Handles modification of event data.
*   `createEvent(formData)`
*   `editEvent(eventId, formData)`
*   `deleteEvent(eventId)`

#### `event.approval.js`
Handles administrative workflows.
*   `approveEvent(eventId)`
*   `rejectEvent(eventId, feedback)`
*   `sendFeedback(eventId, feedback)`

#### `index.js` (Barrel File)
Exports all functions from the sub-modules so imports remain clean.
```javascript
export * from './event.query';
export * from './event.action';
export * from './event.approval';
```

## Component Updates

The following components were updated to use the new modular structure:

1.  **`frontend/src/Pages/SuperAdmin/Dashboard.jsx`**
    *   Updated imports to pull from `../../services/event`.
2.  **`frontend/src/Pages/Admin/Dashboard.jsx`**
    *   Updated imports to pull from `../../services/event`.
3.  **`frontend/src/Pages/Dashboard.jsx`** (User Dashboard)
    *   Replaced direct `apiClient` calls with the new `getEventsByCategory` service function for better abstraction.

## Benefits

*   **Consistency:** The frontend and backend now share the same mental model for organizing code.
*   **Maintainability:** Easier to locate specific logic (e.g., "Where is the approval logic?" -> `event.approval.js`).
*   **Scalability:** Adding new features to specific domains (like new query filters) won't bloat a single service file.
