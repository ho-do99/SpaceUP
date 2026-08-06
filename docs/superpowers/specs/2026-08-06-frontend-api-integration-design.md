# Frontend API Integration and Release Design

## Goal

Make the `frontend` branch run against the current backend on port `8090`, remove the reported npm audit findings, replace the highest-value mock-backed flows with documented backend APIs, and promote verified work through `develop` to `main`.

## Scope and priorities

Work proceeds in this order so every completed slice remains demonstrable:

1. Preserve `http://localhost:8090` as the default backend origin.
2. Upgrade Vite to `6.4.3` and React Router DOM to `7.18.0`.
3. Standardize API calls on the existing authenticated `apiRequest` client and the backend `{success, message, data}` envelope.
4. Complete authentication, member profile, and image upload foundations.
5. Connect landlord request creation/update, analysis, spaces, and recommendations.
6. Connect contractor request, quote, chat, visit, project, and review flows as time permits.
7. Connect notifications, portfolios, and settlements after the core flows.

The frontend will not invent endpoints that are absent from the backend documentation. AI image generation remains dependent on the backend `GEMINI_API_KEY`, and empty apartment catalog data is treated as a valid response.

## Architecture

Domain API modules live under `frontend/src/api`. Each module calls `apiRequest`, sends paths beginning with `/api`, opts into authentication where required, unwraps the common response envelope, and returns typed domain data to pages. Shared pagination and response-envelope types live under `frontend/src/types`.

Pages own loading, empty, error, retry, and success presentation. Existing mock data may remain only as an explicit demo fallback for a flow that cannot be completed within this delivery; it must not silently replace an API failure.

Session state remains in the existing `authSession` utility. A 401 produces a re-login message, while 403, 404, 409, 413, network, and 5xx errors retain the existing centralized user-facing handling.

## Data flow

The primary landlord flow is login, create a request with minimum property data, upload and attach floor-plan images, poll or fetch analysis, update spaces and request details, load recommended products and contractors, then submit an estimate request.

The primary contractor flow is login, load assigned requests, approve or reject a request, manage the site visit, create and submit a quote, exchange chat messages, convert an accepted quote to a project, update progress, and expose completed-project reviews.

All protected calls use `Authorization: Bearer <accessToken>`. Image URLs returned as `/api/files/images/...` are resolved against the configured `8090` API origin.

## Security and compatibility

Vite moves from 5.x to `6.4.3`, which also selects esbuild `0.25.x` or newer. `@vitejs/plugin-react@4.7.0` remains because it supports Vite 6. React Router DOM moves from 6.x to `7.18.0`; the existing declarative `BrowserRouter`, `Routes`, and `Route` usage is retained unless compilation identifies an incompatibility.

The Vite development server continues to use the repository's configured host behavior for team testing. Secrets are never added to tracked environment files.

## Testing

Vitest will cover request URL normalization, envelope unwrapping, authentication headers, representative domain mapping, and error behavior. Each behavior change follows a red-green cycle.

Release verification requires:

- frontend unit tests;
- frontend lint;
- frontend production build;
- `npm audit` with no high or moderate findings introduced by the addressed packages;
- backend Gradle tests after merging into `develop`;
- conflict-marker and clean-worktree checks;
- ancestry and remote-ref verification after each push.

## Branch and release procedure

Implementation commits are made on `frontend` and pushed to `origin/frontend`. The verified branch is merged with a merge commit into `develop`, pushed, and verified again. Only if the merged application passes the release checks is `develop` merged into `main` and pushed. The local `C:\Users\SMHRD\Desktop\SpaceUP` checkout ends on `main`, synchronized with `origin/main`.

