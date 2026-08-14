# Interior Simulation and Material Flow Design

## Goal

Connect the approved Figma flow from style selection through photo upload, AI generation, before/after result, analysis-based material recommendation, product comparison, and persisted material selection.

## Existing Foundation

The frontend screens and routes already match the supplied mobile designs. Photo upload is connected to request images, AI generation is connected to the Gemini-backed endpoint, and material detail screens read the catalog API. The missing boundaries are recommendation consumption, calculated totals, and persistence of the final selection.

## Design

1. Keep the existing style, upload, generating, and result screens. Their UI remains the source of truth from Figma.
2. Carry the selected style through session storage and convert it to the backend `MaterialTheme` value.
3. Fetch `GET /api/analysis/request/{requestId}/recommended-products?theme=...` on the recommendation summary. The response already includes product ID, quantity, unit price, amount, reason, and priority derived from analyzed floor and wallpaper areas.
4. Use the first recommendation per work type as the default unless the user already selected a catalog product in this request's session.
5. Keep the floor, wallpaper, and lighting catalog pages for comparison. Their confirmed product IDs update the flow context.
6. Calculate the displayed estimate from the chosen recommendation amounts. For a catalog alternative without an analysis quantity, reuse the corresponding recommended quantity and multiply it by the catalog price.
7. On final confirmation, send `selectedTheme`, `selectedFlooringProductId`, `selectedWallpaperProductId`, and `selectedLightingProductId` to `PATCH /api/requests/{requestId}` before navigating to contractors.

## State and Recovery

Selection keys remain in session storage for navigation recovery, but the database becomes authoritative after final confirmation. Session keys are namespaced by the active request ID so a different request cannot inherit stale materials.

## Errors

- Missing active request: stop and show a recovery message.
- Recommendation failure: show retry UI; do not present invented totals.
- Persistence failure: remain on the summary and show the server message.
- Missing category: disable completion until all three categories are available.

## Tests

- API contract test for the theme query parameter.
- Summary page test for analysis recommendations, computed total, and persisted IDs.
- Failure test proving navigation does not occur when persistence fails.
- Existing upload, generation, material catalog, lint, build, and backend tests remain green.

## Scope

This change connects the supplied screens and existing APIs. It does not add a new image model, redesign the Figma screens, or implement checkout/payment.
