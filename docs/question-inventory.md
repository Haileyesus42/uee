# Question inventory — by exam year, stream and subject

Generated 2026-11-03 by `backend/scripts/report/questionInventory.cjs` from the `compass_dev` database. Read-only; every number below is a query result, not an estimate.

## How to read this

- **Questions in paper** — rows stored for that year/stream/subject.
- **Answered** — `correctIndex` present *and* inside the option range.
- **With explanation** — a real explanation; the pipeline placeholders ("(no explanation in the marking key)", "(no explanation available …)", "Per the source's marked answer.") are counted as **missing**.
- **Identical to other stream** — questions whose prompt *and* options also appear in the other stream's paper. Such a paper is stored twice, so summing rows overstates the archive. Do not add the two stream rows for that subject-year.
- **Paper source** — which file in `EUEE_database/` the paper came from. The `questions` table has **no per-question source column**, so provenance cannot be attributed per row; the last column records that limitation.

## Totals

| Measure | Count |
|---|---:|
| Past-paper rows (all streams) | 9,744 |
| **Distinct past-paper questions** (stream-duplicate papers collapsed) | **6,650** |
| Answered | 9,696 |
| With a real explanation | 9,571 |
| Practice-bank rows (no exam year — not a past paper) | 24 |

Answered share: 99.5% of rows.

| Stream | Rows |
|---|---:|
| Natural Science | 5,610 |
| Social Science | 4,134 |

The two stream columns must not be added to get the archive size — see the `Identical to other stream` column and the distinct total above.

## Per paper

