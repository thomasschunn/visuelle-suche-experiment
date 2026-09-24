"""Deterministic, offline symbol assignments. Export valid complete plans; block experiment start until all four validate.

python scripts/build_predictability.py [--seed INTEGER] [--check]
python scripts/build_predictability.py --audit-candidates  # read-only, unconfirmed mapping
"""
import argparse
import copy
import csv
from functools import lru_cache
import hashlib
import io
import itertools
import json
import os
from pathlib import Path
import sys
import tempfile

import build_trial_specs as source

DEFAULT_SEED = 20260909
ALGORITHM_VERSION = "predictability-v1"
COLORS = {"#FF8C00": "orange", "#0064FF": "blue"}
CATEGORIES = tuple(itertools.product(("orange", "blue"), ("small", "large"), ("L", "O", "T", "Q")))


class ValidationError(ValueError):
    pass


def check(condition, message):
    if not condition:
        raise ValidationError(message)


def label(trial):
    return f"{trial['phase']} trial {trial['trial_index']}"


def read_symbols(trial, table_bytes):
    rows = list(csv.DictReader(io.StringIO(table_bytes.decode("utf-8-sig"), newline="")))
    result = []
    for index, row in enumerate(rows, 1):
        check(row["shape"] in ("L", "O", "T", "Q"), f"{label(trial)}: unknown shape")
        check(row["color_hex"] in COLORS, f"{label(trial)}: unknown color")
        check(row["is_small"] in ("True", "False", "true", "false", "1", "0"), f"{label(trial)}: invalid is_small")
        result.append({"symbol_id": f"{trial['stimulus_id']}_s{index:03d}", "source_csv_row": index + 1,
                       "shape": row["shape"], "color": COLORS[row["color_hex"]],
                       "size": "small" if row["is_small"] in ("True", "true", "1") else "large"})
    return result


def error_sets(trial):
    symbols = {s["symbol_id"]: s for s in trial["symbols"]}
    check(len(symbols) == len(trial["symbols"]), f"{label(trial)}: duplicate symbol IDs")
    marked = trial["ai_marked_symbol_ids"]
    check(len(marked) == len(set(marked)) and set(marked) <= symbols.keys(), f"{label(trial)}: invalid marked IDs")
    targets = {key for key, s in symbols.items() if s["shape"] in ("L", "O")}
    misses, fas = targets - set(marked), set(marked) - targets
    for key, expected in (("miss_symbol_ids", misses), ("false_alarm_symbol_ids", fas)):
        ids = trial[key]
        check(len(ids) == len(set(ids)) and set(ids) == expected, f"{label(trial)}: {key} disagrees with marked symbols")
    errors = trial["error_symbol_ids"]
    check(len(errors) == len(set(errors)) and set(errors) == misses | fas, f"{label(trial)}: invalid sequential error list")
    return symbols, misses, fas


def validateMissCount(trial, excel_trial):
    _, misses, _ = error_sets(trial)
    check(trial["specified_misses"] == excel_trial["specified_misses"] == len(misses), f"{label(trial)}: miss count differs from Excel")


def validateFalseAlarmCount(trial, excel_trial):
    _, _, fas = error_sets(trial)
    check(trial["specified_false_alarms"] == excel_trial["specified_false_alarms"] == len(fas), f"{label(trial)}: false alarm count differs from Excel")


def validateAgentVerdict(trial, excel_trial):
    check(trial["agent_verdict"] == excel_trial["agent_verdict"], f"{label(trial)}: verdict differs from Excel")


def validateHighPredictability(trial):
    symbols, misses, fas = error_sets(trial)
    check(all(symbols[key]["color"] == "orange" for key in misses | fas), f"{label(trial)}: HIGH error on non-orange symbol")
    actual = tuple(sum(category(symbols[key]) == i for key in misses | fas) for i in range(len(CATEGORIES)))
    check(imbalance(actual, "high") == min(imbalance(counts, "high") for counts in feasible_counts(trial, "high")),
          f"{label(trial)}: HIGH size/shape balance is not optimal for available symbols")


