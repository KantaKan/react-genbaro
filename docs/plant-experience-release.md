# Plant Experience V2 release checks

## Contract audit

Production components use `resolvePlantAppearance` for a single 2D/3D appearance. `getPlantVariant` is only called inside that resolver and its own tests. The garden API now includes `equipped_cosmetics`, while the resolver still accepts legacy selected palette/pot values during migration. Keep that compatibility path until the database backfill and live parity checks are complete.

## Validation already run

- Frontend: `npm run typecheck`, `npm run lint`, `npx vitest run`, and `npm run build` pass. ESLint still reports 12 existing react-refresh warnings. Vitest's jsdom canvas warning is expected. The build still warns about large application and 3D chunks.
- Backend: `go test ./...` and `go build -buildvcs=false ./cmd/...` pass.
- Public development matrix: all 23 species appear in the desktop 3D view. At 390×844 the 3D field, member list, selected-plant information, and free water action remain accessible. A selected plant and water feedback were confirmed in the browser accessibility tree.

## Acceptance matrix still needed with a test account

| Surface | Verify |
| --- | --- |
| Learner dashboard | Streak and tier match the garden, including weekends, holidays, resting, and comeback. Fertilizer and reflection rewards show correct balance/source. |
| Genmate/cohort grid and 3D Farm | Same species, tier, palette, pot, and equipped cosmetics. Cheer, gift, rescue, and water are reachable by touch and keyboard; fertilizer always asks for confirmation. |
| Admin learner/cohort views | Same appearance and streak as learner views. Exact and cohort cosmetic grants appear in permanent collections; admin plant edits retain existing ownership. |
| Gift boxes/reward draw | Source pool and disclosed rarity match the reward; opening twice never grants duplicates. |
| Weak device/reduced motion | 2D fallback retains all actions when WebGL is absent or lost. Reduced motion removes ambient movement. Compare frame time, memory, and input latency against agreed targets on a named low-end device. |

## Rollout and rollback

Follow the [backend migration guide](../../baro-gofiber/docs/plant-cosmetics-migration.md) for backup, dry-run, apply, and convergence checks. Deploy backend before frontend, but both versions retain the legacy fields during the compatibility window. If visual or reward parity fails, revert application deploys first and retain additive cosmetic data. Do not run a blind data rollback: earned items may overlap with migrated items.

Deferred until authenticated acceptance: live learner/admin parity, quantitative desktop/mobile performance budgets, and a production migration run. Do not remove legacy selection fields or the 2D fallback before those checks pass.
