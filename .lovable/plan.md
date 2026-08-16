# Plan: Odin v6 Panel Stability and "Aborted" Error Fix

The user is experiencing a persistent `Error: aborted` which often occurs in serverless environments (like the one running TanStack Start) when a request takes too long or exceeds the maximum duration allowed by the platform. Since our operations involve SSH connection to a remote server and MySQL queries, these can easily exceed time limits if not optimized.

## Proposed Changes

### 1. SSH & Connection Optimization
- **Persistent SSH Connections**: Instead of creating a new SSH session for every batch, implement a singleton-like manager for SSH connections with aggressive keep-alive.
- **Improved Timeout Handling**: Explicitly handle timeouts for both SSH and MySQL commands to prevent hanging requests.
- **SQL Sanitization**: Implement proper escaping for all inputs in `createUser` and `updateUser` to prevent SQL injection and errors with special characters.

### 2. Dashboard Data Loading Strategy
- **Decoupled Loading**: Currently, the dashboard waits for all data. I will implement a more resilient data fetching strategy in the `useOdinData` hook to handle partial failures and prevent "all or nothing" white screens.
- **Optimistic UI Updates**: Improve the user experience by reflecting changes locally while server actions complete.

### 3. Safety and Security
- **Strict SQL Escaping**: Use the `escapeSql` utility in all user operations.
- **Confirmations for Critical Actions**: Ensure the `deleteUser` and `killConnections` actions always have clear user confirmations (already partially implemented, will refine).

### 4. Code Robustness
- **Environment Variable Fallbacks**: Ensure `getOdinConfig` consistently uses the hardcoded laboratory credentials when environment variables are missing.
- **Error Boundaries**: Add better error reporting in the UI to show *why* something failed instead of a blank screen.

## Technical Details

- **File**: `src/lib/server.functions.ts`
  - Refactor `executeBatchQueries` to be more resilient.
  - Add `escapeSql` to `createUser` and `updateUser`.
- **File**: `src/hooks/use-odin.ts`
  - Add better retry logic and partial data state management.
- **File**: `src/components/dashboard/UserModal.tsx`
  - Ensure the `loading` state blocks all interaction during save.

## Potential Impacts
- Improved dashboard responsiveness.
- Elimination of the `Error: aborted` caused by long-running SSH sessions.
- Enhanced security via SQL escaping.