def validateLowPredictability(trials):
    """Validate a trial list, including error runs across trial and phase boundaries."""
    previous = {key: [] for key in ("color", "size", "shape")}
    for trial in trials:
        symbols, _, _ = error_sets(trial)
        for symbol_id in trial["error_symbol_ids"]:
            for key, history in previous.items():
                value = symbols[symbol_id][key]
                check(not (len(history) == 2 and history[0] == history[1] == value),
                      f"{label(trial)}: LOW run exceeds two for {key}={value}")
                history.append(value)
                if len(history) > 2:
                    del history[0]
    if trials:
        seed = trials[0]["seed"]
        check(all(trial["seed"] == seed for trial in trials), "LOW plan contains inconsistent seeds")
        # Replay the exact constrained optimization, not just its color/run checks.
        expected = allocate(trials, "low", seed)
        for actual, optimum in zip(trials, expected):
            check(actual["error_symbol_ids"] == optimum["error_symbol_ids"],
                  f"{label(actual)}: LOW assignment differs from deterministic balanced allocation")


def category(symbol):
    return CATEGORIES.index((symbol["color"], symbol["size"], symbol["shape"]))


def vectors(capacities, total):
    """All feasible counts per category, not heuristic random retries."""
    if not capacities:
        if total == 0:
            yield ()
        return
    minimum = max(0, total - sum(capacities[1:]))
    for count in range(minimum, min(capacities[0], total) + 1):
        for tail in vectors(capacities[1:], total - count):
            yield (count,) + tail


def imbalance(counts, mode):
    sums = lambda axis, value: sum(n for i, n in enumerate(counts) if CATEGORIES[i][axis] == value)
    score = (sums(1, "small") - sums(1, "large")) ** 2
    score += (sums(2, "L") - sums(2, "O")) ** 2 + (sums(2, "T") - sums(2, "Q")) ** 2
    if mode == "low":
        score += (sums(0, "orange") - sums(0, "blue")) ** 2
    return score


def rank(seed, *parts):
    return hashlib.sha256(json.dumps([seed, *parts], separators=(",", ":")).encode()).hexdigest()


def buckets_for(trial, mode):
    buckets = [[] for _ in CATEGORIES]
    for symbol in trial["symbols"]:
        if mode == "low" or symbol["color"] == "orange":
            buckets[category(symbol)].append(symbol)
    return buckets


def feasible_counts(trial, mode):
    buckets = buckets_for(trial, mode)
    targets = [i for i, cat in enumerate(CATEGORIES) if cat[2] in ("L", "O")]
    others = [i for i, cat in enumerate(CATEGORIES) if cat[2] not in ("L", "O")]
    m, f = trial["specified_misses"], trial["specified_false_alarms"]
    for indices, needed, name in ((targets, m, "misses"), (others, f, "false alarms")):
        available = sum(len(buckets[i]) for i in indices)
        check(needed <= available, f"{label(trial)}: {mode.upper()} requires {needed} {name}, but only {available} {'orange ' if mode == 'high' else ''}eligible symbols exist")
    result = []
    for misses in vectors(tuple(len(buckets[i]) for i in targets), m):
        for fas in vectors(tuple(len(buckets[i]) for i in others), f):
            counts = [0] * len(CATEGORIES)
            for i, n in zip(targets + others, misses + fas):
                counts[i] = n
            result.append(tuple(counts))
    return result


def allowed(last, next_category):
    return len(last) < 2 or all(not (CATEGORIES[last[0]][axis] == CATEGORIES[last[1]][axis] == CATEGORIES[next_category][axis]) for axis in range(3))


def schedules(counts, last, seed):
    """One schedule for every attainable final suffix; suffix controls later feasibility."""
    @lru_cache(None)
    def visit(remaining, suffix):
        if not any(remaining):
            return {suffix: ()}
        result = {}
        order = sorted((i for i, n in enumerate(remaining) if n), key=lambda i: rank(seed, i))
        for i in order:
            if not allowed(suffix, i):
                continue
            rest = list(remaining)
            rest[i] -= 1
            for end, tail in visit(tuple(rest), (suffix + (i,))[-2:]).items():
                result.setdefault(end, (i,) + tail)
        return result
    return visit(counts, last)


