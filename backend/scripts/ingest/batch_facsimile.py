#!/usr/bin/env python3
"""Render and import facsimile editions for every published book.

For each (subject, grade, kind) backed by a manifest:
  1. renderFacsimile.ts  -> output/facsimile-<key>.json + page JPEGs
  2. ingest:import       -> replaces that book's sections with image blocks

Resumable: the renderer reuses existing page JPEGs (>10 KB), and the importer is
idempotent (scoped delete + create). State is written after each book, so a
failed run can be restarted without redoing finished work.

Subject aliases are mapped to the DB slugs, otherwise imports fail on manifests
named citizenship-education / english-for-ethiopia / ict.
"""
import glob, json, os, re, subprocess, sys, time

BACKEND = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.abspath(os.path.join(BACKEND, "..", ".."))
ROOT = os.path.abspath(os.path.join(BACKEND, ".."))
LOGDIR = os.path.join(ROOT, ".qwen", "tmp")
LOG = os.path.join(LOGDIR, "facsimile-batch.log")
STATE = os.path.join(LOGDIR, "facsimile-batch-state.json")

ALIASES = {
    "citizenship-education": "civics",
    "english-for-ethiopia": "english",
    "information-communication-technology-ict": "information-technology",
    "maths": "mathematics",
    "math": "mathematics",
    "health-and-physical-education": "hpe",
}


def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG, "a") as fh:
        fh.write(line + "\n")


def db_subjects():
    env = dict(os.environ)
    env_text = open(os.path.join(BACKEND, ".env")).read()
    m = re.search(r"DATABASE_URL=.*://[^:]+:([^@]+)@", env_text)
    env["PGPASSWORD"] = m.group(1) if m else ""
    out = subprocess.run(
        ["psql", "-h", "localhost", "-p", "5434", "-U", "compass", "-d", "compass_dev",
         "-tAc", "SELECT slug FROM subjects"],
        capture_output=True, text=True, env=env,
    ).stdout
    return {s.strip() for s in out.splitlines() if s.strip()}


def collect(subs):
    """Pick one manifest per (subject, grade, kind); prefer non '-old'."""
    best = {}
    skipped = []
    for mf in sorted(glob.glob(os.path.join(BACKEND, "scripts/ingest/manifests/*.json"))):
        try:
            m = json.load(open(mf))
        except Exception:
            continue
        raw = m.get("subject")
        if not raw:
            continue
        subj = ALIASES.get(raw, raw)
        grade = m.get("grade")
        kind = m.get("kind", "textbook")
        pdf = m.get("pdfPath", "")
        if subj not in subs:
            skipped.append((os.path.basename(mf), f"no DB subject '{subj}'"))
            continue
        if not pdf or not os.path.exists(os.path.join(BACKEND, pdf)):
            skipped.append((os.path.basename(mf), "source PDF missing"))
            continue
        if not m.get("sections"):
            skipped.append((os.path.basename(mf), "no sections"))
            continue
        key = (subj, grade, kind)
        score = 0 if "-old" in os.path.basename(mf) else 1
        if key not in best or score > best[key][0]:
            best[key] = (score, mf)
    return {k: v[1] for k, v in best.items()}, skipped


def book_key(subj, grade, kind):
    return f"{subj}-g{grade}" + ("-teacher-guide" if kind == "teacher_guide" else "")


def main():
    os.makedirs(LOGDIR, exist_ok=True)
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    subs = db_subjects()
    work, skipped = collect(subs)
    log(f"facsimile batch: {len(work)} book(s), {len(skipped)} manifest(s) skipped")
    for name, reason in skipped:
        log(f"  skip {name}: {reason}")

    for i, ((subj, grade, kind), mf) in enumerate(sorted(work.items()), 1):
        key = book_key(subj, grade, kind)
        if state.get(key, {}).get("status") == "imported":
            log(f"[{i}/{len(work)}] skip {key} — already imported")
            continue
        out = os.path.join(BACKEND, "scripts/ingest/output", f"facsimile-{key}.json")
        log(f"[{i}/{len(work)}] {key}  <- {os.path.basename(mf)}")
        started = time.time()
        r = subprocess.run(
            ["npx", "tsx", "scripts/ingest/renderFacsimile.ts",
             "--manifest", mf, "--out", out, "--dpi", "150"],
            cwd=BACKEND, capture_output=True, text=True,
        )
        tail = (r.stdout + r.stderr).strip().splitlines()
        for line in tail[-2:]:
            log(f"    {line.strip()}")
        if r.returncode != 0 or not os.path.exists(out):
            state[key] = {"status": "render_failed", "manifest": mf}
            json.dump(state, open(STATE, "w"), indent=2)
            log(f"  RESULT {key}: RENDER FAILED")
            continue

        imp = subprocess.run(
            ["npm", "run", "ingest:import", "--", "--textbook", out, "--subject", subj],
            cwd=BACKEND, capture_output=True, text=True,
        )
        tail = (imp.stdout + imp.stderr).strip().splitlines()
        for line in tail[-2:]:
            log(f"    {line.strip()}")
        ok = imp.returncode == 0 and "Imported" in (imp.stdout + imp.stderr)
        state[key] = {
            "status": "imported" if ok else "import_failed",
            "manifest": mf,
            "output": out,
            "seconds": round(time.time() - started, 1),
        }
        json.dump(state, open(STATE, "w"), indent=2)
        log(f"  RESULT {key}: {'IMPORTED' if ok else 'IMPORT FAILED'} ({state[key]['seconds']}s)")

    counts = {}
    for v in state.values():
        counts[v.get("status", "?")] = counts.get(v.get("status", "?"), 0) + 1
    log(f"=== batch state: {counts} ===")


if __name__ == "__main__":
    main()
