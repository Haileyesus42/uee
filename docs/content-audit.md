# Compass content audit

Generated from Postgres; read-only.

## Executive summary

- Student textbooks: **47** (subject × grade, at least one section)
- Teacher guides: **16**
- Sections: **2600**
- Interactive units: **108**, lessons: **363**, steps: **1318**
- Questions: **4973** (4949 past-paper, 24 seed)
- Answered: **4941** (99.4% overall; past-paper 99.4%)
- Referenced page images missing from disk: **0**

## Textbooks and teacher guides

| Grade | Subject | Kind | Sections | Chapters | Blocks | Image pages | Facsimile | Empty sections | Missing images |
|---|---|---|---:|---:|---:|---:|---|---:|---:|
| 9 | Biology | Teacher guide | 46 | 7 | 109 | 109 | yes | 0 | 0 |
| 9 | Civics | Teacher guide | 34 | 9 | 154 | 154 | yes | 0 | 0 |
| 9 | Economics | Teacher guide | 56 | 7 | 93 | 93 | yes | 0 | 0 |
| 9 | Geography | Teacher guide | 57 | 9 | 273 | 273 | yes | 0 | 0 |
| 9 | Health and Physical Education | Teacher guide | 12 | 2 | 51 | 51 | yes | 0 | 0 |
| 9 | History | Teacher guide | 46 | 9 | 186 | 186 | yes | 0 | 0 |
| 9 | Information Technology | Teacher guide | 55 | 6 | 118 | 118 | yes | 0 | 0 |
| 9 | Mathematics | Teacher guide | 35 | 8 | 166 | 166 | yes | 0 | 0 |
| 9 | Physics | Teacher guide | 45 | 8 | 105 | 105 | yes | 0 | 0 |
| 9 | Biology | Textbook | 42 | 6 | 145 | 145 | yes | 0 | 0 |
| 9 | Chemistry | Textbook | 14 | 6 | 174 | 174 | yes | 0 | 0 |
| 9 | Civics | Textbook | 39 | 7 | 165 | 165 | yes | 0 | 0 |
| 9 | Economics | Textbook | 32 | 7 | 109 | 109 | yes | 0 | 0 |
| 9 | English | Textbook | 30 | 13 | 254 | 254 | yes | 0 | 0 |
| 9 | Geography | Textbook | 45 | 40 | 231 | 231 | yes | 0 | 0 |
| 9 | Health and Physical Education | Textbook | 36 | 9 | 158 | 158 | yes | 0 | 0 |
| 9 | History | Textbook | 72 | 45 | 212 | 212 | yes | 0 | 0 |
| 9 | Information Technology | Textbook | 42 | 36 | 248 | 248 | yes | 0 | 0 |
| 9 | Mathematics | Textbook | 37 | 10 | 291 | 291 | yes | 0 | 0 |
| 9 | Physics | Textbook | 54 | 32 | 173 | 173 | yes | 0 | 0 |
| 10 | Civics | Teacher guide | 49 | 9 | 165 | 165 | yes | 0 | 0 |
| 10 | Economics | Teacher guide | 51 | 7 | 119 | 119 | yes | 0 | 0 |
| 10 | Geography | Teacher guide | 57 | 9 | 181 | 181 | yes | 0 | 0 |
| 10 | Health and Physical Education | Teacher guide | 17 | 5 | 56 | 56 | yes | 0 | 0 |
| 10 | History | Teacher guide | 31 | 12 | 158 | 158 | yes | 0 | 0 |
| 10 | Information Technology | Teacher guide | 65 | 6 | 124 | 124 | yes | 0 | 0 |
| 10 | Mathematics | Teacher guide | 26 | 7 | 227 | 227 | yes | 0 | 0 |
| 10 | Biology | Textbook | 20 | 6 | 213 | 213 | yes | 0 | 0 |
| 10 | Chemistry | Textbook | 20 | 7 | 295 | 295 | yes | 0 | 0 |
| 10 | Civics | Textbook | 45 | 8 | 188 | 188 | yes | 0 | 0 |
| 10 | Economics | Textbook | 63 | 8 | 169 | 169 | yes | 0 | 0 |
| 10 | English | Textbook | 94 | 55 | 305 | 305 | yes | 0 | 0 |
| 10 | Geography | Textbook | 35 | 5 | 189 | 189 | yes | 0 | 0 |
| 10 | Health and Physical Education | Textbook | 34 | 9 | 146 | 146 | yes | 0 | 0 |
| 10 | History | Textbook | 34 | 28 | 228 | 228 | yes | 0 | 0 |
| 10 | Information Technology | Textbook | 60 | 54 | 234 | 234 | yes | 0 | 0 |
| 10 | Mathematics | Textbook | 33 | 8 | 382 | 382 | yes | 0 | 0 |
| 10 | Physics | Textbook | 47 | 42 | 247 | 247 | yes | 0 | 0 |
| 11 | Agriculture | Textbook | 30 | 15 | 261 | 261 | yes | 0 | 0 |
| 11 | Biology | Textbook | 51 | 7 | 237 | 237 | yes | 0 | 0 |
| 11 | Chemistry | Textbook | 34 | 28 | 330 | 330 | yes | 0 | 0 |
| 11 | Civics | Textbook | 50 | 12 | 145 | 145 | yes | 0 | 0 |
| 11 | Economics | Textbook | 68 | 8 | 194 | 194 | yes | 0 | 0 |
| 11 | English | Textbook | 30 | 13 | 334 | 334 | yes | 0 | 0 |
| 11 | Geography | Textbook | 43 | 7 | 223 | 223 | yes | 0 | 0 |
| 11 | History | Textbook | 51 | 10 | 262 | 262 | yes | 0 | 0 |
| 11 | Information Technology | Textbook | 28 | 24 | 157 | 157 | yes | 0 | 0 |
| 11 | Mathematics | Textbook | 24 | 3 | 480 | 480 | yes | 0 | 0 |
| 11 | Physics | Textbook | 44 | 39 | 335 | 335 | yes | 0 | 0 |
| 11 | Technical Drawing | Textbook | 23 | 8 | 145 | 145 | yes | 0 | 0 |
| 12 | Agriculture | Textbook | 28 | 16 | 294 | 294 | yes | 0 | 0 |
| 12 | Biology | Textbook | 26 | 6 | 279 | 279 | yes | 0 | 0 |
| 12 | Chemistry | Textbook | 26 | 21 | 276 | 276 | yes | 0 | 0 |
| 12 | Civics | Textbook | 45 | 12 | 149 | 149 | yes | 0 | 0 |
| 12 | Economics | Textbook | 55 | 6 | 206 | 206 | yes | 0 | 0 |
| 12 | English | Textbook | 66 | 11 | 270 | 270 | yes | 0 | 0 |
| 12 | General Business | Textbook | 27 | 4 | 138 | 138 | yes | 0 | 0 |
| 12 | Geography | Textbook | 39 | 8 | 224 | 224 | yes | 0 | 0 |
| 12 | History | Textbook | 39 | 8 | 224 | 224 | yes | 0 | 0 |
| 12 | Information Technology | Textbook | 32 | 7 | 198 | 198 | yes | 0 | 0 |
| 12 | Mathematics | Textbook | 78 | 6 | 396 | 396 | yes | 0 | 0 |
| 12 | Physics | Textbook | 37 | 21 | 176 | 176 | yes | 0 | 0 |
| 12 | Technical Drawing | Textbook | 16 | 5 | 101 | 101 | yes | 0 | 0 |