| Year (G.C.) | Stream | Subject | Questions in paper | Answered | With explanation | Identical to other stream | Paper source |
|---:|---|---|---:|---:|---:|---:|---|
| 2013 | natural | biology | 100 | 99 | 100 | — | national-exams:answer-key + national-exams:questions |
|  | natural | chemistry | 80 | 79 | 80 | — | national-exams:answer-key + national-exams:questions |
|  | natural | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:questions |
|  | social | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:questions |
|  | natural | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | social | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | natural | mathematics | 65 | 64 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | social | mathematics | 65 | 64 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | natural | physics | 50 | 48 | 50 | — | national-exams:answer-key + national-exams:questions |
| 2014 | natural | biology | 100 | 100 | 100 | — | national-exams:answer-key + national-exams:questions |
|  | natural | chemistry | 79 | 77 | 79 | — | national-exams:answer-key + national-exams:questions |
|  | natural | civics | 100 | 99 | 61 | 100 | national-exams:answer-key + national-exams:questions |
|  | social | civics | 100 | 99 | 61 | 100 | national-exams:answer-key + national-exams:questions |
|  | natural | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | social | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | natural | mathematics | 65 | 64 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | social | mathematics | 65 | 64 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | natural | physics | 50 | 49 | 50 | — | national-exams:answer-key + national-exams:questions |
| 2015 | natural | biology | 100 | 100 | 100 | — | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | chemistry | 80 | 80 | 80 | — | national-exams:answer-key + national-exams:questions |
|  | natural | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:questions |
|  | social | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:questions |
|  | natural | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:answer-key-broken + national-exams:questions |
|  | social | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:answer-key-broken + national-exams:questions |
|  | natural | mathematics | 65 | 65 | 65 | 65 | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | social | mathematics | 65 | 65 | 65 | 65 | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | physics | 50 | 50 | 50 | — | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
| 2016 | natural | biology | 100 | 100 | 100 | — | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | chemistry | 80 | 79 | 80 | — | national-exams:answer-key + national-exams:questions |
|  | natural | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:questions |
|  | social | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:questions |
|  | natural | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | social | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | natural | mathematics | 65 | 65 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | social | mathematics | 65 | 65 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | natural | physics | 50 | 50 | 50 | — | national-exams:answer-key + national-exams:questions |
| 2017 | natural | biology | 100 | 100 | 100 | — | national-exams:answer-key + national-exams:questions |
|  | natural | chemistry | 80 | 80 | 80 | — | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:answer-key-broken + national-exams:questions |
|  | social | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:answer-key-broken + national-exams:questions |
|  | natural | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | social | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | mathematics | 63 | 63 | 63 | 63 | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | social | mathematics | 63 | 63 | 63 | 63 | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | physics | 50 | 50 | 50 | — | national-exams:answer-key + national-exams:questions |
| 2018 | natural | biology | 100 | 100 | 100 | — | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | chemistry | 80 | 80 | 80 | — | national-exams:answer-key + national-exams:questions + national-exams:questions-broken |
|  | natural | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:answer-key-broken + national-exams:questions |
|  | social | civics | 100 | 100 | 100 | 100 | national-exams:answer-key + national-exams:answer-key-broken + national-exams:questions |
|  | natural | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | social | english | 120 | 120 | 120 | 120 | national-exams:answer-key + national-exams:questions |
|  | natural | mathematics | 65 | 64 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | social | mathematics | 65 | 64 | 65 | 65 | national-exams:answer-key + national-exams:questions |
|  | natural | physics | 50 | 50 | 50 | — | national-exams:answer-key + national-exams:questions |
| 2021 | natural | aptitude | 56 | 56 | 56 | 56 | page-scan:page-image + temari:paper |
|  | social | aptitude | 56 | 56 | 56 | 56 | page-scan:page-image + temari:paper |
|  | natural | biology | 95 | 95 | 95 | — | temari:paper |
|  | natural | chemistry | 69 | 69 | 57 | — | temari:paper |
|  | natural | civics | 99 | 99 | 99 | 99 | temari:paper |
|  | social | civics | 99 | 99 | 99 | 99 | temari:paper |
|  | natural | english | 118 | 118 | 118 | 118 | temari:paper |
|  | social | english | 118 | 118 | 118 | 118 | temari:paper |
|  | social | geography | 30 | 30 | 30 | — | page-scan:page-image + temari:paper |
|  | social | history | 31 | 31 | 31 | — | page-scan:page-image + temari:paper |
|  | natural | mathematics | 65 | 65 | 52 | 65 | temari:paper |
|  | social | mathematics | 65 | 65 | 52 | 65 | temari:paper |
|  | natural | physics | 48 | 48 | 48 | — | temari:paper |
| 2022 | natural | aptitude | 52 | 45 | 48 | 25 | page-scan:page-image + temari:paper |
|  | social | aptitude | 44 | 44 | 44 | 25 | page-scan:page-image + temari:paper |
|  | natural | biology | 93 | 93 | 93 | — | temari:paper |
|  | natural | chemistry | 58 | 58 | 58 | — | temari:paper |
|  | natural | civics | 99 | 99 | 99 | 99 | temari:paper |
|  | social | civics | 99 | 99 | 99 | 99 | temari:paper |
|  | natural | english | 106 | 106 | 106 | 106 | temari:paper |
|  | social | english | 106 | 106 | 106 | 106 | temari:paper |
|  | social | geography | 82 | 82 | 82 | — | page-scan:page-image + temari:paper |
|  | social | history | 85 | 85 | 85 | — | page-scan:page-image + temari:paper |
|  | natural | mathematics | 51 | 51 | 40 | 51 | temari:paper |
|  | social | mathematics | 51 | 51 | 40 | 51 | temari:paper |
|  | natural | physics | 30 | 30 | 30 | — | temari:paper |
| 2023 | natural | aptitude | 52 | 52 | 52 | 52 | page-scan:page-image + temari:paper |
|  | social | aptitude | 52 | 52 | 52 | 52 | page-scan:page-image + temari:paper |
|  | natural | biology | 92 | 92 | 92 | — | temari:paper |
|  | natural | chemistry | 76 | 76 | 76 | — | temari:paper |
|  | natural | civics | 96 | 96 | 96 | 96 | temari:paper |
|  | social | civics | 96 | 96 | 96 | 96 | temari:paper |
|  | natural | english | 106 | 106 | 106 | 106 | temari:paper |
|  | social | english | 106 | 106 | 106 | 106 | temari:paper |
|  | social | geography | 90 | 90 | 85 | — | page-scan:page-image + temari:paper |
|  | social | history | 100 | 100 | 100 | — | page-scan:page-image + temari:paper |
|  | natural | mathematics | 57 | 57 | 57 | 57 | temari:paper |
|  | social | mathematics | 57 | 57 | 57 | 57 | temari:paper |
|  | natural | physics | 46 | 46 | 46 | — | temari:paper |
| 2024 | natural | aptitude | 43 | 43 | 43 | 43 | page-scan:page-image + temari:paper |
|  | social | aptitude | 43 | 43 | 43 | 43 | page-scan:page-image + temari:paper |
|  | natural | biology | 93 | 93 | 93 | — | temari:paper |
|  | natural | chemistry | 72 | 72 | 72 | — | temari:paper |
|  | natural | civics | 99 | 99 | 99 | 99 | temari:paper |
|  | social | civics | 99 | 99 | 99 | 99 | temari:paper |
|  | social | economics | 78 | 78 | 78 | — | temari:paper |
|  | natural | english | 110 | 110 | 110 | 110 | temari:paper |
|  | social | english | 110 | 110 | 110 | 110 | temari:paper |
|  | social | geography | 82 | 82 | 82 | — | page-scan:page-image + temari:paper |
|  | social | history | 100 | 100 | 100 | — | page-scan:page-image + temari:paper |
|  | natural | mathematics | 52 | 52 | 52 | 42 | temari:paper |
|  | social | mathematics | 51 | 51 | 51 | 42 | temari:paper |
|  | natural | physics | 48 | 48 | 48 | — | temari:paper |
| 2025 | natural | aptitude | 56 | 51 | 51 | 56 | page-scan:page-image + temari:paper |
|  | social | aptitude | 56 | 51 | 51 | 56 | page-scan:page-image + temari:paper |
|  | natural | biology | 98 | 98 | 98 | — | _no paper file_ |
|  | natural | chemistry | 76 | 71 | 71 | — | temari:paper |
|  | social | economics | 85 | 85 | 85 | — | temari:paper |
|  | natural | english | 100 | 98 | 98 | 100 | temari:paper |
|  | social | english | 100 | 98 | 98 | 100 | temari:paper |
|  | social | geography | 98 | 98 | 97 | — | page-scan:page-image + temari:paper |
|  | social | history | 99 | 99 | 99 | — | page-scan:page-image + temari:paper |
|  | natural | mathematics | 53 | 51 | 51 | — | temari:paper |
|  | social | mathematics | 58 | 58 | 58 | — | temari:paper |
|  | natural | physics | 59 | 55 | 55 | — | temari:paper |