def allocate(trials, mode, seed):
    all_counts = [feasible_counts(t, mode) for t in trials]
    failed = set()

    def search(index, suffix, cumulative):
        if index == len(trials):
            return []
        state = (index, suffix)
        if state in failed:
            return None
        candidates = sorted(all_counts[index], key=lambda c: (imbalance(c, mode),
                            imbalance(tuple(a + b for a, b in zip(cumulative, c)), mode), rank(seed, mode, index, c)))
        for counts in candidates:
            orders = schedules(counts, suffix, seed) if mode == "low" else {(): tuple(i for i, n in enumerate(counts) for _ in range(n))}
            for end, sequence in orders.items():
                tail = search(index + 1, end, tuple(a + b for a, b in zip(cumulative, counts)))
                if tail is not None:
                    return [(counts, sequence)] + tail
        failed.add(state)
        return None

    allocation = search(0, (), (0,) * len(CATEGORIES))
    check(allocation is not None, f"{mode.upper()}: no exact error assignment satisfies the sequential constraints")
    result = []
    for trial, (counts, sequence) in zip(trials, allocation):
        record = copy.deepcopy(trial)
        buckets = buckets_for(trial, mode)
        for bucket in buckets:
            bucket.sort(key=lambda s: rank(seed, mode, trial["stimulus_id"], s["symbol_id"]))
        chosen = [iter(bucket[:n]) for bucket, n in zip(buckets, counts)]
        errors = [next(chosen[i]) for i in sequence]
        misses = [s["symbol_id"] for s in errors if s["shape"] in ("L", "O")]
        fas = [s["symbol_id"] for s in errors if s["shape"] not in ("L", "O")]
        marked = [s["symbol_id"] for s in trial["symbols"] if (s["shape"] in ("L", "O") and s["symbol_id"] not in misses) or s["symbol_id"] in fas]
        record.update(seed=seed, preprocessing_algorithm=ALGORITHM_VERSION, predictability_condition=mode,
                      ai_marked_symbol_ids=marked, miss_symbol_ids=misses, false_alarm_symbol_ids=fas,
                      error_symbol_ids=[s["symbol_id"] for s in errors], balance_score=imbalance(counts, mode))
        result.append(record)
    return result


def enrich(outputs):
    trials = json.loads(outputs["data/generated/pre_trials.json"]) + json.loads(outputs["data/generated/main_trials.json"])
    for trial in trials:
        trial["symbols"] = read_symbols(trial, outputs[trial["symbol_table_path"]])
    return trials


def validate_plan(plan, excel_trials):
    check(len(plan) == len(excel_trials), "Incorrect plan length")
    check(len({trial['predictability_condition'] for trial in plan}) <= 1 and
          all(trial['predictability_condition'] in ('low', 'high') for trial in plan), "Invalid/mixed predictability modes")
    for trial, excel in zip(plan, excel_trials):
        check(trial["stimulus_id"] == excel["stimulus_id"] and trial["symbols"] == excel["symbols"], "Wrong source symbols/trial order")
        validateMissCount(trial, excel)
        validateFalseAlarmCount(trial, excel)
        validateAgentVerdict(trial, excel)
        if trial["predictability_condition"] == "high":
            validateHighPredictability(trial)
    if plan and plan[0]["predictability_condition"] == "low":
        validateLowPredictability(plan)