## Interactive lessons

| Grade | Subject | Units | Lessons | Empty | Thin (1 step) | Question steps | Step types |
|---|---|---:|---:|---:|---:|---:|---|
| 9 | Aptitude | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 9 | Biology | 6 | 23 | 0 | 0 | 44 | explanation:23, question:44, example:21 |
| 9 | Chemistry | 6 | 25 | 0 | 0 | 47 | explanation:25, question:47, example:22 |
| 9 | Civics | 9 | 29 | 0 | 0 | 55 | explanation:29, question:55, example:26 |
| 9 | Economics | 6 | 26 | 0 | 0 | 52 | explanation:26, example:26, question:52 |
| 9 | English | 11 | 43 | 0 | 0 | 83 | explanation:43, question:83, example:40 |
| 9 | Geography | 4 | 19 | 0 | 0 | 38 | explanation:19, example:19, question:38 |
| 9 | History | 5 | 26 | 0 | 0 | 52 | explanation:26, example:26, question:52 |
| 9 | Information Technology | 6 | 27 | 0 | 0 | 54 | explanation:27, example:27, question:54 |
| 9 | Mathematics | 6 | 16 | 0 | 0 | 29 | explanation:16, question:29, example:13 |
| 9 | Physics | 7 | 19 | 0 | 0 | 36 | explanation:19, question:36, example:17 |
| 10 | Aptitude | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 10 | Biology | 3 | 11 | 0 | 0 | 19 | explanation:11, question:19, example:8 |
| 10 | Chemistry | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 10 | Civics | 3 | 12 | 0 | 0 | 22 | explanation:12, question:22, example:10 |
| 10 | Economics | 1 | 5 | 0 | 0 | 10 | explanation:5, example:5, question:10 |
| 10 | English | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 10 | Information Technology | 1 | 5 | 0 | 0 | 10 | explanation:5, example:5, question:10 |
| 10 | Mathematics | 5 | 15 | 0 | 0 | 26 | explanation:15, question:26, example:11 |
| 10 | Physics | 6 | 21 | 0 | 0 | 40 | explanation:21, question:40, example:19 |
| 11 | Aptitude | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 11 | Biology | 6 | 4 | 0 | 0 | 4 | explanation:4, question:4 |
| 11 | Chemistry | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 11 | Civics | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 11 | English | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 11 | Mathematics | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 11 | Physics | 1 | 3 | 0 | 0 | 4 | explanation:3, example:1, question:4 |
| 12 | Aptitude | 1 | 4 | 0 | 0 | 4 | explanation:4, question:4 |
| 12 | Biology | 1 | 2 | 0 | 0 | 2 | question:2, explanation:2 |
| 12 | Chemistry | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 12 | Civics | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 12 | English | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 12 | Mathematics | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |
| 12 | Physics | 1 | 2 | 0 | 0 | 2 | explanation:2, question:2 |