## Gaps

Every paper that is missing outright (no row at all), grouped by cause.

### Whole examination years with nothing in the database

- **2019, 2020** — no rows for any subject in either stream (28 papers).

### Subjects missing in both streams for a year

- **2013** — missing 1: aptitude — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2014** — missing 1: aptitude — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2015** — missing 1: aptitude — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2016** — missing 1: aptitude — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2017** — missing 1: aptitude — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2018** — missing 1: aptitude — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2025** — missing 1: civics — _absent from all four archives checked; likely not an examined subject that year (SOURCES.md)_

### Single missing papers

- **2013 social** — economics — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2013 social** — geography — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2013 social** — history — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2014 social** — economics — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2014 social** — geography — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2014 social** — history — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2015 social** — economics — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2015 social** — geography — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2015 social** — history — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2016 social** — economics — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2016 social** — geography — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2016 social** — history — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2017 social** — economics — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2017 social** — geography — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2017 social** — history — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2018 social** — economics — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2018 social** — geography — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2018 social** — history — _never digitised by any archive found; the printed-compilation route is the only one (SOURCES.md §2b)_
- **2021 social** — economics — _absent from every online archive checked; possibly not examined in this year_
- **2022 social** — economics — _absent from every online archive checked; possibly not examined in this year_
- **2023 social** — economics — _absent from every online archive checked; possibly not examined in this year_

Subjects present in at least one year: biology, chemistry, civics, economics, english, geography, history, mathematics, physics, aptitude.

## Method and limits

- Source of truth: the `questions` table (`examYear` not null) joined to `subjects`. Nothing inferred.
- "Distinct" means distinct `(prompt, options)` within the whole table. Two questions with the same prompt but different options are counted separately, because that is what a student sees.
- The `Identical to other stream` column is computed by intersecting the two streams' `(prompt, options)` sets — not by trusting the stream label.
- Paper-level provenance comes from `EUEE_database/MANIFEST.csv`. Where that file has no paper for a year+subject that has rows, the source column reads `_no paper file_`: the rows exist but their source file is not in the library.
- `aiDeepExplanation` coverage is in the CSV; it was not counted as "with explanation" because the app shows the short explanation first.

