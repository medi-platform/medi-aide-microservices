## Micro-Frontend Architecture (Phase 3)

### Shell (Host)
- Next.js app (`apps/medi-aide-frontend`) acts as host/shell.
- Exposes module federation remotes:
  - `shell/AuthProvider`
  - `shell/GlobalState`
  - `shell/EventBus`
- Status page: `/stage3/mfe/status` probes all MFEs `/api/health`.

### Domain MFEs
- Next.js apps under `apps/micro-frontends/*` (caregiver, patient, wellness, admin).
- Each MFE consumes shell providers and global state.
- Security headers and CORS enabled for `remoteEntry.js`.

### Cross-MFE Communication
- `EventBus` uses `BroadcastChannel` with `window.postMessage` fallback.
- Request/response with correlation IDs and timeouts.
- Origin filtering via `NEXT_PUBLIC_ALLOWED_ORIGINS`.

### Shared State
- Global store built with Zustand, exported by shell.
- Write operations broadcast via `EventBus` to keep imports in sync.
- MFEs register initial flags via `useRegisterInitialState`.

### Production Deployment
- `Dockerfile.next.mfe` builds standalone Next.js images.
- `docker-compose.mfe.yml` runs shell + MFEs + Nginx (port 3080).
- Nginx routes `/caregiver`, `/patient`, `/wellness`, `/admin` to each MFE.

### Observability & Resilience
- Error boundaries in each MFE.
- Basic RUM via `reportWebVitals`.
- Health endpoints exposed under `/api/health` for all MFEs.

### Testing
- Playwright: status page renders and remoteEntry CORS checks.
- Extend with cross-MFE UI flows as features land.