## UEE questions by year, stream and subject

| Year | Stream | Subject | Total | Answered | Unanswered | Coverage | With explanation | 4 valid options | Duplicates |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| 2025 | natural | Aptitude | 56 | 51 | 5 | 91.1% | 51 | 56 | 0 |
| 2025 | social | Aptitude | 56 | 51 | 5 | 91.1% | 51 | 56 | 0 |
| 2025 | natural | Biology | 98 | 98 | 0 | 100.0% | 98 | 98 | 0 |
| 2025 | natural | Chemistry | 76 | 71 | 5 | 93.4% | 71 | 76 | 0 |
| 2025 | social | Economics | 85 | 85 | 0 | 100.0% | 85 | 85 | 0 |
| 2025 | natural | English | 100 | 98 | 2 | 98.0% | 98 | 100 | 0 |
| 2025 | social | English | 100 | 98 | 2 | 98.0% | 98 | 100 | 0 |
| 2025 | social | Geography | 98 | 98 | 0 | 100.0% | 98 | 98 | 0 |
| 2025 | social | History | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2025 | natural | Mathematics | 53 | 51 | 2 | 96.2% | 43 | 53 | 1 |
| 2025 | social | Mathematics | 58 | 58 | 0 | 100.0% | 58 | 58 | 4 |
| 2025 | natural | Physics | 59 | 55 | 4 | 93.2% | 54 | 59 | 0 |
| 2024 | natural | Aptitude | 43 | 43 | 0 | 100.0% | 43 | 43 | 0 |
| 2024 | social | Aptitude | 43 | 43 | 0 | 100.0% | 43 | 43 | 0 |
| 2024 | natural | Biology | 93 | 93 | 0 | 100.0% | 93 | 93 | 0 |
| 2024 | natural | Chemistry | 72 | 72 | 0 | 100.0% | 72 | 72 | 0 |
| 2024 | natural | Civics | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2024 | social | Civics | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2024 | social | Economics | 78 | 78 | 0 | 100.0% | 78 | 78 | 0 |
| 2024 | natural | English | 110 | 110 | 0 | 100.0% | 110 | 110 | 0 |
| 2024 | social | English | 110 | 110 | 0 | 100.0% | 110 | 110 | 0 |
| 2024 | social | Geography | 82 | 82 | 0 | 100.0% | 82 | 82 | 0 |
| 2024 | social | History | 100 | 100 | 0 | 100.0% | 100 | 100 | 0 |
| 2024 | natural | Mathematics | 52 | 52 | 0 | 100.0% | 52 | 52 | 0 |
| 2024 | social | Mathematics | 51 | 51 | 0 | 100.0% | 51 | 51 | 0 |
| 2024 | natural | Physics | 48 | 48 | 0 | 100.0% | 48 | 48 | 0 |
| 2023 | natural | Aptitude | 52 | 52 | 0 | 100.0% | 52 | 52 | 0 |
| 2023 | social | Aptitude | 52 | 52 | 0 | 100.0% | 52 | 52 | 0 |
| 2023 | natural | Biology | 92 | 92 | 0 | 100.0% | 92 | 92 | 0 |
| 2023 | natural | Chemistry | 76 | 76 | 0 | 100.0% | 76 | 76 | 0 |
| 2023 | natural | Civics | 96 | 96 | 0 | 100.0% | 96 | 96 | 0 |
| 2023 | social | Civics | 96 | 96 | 0 | 100.0% | 96 | 96 | 0 |
| 2023 | natural | English | 106 | 106 | 0 | 100.0% | 106 | 106 | 0 |
| 2023 | social | English | 106 | 106 | 0 | 100.0% | 106 | 106 | 0 |
| 2023 | social | Geography | 90 | 90 | 0 | 100.0% | 90 | 90 | 0 |
| 2023 | social | History | 100 | 100 | 0 | 100.0% | 100 | 100 | 0 |
| 2023 | natural | Mathematics | 57 | 57 | 0 | 100.0% | 57 | 57 | 0 |
| 2023 | social | Mathematics | 57 | 57 | 0 | 100.0% | 57 | 57 | 0 |
| 2023 | natural | Physics | 46 | 46 | 0 | 100.0% | 46 | 46 | 0 |
| 2022 | natural | Aptitude | 52 | 45 | 7 | 86.5% | 29 | 52 | 0 |
| 2022 | social | Aptitude | 44 | 44 | 0 | 100.0% | 44 | 44 | 0 |
| 2022 | natural | Biology | 93 | 93 | 0 | 100.0% | 93 | 93 | 0 |
| 2022 | natural | Chemistry | 58 | 58 | 0 | 100.0% | 58 | 58 | 0 |
| 2022 | natural | Civics | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2022 | social | Civics | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2022 | natural | English | 106 | 106 | 0 | 100.0% | 106 | 106 | 0 |
| 2022 | social | English | 106 | 106 | 0 | 100.0% | 106 | 106 | 0 |
| 2022 | social | Geography | 82 | 82 | 0 | 100.0% | 82 | 82 | 0 |
| 2022 | social | History | 85 | 85 | 0 | 100.0% | 85 | 85 | 0 |
| 2022 | natural | Mathematics | 51 | 51 | 0 | 100.0% | 51 | 51 | 0 |
| 2022 | social | Mathematics | 51 | 51 | 0 | 100.0% | 51 | 51 | 0 |
| 2022 | natural | Physics | 30 | 30 | 0 | 100.0% | 30 | 30 | 0 |
| 2021 | natural | Aptitude | 56 | 56 | 0 | 100.0% | 56 | 56 | 0 |
| 2021 | social | Aptitude | 56 | 56 | 0 | 100.0% | 56 | 56 | 0 |
| 2021 | natural | Biology | 95 | 95 | 0 | 100.0% | 95 | 95 | 0 |
| 2021 | natural | Chemistry | 69 | 69 | 0 | 100.0% | 69 | 69 | 1 |
| 2021 | natural | Civics | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2021 | social | Civics | 99 | 99 | 0 | 100.0% | 99 | 99 | 0 |
| 2021 | natural | English | 118 | 118 | 0 | 100.0% | 118 | 118 | 0 |
| 2021 | social | English | 118 | 118 | 0 | 100.0% | 118 | 118 | 0 |
| 2021 | social | Geography | 30 | 30 | 0 | 100.0% | 30 | 30 | 0 |
| 2021 | social | History | 31 | 31 | 0 | 100.0% | 31 | 31 | 0 |
| 2021 | natural | Mathematics | 65 | 65 | 0 | 100.0% | 65 | 65 | 0 |
| 2021 | social | Mathematics | 65 | 65 | 0 | 100.0% | 65 | 65 | 0 |
| 2021 | natural | Physics | 48 | 48 | 0 | 100.0% | 48 | 48 | 0 |
| seed bank | seed | Aptitude | 3 | 3 | 0 | 100.0% | 3 | 3 | 0 |
| seed bank | seed | Biology | 3 | 3 | 0 | 100.0% | 3 | 3 | 0 |
| seed bank | seed | Chemistry | 3 | 3 | 0 | 100.0% | 3 | 3 | 0 |
| seed bank | seed | Civics | 3 | 3 | 0 | 100.0% | 3 | 3 | 0 |
| seed bank | seed | English | 3 | 3 | 0 | 100.0% | 3 | 3 | 0 |
| seed bank | seed | Mathematics | 5 | 5 | 0 | 100.0% | 5 | 5 | 0 |
| seed bank | seed | Physics | 4 | 4 | 0 | 100.0% | 4 | 4 | 0 |
