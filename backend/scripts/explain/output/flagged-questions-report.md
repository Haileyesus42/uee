# Flagged Questions Report

Generated 2026-10-25 from 19 pilot/batch output file(s). 61 unique questions flagged, deduplicated by id.

This is a proposal file for human review. No database writes, answer-key changes, or explanation regeneration were made based on this report — every item here still needs to be checked against the original exam source before anything changes.

## Summary

| Category | Count |
|---|---|
| Likely-incorrect stored answer key | 13 |
| Prompt text is truncated or garbled | 3 |
| Genuinely ambiguous — multiple defensible answers | 9 |
| No stored answer key to confirm against | 3 |
| Unresolvable — referenced reading passage is missing | 16 |
| Unresolvable — referenced diagram/image/chart is missing | 16 |
| Unresolvable — other missing source material | 1 |

## Likely-incorrect stored answer key (13)

### `76937298-4e22-4766-9b44-574d920611a3`
**Subject/year:** mathematics 2014 (natural) · **Confidence:** high

**Prompt:** If y = sin(3x²), then the simplified form of d²y/dx² is:

**Stored answer:** [2] 6cos(3x²) + 36x²sin(3x²)

**Evidence:** FLAGGED — DATA ERROR, not an explanation-quality issue. y' = 6x cos(3x^2) (chain rule). y'' = 6cos(3x^2) + 6x * d/dx[cos(3x^2)] = 6cos(3x^2) + 6x*(-6x sin(3x^2)) = 6cos(3x^2) - 36x^2 sin(3x^2) — a MINUS sign. Option C (marked correct) reads '6cos(3x²) + 36x²sin(3x²)' — a PLUS sign. None of the 4 options match the correct derivative exactly. Notably, the EXISTING stored explanation's own math arrives at the minus-sign form yet still claims it equals option C — the explanation and the marked answer contradict each other internally. Most likely a sign typo in option C's stored text (should be minus), not a wrong correctIndex. Needs a human to check against the original source paper and fix the option text — out of scope for an explanation-only script.

**Recommended action:** Fix sign in option C text (should be minus, not plus) — existing explanation already derives the correct form and contradicts the stored option.

### `fbc80e83-07a0-4840-91ff-b0b867455b04`
**Subject/year:** aptitude 2025 (social) · **Confidence:** high

**Prompt:** If two days after tomorrow is four days before Saturday, what day is it today?

**Stored answer:** [2] Friday · **Independently derived:** [3] Saturday

**Evidence:** FLAGGED, not a mismatch I should force: working it through twice (modular arithmetic and a direct day-by-day check), 'two days after tomorrow' = today+3, and 'four days before Saturday' = Tuesday, giving today = Saturday — which is option D, not the stored answer (C, Friday). Checking today=Friday directly: tomorrow=Saturday, two days after that=Monday, which does not equal 'four days before Saturday' (Tuesday). My derivation doesn't support the stored answer; flagging for a human check rather than writing an explanation that argues for Friday.

**Recommended action:** Verify against source; day-of-week logic checked twice, points to option D (Saturday), not stored C (Friday).

### `bdfbd3ef-1552-4cbb-9cd0-3f22702d85f0`
**Subject/year:** aptitude 2025 (social) · **Confidence:** high

**Prompt:** If $f(x)=\sin \pi x + e^{x^2} + |x| + x^3$ and $g(x)=\cos \pi x + \ln(x+1) + x$, then what is the value of $f(1)-2g(0)$?

**Stored answer:** [3] 0 · **Independently derived:** [1] $e$

**Evidence:** FLAGGED, not forced: $f(1)=\sin\pi+e^1+|1|+1^3=0+e+1+1=e+2$. $g(0)=\cos0+\ln1+0=1+0+0=1$. So $f(1)-2g(0)=(e+2)-2=e$, matching option B, not the stored answer (D, 0). Double-checked this calculation twice; it doesn't support the stored correctIndex, so flagging for a human check rather than writing an explanation that argues for 0.

**Recommended action:** Verify against source; calculus checked twice, points to option B (e), not stored D (0).

### `efdbdb79-8f9f-45c5-a5d1-092d6f942082`
**Subject/year:** biology 2025 (natural) · **Confidence:** high

**Prompt:** Which one of the following classes of enzyme and type of reactions they catalyze is correctly matched?

**Stored answer:** [2] Ligases - cleave bonds by other means rather than hydrolysis

**Evidence:** FLAGGED (recurring from batch 3): under standard EC enzyme classification, none of the 4 options correctly match class to function — each definition is swapped with a different class's actual definition (A is really Transferases' definition, B is really Oxidoreductases', C/the stored answer is really Lyases', D is really Hydrolases'). Ligases actually join molecules (often using ATP), they don't cleave. Needs correction against the source paper.

**Recommended action:** All 4 options pair enzyme class with a different class's actual definition under standard EC classification — needs correction against source, not just a different index.

### `a1e1a7a0-f0a8-4c55-ac51-c9686df44475`
**Subject/year:** ? 2025 (natural) · **Confidence:** low

