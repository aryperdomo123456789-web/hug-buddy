# Plan: Implement Navigation and Functional Mirroring

The user is reporting that navigation in the sidebar ("ITENS NO MENU LATERAL") is not working and wants a "perfect functional mirror" of the original Odin dashboard. 

## Technical Analysis
1.  **Navigation**: `src/routes/index.tsx` uses a local `view` state for navigation. While this works for the content area, clicking `NavItem` components in the sidebar updates `view`, but the user might be expecting real routes or more persistent state. 
2.  **Functional Mirroring**: The "Customers" (Clientes) list is implemented, but the "Dashboard", "Streams", and "Servidores" views are currently mostly empty skeletons.
3.  **SSH Data**: `getStreams` and `getBouquets` in `server.functions.ts` return empty arrays.

## Implementation Steps

### 1. Fix Sidebar and Navigation
- Ensure `NavItem` in `src/routes/index.tsx` correctly updates the `view` state.
- Add a persistent visual indicator of the active view.

### 2. Implement Real Data Fetching for All Views
- Update `src/lib/server.functions.ts` to fetch real data for Streams, Servers, and Bouquets from the MySQL database on 23.158.72.30.
- Update `src/hooks/use-odin.ts` to include these new functions in its `fetchAll` routine.

### 3. Build Detailed View Components
- Create/Update `src/components/dashboard/ServerList.tsx` to show actual server status.
- Create/Update `src/components/dashboard/StreamList.tsx` to list IPTV streams with online/offline status.

### 4. Stability and Visual Polish
- Ensure the sidebar `NavItem` icons and labels match the user's reference exactly.
- Fix the database info section in the sidebar to reflect real connection status.

## Files to be Modified
- `src/lib/server.functions.ts`: Add real SQL queries for all entities.
- `src/hooks/use-odin.ts`: Wire up all data fetching.
- `src/routes/index.tsx`: Implement the remaining view switch cases and improve layout.
- `src/components/dashboard/ServerList.tsx`: (New) Component for servers.
- `src/components/dashboard/StreamList.tsx`: (New) Component for streams.