def build_plans(outputs, seed=DEFAULT_SEED, allow_valid=False):
    trials = enrich(outputs)
    check(len(trials) == 40 and [t["phase"] for t in trials] == ["ai_practice"] * 10 + ["main_task"] * 30,
          "Condition plan must contain exactly 10 AI practice followed by 30 main trials")
    errors, modes = [], {}
    for mode in ("low", "high"):
        # Report every capacity problem before attempting the mode's assignment.
        problems = []
        for trial in trials:
            try:
                feasible_counts(trial, mode)
            except ValidationError as error:
                problems.append(str(error))
        if problems:
            # Validate the other HIGH trials as well; never export this incomplete plan.
            if mode == "high":
                feasible = []
                for trial in trials:
                    try:
                        feasible_counts(trial, mode)
                        feasible.append(trial)
                    except ValidationError:
                        pass
                valid_part = allocate(feasible, mode, seed)
                validate_plan(valid_part, feasible)
            errors.extend(problems)
            continue
        try:
            candidate = allocate(trials, mode, seed)
            validate_plan(candidate, trials)
            modes[mode] = candidate
        except ValidationError as error:
            errors.append(str(error))
    if not allow_valid:
        check(not errors, "\n".join(errors))
    for low, high in zip(modes.get("low", []), modes.get("high", [])):
        check(len(low["miss_symbol_ids"]) == len(high["miss_symbol_ids"]) and
              len(low["false_alarm_symbol_ids"]) == len(high["false_alarm_symbol_ids"]) and
              low["agent_verdict"] == high["agent_verdict"], "High/low Excel parity violated")
    result = {}
    for version, customization, mode in ((1, "customization", "low"), (2, "customization", "high"),
                                         (3, "standard", "low"), (4, "standard", "high")):
        if mode not in modes:
            continue
        result[f"data/generated/conditions/v{version}_trials.json"] = source.encoded({
            "experiment_version": version, "customization_condition": customization,
            "predictability_condition": mode, "seed": seed, "preprocessing_algorithm": ALGORITHM_VERSION,
            "error_sequence_scope": "AI practice followed by main task; no reset at trial or phase boundaries",
            "trials": modes[mode]})
    result["data/generated/conditions/validation_status.json"] = source.encoded({
        "experiment_start_allowed": not errors,
        "seed": seed,
        "valid_versions": [v for v, mode in ((1, "low"), (2, "high"), (3, "low"), (4, "high")) if mode in modes],
        "validation_errors": errors})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--audit-candidates", action="store_true")
    args = parser.parse_args()
    try:
        if args.audit_candidates:
            mapping = json.loads((source.ROOT / "scripts/source_asset_mapping.json").read_text())
            for candidate in (49, 50):
                review = copy.deepcopy(mapping)
                review["status"] = "confirmed"  # In-memory audit hypothesis only; never written/approved.
                review.pop("exceptions", None)  # Historical candidate audit, not the production mapping.
                review["PostPO"][23] = f"Post_PO_Images/visual_search_data({candidate}).zip"
                try:
                    build_plans(source.build(mapping=review), args.seed)
                    print(f"Candidate {candidate}: valid in memory; mapping still requires confirmation")
                except ValidationError as error:
                    print(f"Candidate {candidate} VALIDATION ERROR: {error}")
            return 1  # An audit of unconfirmed sources never establishes a successful build.
        outputs = source.build()
        plans = build_plans(outputs, args.seed, allow_valid=True)
        status_path = "data/generated/conditions/validation_status.json"
        status = json.loads(plans[status_path])
        # Write the global gate first: even existing LOW plans cannot start a blocked experiment.
        outputs = {status_path: plans.pop(status_path), **outputs, **plans}
        for relative, data in outputs.items():
            path = source.ROOT / relative
            if args.check:
                check(path.is_file() and path.read_bytes() == data, f"Stale/missing output: {relative}")
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as tmp:
                    tmp.write(data)
                    name = tmp.name
                os.replace(name, path)
        if not status["experiment_start_allowed"]:
            print(f"Valid condition plans: {status['valid_versions']}; experiment start BLOCKED.")
            raise ValidationError("\n".join(status["validation_errors"]))
        print("Validated all four condition plans, 10 AI practice + 30 main trials each.")
        return 0
    except (source.SourceError, ValidationError, OSError, KeyError, ValueError) as error:
        print(f"BUILD FAILED: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
