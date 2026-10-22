# UEE library inventory

_Generated 2026-10-22 from the database and artifacts on disk._

Status: **not found** → **source acquired** → **e-book generated** → **quality checked** → **integrated** (rows present in `textbook_sections`).

| Gr | Subject | Textbook | Teacher Guide | TG sections |
|---|---|---|---|---|
| 9 | biology | integrated (36) | integrated | 32 |
| 9 | chemistry | integrated (7) | not found | - |
| 9 | civics | integrated (26) | integrated | 27 |
| 9 | economics | integrated (23) | integrated | 24 |
| 9 | english | integrated (24) | not found | - |
| 9 | geography | integrated (39) | integrated | 35 |
| 9 | history | integrated (44) | integrated | 40 |
| 9 | information-technology | integrated (35) | integrated | 26 |
| 9 | mathematics | integrated (27) | integrated | 24 |
| 9 | physics | integrated (31) | integrated | 36 |
| 9 | hpe | integrated (26) | generated (fails check) | 2 / 1u |
| 9 | pva | source acquired | not found | - |
| 9 | technical-drawing | source acquired | not found | - |
| 9 | general-business | source acquired | not found | - |
| 9 | agriculture | source acquired | not found | - |
| 10 | biology | integrated (19) | not found | - |
| 10 | chemistry | integrated (15) | source acquired — blocked | ToC incomplete |
| 10 | civics | integrated (36) | integrated | 37 |
| 10 | economics | integrated (28) | integrated | 30 |
| 10 | english | integrated (54) | not found | - |
| 10 | geography | integrated (24) | integrated | 25 |
| 10 | history | integrated (27) | integrated | 25 |
| 10 | information-technology | integrated (53) | integrated | 25 |
| 10 | mathematics | integrated (25) | integrated | 18 |
| 10 | physics | integrated (39) | not found | - |
| 10 | hpe | integrated (24) | generated (fails check) | 5 / 4u |
| 10 | pva | source acquired | not found | - |
| 10 | technical-drawing | source acquired | not found | - |
| 10 | general-business | source acquired | not found | - |
| 10 | agriculture | source acquired | not found | - |
| 11 | biology | integrated (44) | not found | - |
| 11 | chemistry | integrated (27) | generated (fails check) | 9 / 4u |
| 11 | civics | integrated (45) | generated (fails check) | 0 / 0u |
| 11 | economics | integrated (29) | not found | - |
| 11 | english | integrated (24) | not found | - |
| 11 | geography | integrated (18) | not found | - |
| 11 | history | integrated (46) | not found | - |
| 11 | information-technology | integrated (23) | not found | - |
| 11 | mathematics | integrated (29) | not found | - |
| 11 | physics | integrated (38) | not found | - |
| 11 | hpe | source acquired | not found | - |
| 11 | pva | source acquired | not found | - |
| 11 | technical-drawing | integrated (19) | generated (fails check) | 0 / 0u |
| 11 | general-business | source acquired | not found | - |
| 11 | agriculture | integrated (25) | not found | - |
| 12 | biology | integrated (21) | not found | - |
| 12 | chemistry | integrated (20) | not found | - |
| 12 | civics | integrated (40) | not found | - |
| 12 | economics | integrated (25) | not found | - |
| 12 | english | integrated (60) | not found | - |
| 12 | geography | integrated (33) | not found | - |
| 12 | history | integrated (34) | not found | - |
| 12 | information-technology | integrated (22) | not found | - |
| 12 | mathematics | integrated (30) | not found | - |
| 12 | physics | integrated (20) | not found | - |
| 12 | hpe | source acquired | not found | - |
| 12 | pva | source acquired | not found | - |
| 12 | technical-drawing | integrated (12) | not found | - |
| 12 | general-business | integrated (22) | not found | - |
| 12 | agriculture | integrated (23) | not found | - |

**Integrated:** 47 textbooks, 14 teacher guides (1311 textbook + 404 teacher-guide sections).

## Blockers

**Teacher guides still needing manifests** (table-layout or incomplete ToCs): G9 chemistry, G9 English, G9 PVA, G10 biology, G10 chemistry, G10 HPE, G11 chemistry, G11 civics, G11 general business, G11 IT, G11 technical drawing.

**No teacher-guide source exists** for: every G12 subject; G11 biology/economics/english/geography/history/mathematics/physics; G10 physics and english.

**Textbooks still missing:** `pva` G9 (ToC unparseable even at 80 pages), `general-business` G11 (no student source in either library). Amharic is out of scope (removed as not UEE-tested).

## Notes

- Subject rows for `hpe`, `pva`, `agriculture`, `general-business`, `technical-drawing` were created 2026-10-22 (empty `streams`, curriculum-only).
- Teacher guides import under the existing subject slug (`civics`, not `citizenship-education`).

## Facsimile editions (2026-10-22)

All **63** published books (47 textbooks + 16 teacher guides) were converted to
page-image facsimile editions: every page rendered once with `pdftoppm` at
150 dpi and stored as an `image` block (`assets/textbook-images/<book>-pageNNN.jpg`).

- **12,087 page images, 2.9 GB**; 63/63 imported, 0 failures.
- DB after conversion: 1,402 textbook + 411 teacher-guide sections, all opening
  with an `image` block.
- Reader: page images render full-width; tap opens the existing full-screen
  viewer. No schema or frontend change was required.
- **Skipped (no sections to render):** `civics-g11` and `technical-drawing-g11`
  teacher guides.
- **Trade-off:** in-book text search now returns only `"Page N"` captions;
  reflow is replaced by the zoom viewer. Search can be restored later by
  layering a text index (MinerU/OCR) behind the same blocks.

Renderer: `backend/scripts/ingest/renderFacsimile.ts`
Batch driver: `backend/scripts/ingest/batch_facsimile.py`
Status: `.qwen/tmp/facsimile-batch-state.json` (resumable; re-runs reuse pages).