**Prompt:** The following reaction can be used for the synthesis of CH$_3$CH$_2$CH$_2$CH$_3$ as a desired product: CH$_3$CH$_2$CHBrCH$_3$ + CH$_3$S$^{-}$ → CH$_3$CH$_2$CH$_2$CH$_3$ + CH$_3$SH + Br$^{-}$ Which of the following is the atom economy for the above reaction? (Atomic masses: H=1; C=12; S=32 and Br=80)

**Stored answer:** [1] 30.43%

**Evidence:** FLAGGED: independent atom-economy calculation gives (product mass 58)/(total reactant mass 137+47=184) = 31.5%, close to but not exactly matching the stored answer of 30.43% (option B) — clearly the closest of the 4 options by a wide margin (vs 48%/80%/56%), but the arithmetic doesn't reproduce exactly, so flagging rather than asserting precision that couldn't be independently confirmed bit-for-bit.

**Recommended action:** Independent calc (31.5%) is close to but not exactly the stored 30.43% — almost certainly the right option by elimination, just couldn't reproduce the exact figure. Low priority.

### `5892b341-d722-418f-98a4-a9012d6e8815`
**Subject/year:** ? 2025 (natural) · **Confidence:** high

**Prompt:** What is the electron configuration of $O_2^-$ molecule as per the molecular orbital model? (Atomic number of $O = 8$)

**Stored answer:** [0] σ₁s² σ₁s*² σ₂s² σ₂s*² σ₂px² (π₂py² = π₂pz²) (π*₂py¹ = π*₂pz¹)

**Evidence:** FLAGGED — likely answer-key error: the question asks for O2^- (superoxide, 17 electrons: 8+8+1), but the stored correct option (A) is the MO configuration for NEUTRAL O2 (16 electrons, 8+8) with 2 unpaired π* electrons — the textbook explanation for O2's paramagnetism. The configuration that actually totals 17 electrons (one extra in the π* set, e.g. π*2py²π*2pz¹) is option D, not A. This looks like the source mixed up neutral O2's well-known MO diagram with the question that specifically asks about the anion.

**Recommended action:** Verify against source; stored option is neutral O2's MO config, not O2⁻'s — option D (index 3) has the correct electron count.

### `9b30777e-8d5d-4985-af3d-c7432795cf87`
**Subject/year:** mathematics 2025 (natural) · **Confidence:** high

**Prompt:** Let $A = \{x \in \mathbb{Z} : -2 \leq x \leq 2\}$ and $B = \{x \in \mathbb{N} : 2x \leq 3x + 1\}$ are given two sets. Then what is $n(A \cup B)$?

**Stored answer:** [2] 6

**Evidence:** FLAGGED: B is defined as {x in N : 2x <= 3x+1}, which simplifies to x >= -1 — true for every natural number, making B infinite. A∪B would then be infinite, which cannot match any of the finite answer options. The set-builder condition for B is almost certainly transcribed incorrectly (likely an upper bound got dropped or a sign flipped).

**Recommended action:** Set B's condition as stored makes B infinite (true for all naturals) — likely a dropped bound in transcription, not just a wrong index.

### `c0fe2321-3cbd-44d5-be79-894d05ef498b`
**Subject/year:** mathematics 2025 (natural) · **Confidence:** high

**Prompt:** Which one of the following expression is the correct decomposition of the rational expression $\frac{2x - 3}{x^2 + x - 2}$?

**Stored answer:** [2] $\frac{1}{1 - x} + \frac{5}{3x + 6}$

**Evidence:** FLAGGED, likely wrong stored answer: factoring $x^2+x-2=(x+2)(x-1)$ and solving $\frac{2x-3}{(x+2)(x-1)}=\frac{A}{x+2}+\frac{B}{x-1}$ gives $A=\frac{7}{3}$, $B=-\frac{1}{3}$, i.e. $\frac{1}{3-3x}+\frac{7}{3x+6}$ — which is option B, not the stored option C ($\frac{1}{1-x}+\frac{5}{3x+6}$). Verified numerically at $x=0$: the original expression equals $3/2$; option B also evaluates to $3/2$; option C evaluates to $11/6$, which does not match. correctIndex appears to be wrong (should likely be 1, not 2).

**Recommended action:** Verify against source; independent calc + numeric check at x=0 both point to option B (index 1), not stored C (index 2).

### `9502f67d-dafb-43a0-9d23-7630960b28a7`
**Subject/year:** mathematics 2025 (natural) · **Confidence:** high

**Prompt:** Given the objective function $Z = -x + 2y$ that is subjected to the constraints $\begin{cases} x \geq 3 \\ x + y \geq 5 \\ x + 2y \leq 6 \\ y \geq 0 \end{cases}$, what are the maximum and minimum values of Z respectively?

**Stored answer:** [2] 1 and -2

**Evidence:** FLAGGED, likely wrong stored answer: solving the constraints (x≥3, x+y≥5, x+2y≤6, y≥0), the x≥3 constraint turns out to be non-binding, and the feasible region is a triangle with vertices (5,0), (6,0), (4,1). Evaluating Z=-x+2y at each: -5, -6, -2 respectively — giving max=-2 (at (4,1)) and min=-6 (at (6,0)), which is option A ("-2 and -6"), not the stored option C ("1 and -2"). No vertex of the feasible region produces Z=1, so option C does not appear reachable under these constraints as stated.

