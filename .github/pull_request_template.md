Decision: <doc type> · <create | update>
Sources: <primary source> + <files each major claim was verified against>
Verification: <claims checked> → <confirmed | contradicted | not found | gap | no source mapped>
Terminology: <PASS | FAIL> — touch-set: <files>; findings: <none | list>
Unverified: <low | med | high> — <list or "none">

## What changed

<!-- What changed in the docs, and why. -->

## Checks

- [ ] `npm run check` passes
- [ ] `npm run test:seeded` passes (needed if the spec or a checker changed)
- [ ] New pages are in `lib/nav.ts`

## If this changes `openapi/arena.json`

- [ ] The docs tables and examples match the new spec
- [ ] A matching PR in `sabuj000/arena-game` is needed: spec copy, `npm run gen:sdk`, sandbox and contract tests. Link it here, or write why it is not needed:
- [ ] The `arena-game` PR is opened after this one merges. Its CI runs `check:spec-drift` and fails until the spec copy matches `main` here.

Confidence: <0.0–1.0>. `[unverified]`: <list or none>