**Recommended action:** Verify against source; vertex evaluation points to option A (index 0), not stored C (index 2) — no vertex produces the stored value.

### `2b126c86-e5b4-4c26-910c-d6da3cd796f8`
**Subject/year:** physics 2014 (natural) · **Confidence:** medium

**Prompt:** A glass flask whose volume is exactly 1,000cm³ at 0°C is totally filled with 1000cm³ of mercury at this temperature. When flask and mercury are heated to 100°C, 15.2cm³ of mercury overflow. If the coefficient of volume expansion of mercury is 1.82 x 10^-4 per Celsius degree, what should be the coefficient of volume expansion of the glass?

**Stored answer:** [2] 3.00 x 10^-4/C°

**Evidence:** FLAGGED: using the standard apparent-expansion formula (overflow = V0*deltaT*(beta_liquid - beta_glass)), my derivation gives beta_glass = 1.82e-4 - 15.2/(1000*100) = 1.82e-4 - 1.52e-4 = 3.0e-5 /C deg -- a physically realistic value for glass, but it doesn't match any of the 4 options exactly (closest in magnitude is option D, 1.0e-5, still 3x off; stored answer C, 3.00e-4, is exactly 10x my result). Likely an exponent typo in the source options.

**Recommended action:** Result is exactly 10x smaller than stored option — check for an exponent/unit error in the source, part of a 2014-2016 physics recovery batch worth a dedicated look.

### `52724e50-901d-4482-8bba-e44e7223bdee`
**Subject/year:** physics 2014 (natural) · **Confidence:** medium

**Prompt:** A coil formed by wrapping 50 turns of wire in the shape of a square is positioned in a magnetic field so that the normal to the plane of the coil makes an angle 37° with the direction of the field. When the magnetic field is increased uniformly from 200 mT to 600mT in 4.00s, an emf of magnitude 160.0 mV is induced in the coil. What is the total length of the wire in the coil?

**Stored answer:** [3] 400m

**Evidence:** FLAGGED: emf = N*A*cos(theta)*(dB/dt). Solving: 0.160 = 50*A*cos(37deg)*(0.1), giving A ~ 0.040 m^2, side length ~0.20m, total wire = 50 turns * 4 * 0.20m ~ 40m. This is exactly 10x smaller than the stored answer (D, 400m) and doesn't match any option. Same factor-of-10 pattern as the glass-expansion question above -- possibly a systematic unit issue in this batch of source questions.

**Recommended action:** Result is exactly 10x smaller than stored option — same pattern as the glass-expansion question, same 2014 batch.

### `5be09412-dfe4-4f91-9718-d471d4dfdb6c`
**Subject/year:** physics 2014 (natural) · **Confidence:** medium

**Prompt:** Moving 2.5 x 10^-6 coulomb of charge from point A to point B in an electric field requires 6.3 x 10^-4 joule of work. The potential difference between points A and B is approximately

**Stored answer:** [1] 2.5 x 10^-2V

**Evidence:** FLAGGED: V=W/Q=6.3e-4/2.5e-6 ~ 252V using the given numbers directly -- several orders of magnitude larger than every option (all in the 1e-2 to 1e-19V range), and I can't find an alternate reading of the given numbers that lands near the stored answer (B, 2.5e-2V) either. The prompt's numbers and the option set appear inconsistent with each other.

**Recommended action:** Direct calculation from the given numbers is several orders of magnitude off from every option — prompt numbers and options may be inconsistent with each other.

### `34eaed92-c316-4a5e-b241-6b8c3dbc7094`
**Subject/year:** english 2025 (natural) · **Confidence:** high

**Prompt:** I_______ much today if I had learned about money management at my young age.

**Stored answer:** [2] would not worry

**Evidence:** FLAGGED: likely tense mismatch in the stored answer. The if-clause "if I had learned" is past perfect (third conditional), which should pair with "would not have worried" (option D) in the main clause, not the second-conditional "would not worry" (stored as option C).

**Recommended action:** Standard conditional-tense rule: past-perfect if-clause pairs with "would not have worried" (option D), not stored "would not worry" (option C).

## Prompt text is truncated or garbled (3)

### `db079f85-0e31-4ccf-bdff-2db40b2a01b8`
**Subject/year:** civics 2014 (natural) · **Confidence:** high

**Prompt:** An altruist is identified by his/ her readiness to

**Stored answer:** none

**Evidence:** Not an explanation-quality gap -- correctIndex is null and the stored explanation already states the source question itself is defective (prompt doesn't match any option; none of the four options is a coherent definition of 'altruist'). No answer exists to verify against, so no explanation was generated. Out of scope for this pilot; would need re-transcription from the original source, not explanation generation.

**Recommended action:** Already self-documented as defective in its own stored explanation — none of the 4 options define "altruist" correctly.

### `0e607315-b671-4415-9136-d8cbe938d4fa`
**Subject/year:** chemistry 2021 (natural) · **Confidence:** high

**Prompt:** The sanitizer in wide use for protection against Covid-19 is labelled 83% alcohol. How can one scientifically

**Stored answer:** [0] experimentation

**Evidence:** PROMPT TEXT DEFECT, not an answer mismatch: the stored prompt cuts off mid-sentence after "How can one scientifically" — the actual question (e.g. "...verify this claim?" or similar) is missing, so there isn't enough text to confidently solve or explain this one. The stored correctIndex (0, "experimentation") is plausible for a question asking how to *verify* the label's claim, but I can't confirm the intended question without the full prompt. Flagging for re-transcription from the source rather than guessing at the missing clause.

**Recommended action:** Prompt cut off mid-sentence after "How can one scientifically" — needs re-transcription from source.

### `9c1e9eba-facc-4163-83f2-6d81f1571c0a`
**Subject/year:** mathematics 2025 (natural) · **Confidence:** high

**Prompt:** If one of the roots of the equation $2x^2 - 8x + k = 0$ exceeds the other by then what is the value of $k$?

**Stored answer:** none

**Evidence:** FLAGGED: the prompt is truncated — "exceeds the other by then what is the value of k?" is missing the actual numeric gap between the two roots (e.g. "exceeds the other by 3"). Unsolvable as stored; correctIndex is also null, confirming no answer was ever recorded for this version of the question. Needs re-transcription from the source.

**Recommended action:** Prompt missing the numeric root-gap ("exceeds the other by ___") — needs re-transcription.

## Genuinely ambiguous — multiple defensible answers (9)

### `acf798b4-8c03-4d04-80f0-8d72aa14eda7`
**Subject/year:** ?  (?) · **Confidence:** low

**Prompt:** In September 2000, Ahmed was more than eleven times as old as his son Mustafa and in September 2009, Ahmed was seven more than three times as old as Mustafa. How old was Mustafa in September 2000?

**Stored answer:** [3] 3 years old

**Evidence:** FLAGGED - AMBIGUOUS PREMISE: letting Mustafa's 2000 age = m, the second condition gives Ahmed_2000 = 3m+25, and 'more than eleven times' gives 3m+25 > 11m, i.e. m < 3.125. As a strict inequality this is satisfied by m=1, 2, or 3 — not a unique answer. m=3 (the stored answer) is the largest integer satisfying it, which may be the intended 'boundary' reading, but the premise as stated doesn't uniquely determine it. Possibly 'more than eleven times' is a translation/OCR artifact of a more precise original phrasing. Worth a second look rather than writing a confident explanation for an ill-posed premise.

**Recommended action:** Premise ("more than eleven times") doesn't uniquely determine an integer answer as literally stated — stored answer is a plausible boundary reading, not clearly wrong.

### `7ec265cb-5a85-4908-8a1c-14c4b72fdb5a`
**Subject/year:** ?  (?) · **Confidence:** low

**Prompt:** On Chala's long trip, the amount of fuel remaining in the fuel tank of his car (in liters) is modeled by A(t) = 60-14t, where t is the number of hours since Chala started driving. Which one of the following is NOT true ?

**Stored answer:** [0] Chala can drive 14 kilometers per one liter on the average.

**Evidence:** FLAGGED - FOUND A COMPETING CANDIDATE: stored answer is option A (14 km/liter — an unsupported claim, since the model relates fuel to time, not distance, so this is arguably 'not true' as unverifiable from the given information). But option B ('empty after 3 hours') is also false by direct computation: solving $60-14t=0$ gives $t=60/14\approx4.29$ hours, not 3. Both A and B can reasonably be argued as 'not true,' for different reasons (A: unsupported/off-topic claim; B: directly contradicted by the model). Flagging rather than picking one with false confidence.

**Recommended action:** Two options are both defensibly "not true" for different reasons — stored answer isn't clearly wrong, just one of two reasonable picks.

### `20ae2cdb-4f2e-4377-8f7d-7b6cfd18eb0e`
**Subject/year:** english 2025 (social) · **Confidence:** medium

**Prompt:** a. Many people believe education is the key to success in life. b. These people list names of several intellectuals who struggle to make in the end to breath on their salaries c. As examples, they mention highly educated people who have become rich. d. Others contend that education only leads people to poverty.

**Stored answer:** [1] a c b d

**Evidence:** FLAGGED (confirmed again): my own best-derived paragraph order doesn't match any of the 4 given options; the stored answer requires a pronoun ("these people") to refer forward to something introduced two sentences later, which reads as backward anaphora. Already flagged once before by an earlier batch — consistent finding.

**Recommended action:** My best-derived order isn't among the 4 given options at all — flagged three separate times across batches, consistent finding.

### `d8b029e9-c944-4994-bf89-a8a393c731a0`
**Subject/year:** aptitude 2025 (social) · **Confidence:** low

**Prompt:** What is the possible value of the missing term $x$ in the sequence $-1, 0, 1, 2, -1.8, 1, 26, -1, x, 1, 242, -1, 728, 1, \dots$?

**Stored answer:** [3] 80

**Evidence:** Genuinely could not reverse-engineer a confident pattern from the given terms despite real effort (tried position-based grouping, odd/even interleaving, and ratio relationships between the known later terms) — none of my attempts converge cleanly on 80 or any other option with confidence. Flagging rather than forcing a plausible-sounding but unverified derivation.

**Recommended action:** Could not reverse-engineer the sequence's pattern despite genuine effort — not evidence the stored answer is wrong, just unconfirmed.

### `9b4c64ea-db06-44b0-a427-6aef4c9b10f4`
**Subject/year:** physics 2014 (natural) · **Confidence:** low

**Prompt:** A wire carries a steady current of 2.4A. A straight section of the wire is 0.75 m long and lies in the xy-plane along the x-axis within a uniform magnetic field, B=1.6T. If the current is in the positive x direction, what is the magnetic force on the section of wire?

**Stored answer:** [1] 2.88N, in the positive y direction.

**Evidence:** FLAGGED: F=BIL=1.6*2.4*0.75=2.88N confirms the magnitude (ruling out the 3.84N options), but the prompt never states the magnetic field's direction (only 'B=1.6T'), so the sign/direction of the force (positive vs negative y) can't be independently derived from the given data. Prompt appears to be missing information.

**Recommended action:** Magnitude confirmed correct; only the direction/sign is unverifiable since the prompt omits the field direction.

### `72ce8294-83ce-4679-8684-2fc9211ff370`
**Subject/year:** physics 2014 (natural) · **Confidence:** low

**Prompt:** A placekicker must kick a football from a point which is at a distance of 36.0 m from the goal. When kicked, the ball leaves the ground with a speed of 20.0m/s at an angle of 37° to the horizontal. If the ball hits the crossbar of the goal at a height h and bounces back, what will be the height of the crossbar?

**Stored answer:** [1] 2.85m

**Evidence:** FLAGGED: with v0=20m/s at 37deg, vx~16m/s, vy~12m/s (using the common 3-4-5 approximation), time to reach x=36m is t=2.25s, giving height y=vy*t-0.5*g*t^2 ~ 2.2m (tried both g=9.8 and g=10, and both the exact and 3-4-5-approximate trig values -- all land between 1.7 and 2.25m). This is closest to option A (2.45m) but doesn't cleanly match it, and is well short of the stored answer B (2.85m).

**Recommended action:** Independent projectile calc doesn't cleanly match any option, including the stored one — possible rounding/approximation convention difference.

### `fc33d9a1-a63b-4550-98a3-36c7ae3b2ccb`
**Subject/year:** biology 2025 (natural) · **Confidence:** medium

**Prompt:** This item is based on the following choices of feeding habit employed by organisms. I. Using nutrients dissolved in the surrounding medium II. Manufacturing own nutrients by photosynthesis III. Depending on other plants or animals for food Which method/s do protozoans use to get their nutrition? They employed

**Stored answer:** [2] II and III only.

**Evidence:** FLAGGED (genuine ambiguity): protozoans as a biological group actually use all three feeding modes described — absorbing dissolved nutrients (saprozoic/osmotrophic, I), photosynthesis in photosynthetic forms like Euglena (II), and ingesting other organisms (holozoic, III) — which would point to option D (I, II and III), not the stored C (II and III only). I can construct a curriculum-specific rationale for excluding I (e.g. treating osmotrophic absorption as more characteristic of bacteria/fungi than protozoa), but it's not something I could verify confidently against standard biology definitions, so flagging rather than writing an explanation I'm not sure is right.

**Recommended action:** Standard biology would include all three feeding modes (option D); stored answer excludes one — plausibly a curriculum-specific framing, not confirmed either way.

### `304a307d-d8dd-4245-b4c5-dab1024e2a17`
**Subject/year:** english 2025 (natural) · **Confidence:** low

**Prompt:** a. Arable farming refers to growing crops. b. This farming type refers to keeping sheep and cattle. c. The second farming type is pastoral farming. d. Arable and pastoral farming are commonly known farming types.

**Stored answer:** [0] a d c b

**Evidence:** FLAGGED: genuinely ambiguous. The stored order (a d c b) works if "a" is read as an abrupt opener, but "d" ("Arable and pastoral farming are commonly known farming types") reads more naturally as the paragraph's topic sentence, which would put d before a instead. Both orderings avoid a hard dangling-reference failure, so I can't confidently confirm the stored answer over the alternative.

**Recommended action:** Two orderings are both defensible depending on how the topic sentence is read.

### `d2415376-9643-4d8a-b0aa-23e13590a2fe`
**Subject/year:** physics 2025 (natural) · **Confidence:** low

**Prompt:** A 2 kg object accelerates with 1.5 m/s² to the right on a horizontal frictionless surface under the action of two horizontal forces, F₁ and F₂. What should be the magnitude of F₁?

**Stored answer:** [0] 4 N

**Evidence:** LIKELY MISSING DATA: net force needed is ma=3N, which only resolves to the stored answer (4N) if F2's magnitude/direction is known (e.g. F2=1N opposing would give F1=4N) — but F2 is never specified in the stored prompt. Almost certainly relied on a diagram that wasn't captured during extraction. Not forcing a match I can't independently derive from the given text.

**Recommended action:** Stored answer only resolves if F2 is known, and F2 is never given in the stored text — likely relied on a diagram.

## No stored answer key to confirm against (3)

### `707b8092-31a3-4121-b100-1703227c5298`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** low

**Prompt:** "Conservation of traditions and cultures, languages and commonly held values" is important in addressing human security. Why?

**Stored answer:** none · **Independently derived:** [2] They represent identity and respecting the identity of people is their natural right.

**Evidence:** No stored answer key to verify against (correctIndex is null). Unlike the rest of this set, this one is answerable from general reasoning without the passage — my own best read is option C (identity/natural-right framing is the standard justification for cultural-preservation arguments), but this is unconfirmed without a real source key, so left unwritten rather than guessed into the database.

**Recommended action:** Best independent guess is option C, but genuinely passage-dependent reasoning — needs a source answer key.

### `18fed5c4-f1bc-4322-a7be-3eb2706bf717`
**Subject/year:** aptitude 2025 (social) · **Confidence:** high

**Prompt:** Consider the lengths of the sides of a triangle $x, y, z$, and the quantities given below: Quantity P Quantity Q $3x + y - z$ $4x$

**Stored answer:** none · **Independently derived:** [1] Quantity P is less than Quantity Q.

**Evidence:** No stored answer key to verify against, but this one is solvable with certainty: by the triangle inequality, $x+z>y$ for any valid triangle, which rearranges to $y-z<x$, and therefore $3x+y-z<4x$ always — Quantity P is always less than Quantity Q (option B). Confident in this derivation; flagged only because there's nothing stored to confirm against.

**Recommended action:** Confidently solved independently (option B, triangle inequality) — just needs a source answer key to confirm and record.

### `8cf58229-3a10-4973-93b8-dc6d780ed043`
**Subject/year:** ? 2025 (natural) · **Confidence:** medium

**Prompt:** Consider the following equilibrium reaction at 298 K: 2NO₂(g) ⇌ N₂O₄(g) + O₂(g) P(NO₂) = 0.75 atm, P(N₂O₄) = 2.5 × 10⁻³ atm, P(O₂) = 3.5 × 10⁻⁵ atm Calculate the actual equilibrium constant, Kₚ, for this reaction. (Correct value: Kₚ = 1.56 × 10⁻⁷) Which of the following choices matches the value?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: correctIndex is null — no stored answer key to verify against.

**Recommended action:** Prompt states the "correct value" inline, but none of the 4 options cleanly matches it and there's no stored correctIndex.

## Unresolvable — referenced reading passage is missing (16)

### `482228bd-62ba-4711-a664-e088e09a7778`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** n/a

**Prompt:** According to the passage

**Stored answer:** none

**Evidence:** CANNOT SOLVE: question depends on a reading passage not present in the stored data, and correctIndex is null (no answer key). Unanswerable from what's available.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `6bb3357a-057f-43d1-9e48-e526436c120d`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** n/a

**Prompt:** According to paragraph one, which of the following is not directly related to climate change?

**Stored answer:** none

**Evidence:** CANNOT SOLVE: explicitly references 'paragraph one' of a passage not present in the stored data, and correctIndex is null. Same missing-passage gap as the rest of this climate-change reading set.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `f3247c46-a3ac-42f1-a639-ca39f9c44622`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** n/a

**Prompt:** Fossil fuel production must decline by roughly 6 per cent per year between 2020 and 2030' means

**Stored answer:** none

**Evidence:** CANNOT SOLVE: passage-dependent interpretation question, source passage not present, correctIndex null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `a2a0fd0d-5d5f-4548-8b82-3ccc14a70be1`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** n/a

**Prompt:** According to the passage, the beneficiaries of managing global warming below 1.5°C are

**Stored answer:** none

**Evidence:** CANNOT SOLVE: explicitly 'according to the passage', source passage not present, correctIndex null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `8c6e522d-dba0-4af5-9b84-e88550569542`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** n/a

**Prompt:** The word essentially in sentence one of the above reading passage implies

**Stored answer:** none

**Evidence:** CANNOT SOLVE: explicitly references 'the above reading passage' (a different passage, about human security) which is not present in the stored data, correctIndex null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `f70d4924-e125-4059-8188-0640024c4875`
**Subject/year:** aptitude 2022 (natural) · **Confidence:** n/a

**Prompt:** The word These in sentence two refers to

**Stored answer:** none

**Evidence:** CANNOT SOLVE: references 'sentence two' of the human-security passage, not present in stored data, correctIndex null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `9f8bf1f3-f4b7-4fa4-a6bc-ca99088b8c62`
**Subject/year:** english 2025 (social) · **Confidence:** n/a

**Prompt:** Which of the following words is closest in meaning to haggard as used in paragraph 1?

**Stored answer:** none

**Evidence:** FLAGGED: asks about the meaning of "haggard" as used in "paragraph 1," which is not included in the stored prompt at all. correctIndex is already null — no answer key was ever captured for this question.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `f79e8abb-4231-40aa-9a89-3f8c71dc2283`
**Subject/year:** english 2025 (social) · **Confidence:** n/a

**Prompt:** What does the expression 'I would rather report otherwise' indicate in the context it is used in paragraph 3?

**Stored answer:** none

**Evidence:** FLAGGED: asks about an expression's meaning "in paragraph 3," which is not included in the stored prompt. correctIndex is already null — unanswerable without the missing passage.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `44d41e38-9d67-42ca-90f8-d8665172a1c3`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** In Paragraph 2, the phrase these two individuals refers to __________.

**Stored answer:** [2] John Smith & the person in movie industry.

**Evidence:** CANNOT SOLVE: explicitly references 'Paragraph 2' of a passage not present in the stored data — the correct answer itself names specific people ('John Smith') that appear nowhere in the given prompt, confirming the passage is genuinely required and missing.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `ef20c6eb-917f-4e09-8350-957ed1bde79d`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** What is described as an absurd assumption about reading according to the passage?

**Stored answer:** [0] Ideas can be instantly absorbed and organized.

**Evidence:** CANNOT SOLVE: explicitly 'according to the passage', which is not present in the stored data — the four options are specific enough (abstract claims about reading) that I can't confidently pick without the source text.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `7c4d6fdc-0e74-4ef3-9366-d33ca327d947`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** Which of the ideas is used as evidence for your answer to question number 26?

**Stored answer:** [3] Line 7-9 (For we ... greater than our own.)

**Evidence:** CANNOT SOLVE: references specific numbered lines of a passage not present in the stored data, and depends on 'question number 26' which also isn't available here.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `cb55771d-8659-436e-8395-c095ee27af09`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** Why does the author emphasize the act of reflection?

**Stored answer:** [2] To complete the reading process.

**Evidence:** CANNOT SOLVE: depends on a specific author's argument in a passage not present in the stored data.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `891f7a4d-9888-4556-b7e8-b50765347c5d`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** Which of the ideas is used as evidence for your answer to question number 28?

**Stored answer:** [3] Line 12 (Reading without... ridiculous.)

**Evidence:** CANNOT SOLVE: references specific numbered lines of a passage not present in the stored data, same gap as the other 'evidence' questions in this reading set.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `52039d6e-13dd-46f1-8edc-9a847c55dcbf`
**Subject/year:** english 2025 (natural) · **Confidence:** n/a

**Prompt:** Which of the following words is closest in meaning to haggard as used in paragraph 1?

**Stored answer:** none

**Evidence:** FLAGGED: References "paragraph 1," which is not present in the stored prompt, and correctIndex is null (no answer key in source). Unanswerable without the missing passage.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `090525cd-dbec-4190-b115-000650fa015f`
**Subject/year:** english 2025 (natural) · **Confidence:** n/a

**Prompt:** What does the expression 'I would rather report otherwise' indicate in the context it is used in paragraph 3?

**Stored answer:** none

**Evidence:** FLAGGED: References "paragraph 3," which is not present in the stored prompt, and correctIndex is null (no answer key in source). Unanswerable without the missing passage.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `a19e9cf8-baf0-49ed-9686-aa8dd967ab6f`
**Subject/year:** biology 2025 (natural) · **Confidence:** n/a

**Prompt:** Which labeled part is responsible for controlling the diameter of the pupil according to the light source?

**Stored answer:** [2] III

**Evidence:** FLAGGED: references a labeled anatomical diagram (options are just 'I', 'II', 'III', 'IV') that isn't present anywhere in the stored prompt or options data. Unanswerable without the missing image — same structural gap other forks found in English/Aptitude reading-comprehension questions, here affecting a labeled-diagram biology question instead.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

## Unresolvable — referenced diagram/image/chart is missing (16)

### `e5918d01-ee66-4839-b71d-2dcd1373e3a4`
**Subject/year:** aptitude 2025 (natural) · **Confidence:** n/a

**Prompt:** How many triangles are there in the diagram?

**Stored answer:** none

**Evidence:** CANNOT SOLVE: references a geometric diagram/image not present in the stored data (text-only), and correctIndex is null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `760c864f-9748-4f74-b108-b861c3403328`
**Subject/year:** aptitude 2025 (natural) · **Confidence:** n/a

**Prompt:** How many days did the student study less than 8 hours?

**Stored answer:** none

**Evidence:** CANNOT SOLVE: references a data table/chart of a student's study hours that is not present in the stored data, and correctIndex is null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `ace4000e-00ab-4d37-bd78-a0f6f6172f05`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** Which time in hours is the median amount of the study?

**Stored answer:** none

**Evidence:** CANNOT SOLVE: references a study-hours data table/chart not present in the stored data, same missing-data gap as the other 'student study' questions in this set, and correctIndex is null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `e081fe2e-3ee8-4386-a356-45650dc84a37`
**Subject/year:** aptitude 2025 (social) · **Confidence:** n/a

**Prompt:** How many days did the student study more than the average amount of the study?

**Stored answer:** none

**Evidence:** CANNOT SOLVE: same missing study-hours data table as the other 'student study' questions in this set; correctIndex is null.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `10c6249f-cb67-45a9-8ea3-7ec60e0cf90a`
**Subject/year:** ? 2025 (natural) · **Confidence:** n/a

**Prompt:** Consider the molecular structure of COCl$_2$ shown below. What are the predicted bond angles Cl-C-O and Cl-C-Cl?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: correctIndex is null, and the question references a molecular structure image ("shown below") not present in the text data.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `6c558ace-bbc5-4973-9875-f319db9252c2`
**Subject/year:** ? 2025 (natural) · **Confidence:** n/a

**Prompt:** Consider the structure of an alcohol shown below. What type of an alcohol is it?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: correctIndex is null, and the question references a structural diagram ("shown below") not present in the text data.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `fcca4676-3a91-47b1-9aa9-4bfd525b7537`
**Subject/year:** ? 2025 (natural) · **Confidence:** n/a

**Prompt:** What is the IUPAC name of the following carboxylic acid?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: correctIndex is null, and the question references a compound structure image not present in the text data.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `06ab1d87-28a2-4099-bd1b-7c1f545053fc`
**Subject/year:** ? 2025 (natural) · **Confidence:** n/a

**Prompt:** What is the CORRECT IUPAC nomenclature of the following alkane?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: correctIndex is null, and the question references an alkane structure image not present in the text data.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `38b4e590-8da6-4275-a1db-28a4ee0ec593`
**Subject/year:** english 2025 (social) · **Confidence:** n/a

**Prompt:** The part indicated by number 1 is:

**Stored answer:** [1] salutation

**Evidence:** FLAGGED: references "the part indicated by number 1," implying a labeled diagram/letter-format image that is not present anywhere in the stored prompt or options. Unanswerable without the missing visual.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `8791ce51-d9e6-475e-8671-b876c37ca77d`
**Subject/year:** english 2025 (social) · **Confidence:** n/a

**Prompt:** The part indicated by number 2 is:

**Stored answer:** [3] body of the letter

**Evidence:** FLAGGED: same missing-diagram issue — references "number 2" on an image not present in the stored data.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `e9fde713-e66a-4420-be93-602359680f1c`
**Subject/year:** english 2025 (social) · **Confidence:** n/a

**Prompt:** The part indicated by number 3 is:

**Stored answer:** [1] closing statement

**Evidence:** FLAGGED: same missing-diagram issue — references "number 3" on an image not present in the stored data.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `88593347-6a51-4171-ba6b-2347955ca9d6`
**Subject/year:** mathematics 2025 (natural) · **Confidence:** n/a

**Prompt:** Consider the graph of a certain trigonometric function given below. Which one of the following functions represents the above graph for $-\frac{\pi}{2} \leq x \leq \frac{5\pi}{2}$?

**Stored answer:** none

**Evidence:** FLAGGED: the question asks which function "represents the above graph," but no graph or image is included in the stored prompt/options — unanswerable from text alone. correctIndex is also null, confirming no answer was ever captured for this version. Needs the original image re-attached.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `69dda446-b83d-4195-85dc-7f133553cfa1`
**Subject/year:** physics 2025 (natural) · **Confidence:** n/a

**Prompt:** Consider a circuit containing a diode and load resistor (R L ) connected to an AC voltage source. If initially, polarity of 'a' is positive while 'b' is negative,

**Stored answer:** none

**Evidence:** UNRESOLVABLE: no stored answer key (correctIndex null) and the diode's orientation relative to terminals a/b isn't specified in the text — needs the original circuit diagram.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `5e4ff825-8de6-48db-8a9a-2bbd49259407`
**Subject/year:** biology 2025 (natural) · **Confidence:** n/a

**Prompt:** Consider the following structure of the human heart. In the above diagram, which part is used for forcing oxygenated blood out of the heart and around the body?

**Stored answer:** [2] III

**Evidence:** FLAGGED: references a labeled heart-structure diagram (options are just 'I', 'II', 'III', 'IV') that isn't present anywhere in the stored prompt or options data. Unanswerable without the missing image — same missing-diagram gap as the pupil-diameter question in this same batch.

**Recommended action:** A stored answer exists, but it can't be confirmed without the missing passage/diagram — source it before trusting the stored key.

### `df92242e-fb92-45d8-bade-7b02afbb3970`
**Subject/year:** physics 2025 (natural) · **Confidence:** n/a

**Prompt:** The velocity-time graph of an object moving in a straight line is shown. What is the magnitude of the total displacement covered by the object in the time interval of seconds?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: explicitly references a velocity-time graph that is not present anywhere in the stored prompt/options data, and no answer key was captured either. Needs the original image.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

### `f63c372f-bf12-440c-917c-2a58eb10c1a9`
**Subject/year:** physics 2025 (natural) · **Confidence:** n/a

**Prompt:** Four resistors are connected to a voltage source. Which one of the following is correct about the circuit?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: asks about a specific circuit diagram that is not present anywhere in the stored prompt/options data, and no answer key was captured either.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.

## Unresolvable — other missing source material (1)

### `d1a0f12b-2c15-4090-a0c4-119609a70d50`
**Subject/year:** physics 2025 (natural) · **Confidence:** n/a

**Prompt:** Four point masses m₁ = 4 kg, m₂ = 1 kg, m₅ = 3 kg, and m₄ = 5 kg are attached to a massless rod which lays on the x-axis. How much is the moment of inertia of the system about the y-axis?

**Stored answer:** none

**Evidence:** UNRESOLVABLE: the actual positions of the four masses along the rod are never given in the stored prompt (only their masses), and there's no stored answer key either — moment of inertia about the y-axis needs each mass's x-distance from the axis.

**Recommended action:** Source the missing passage/diagram/answer key before this question can be explained or verified.
