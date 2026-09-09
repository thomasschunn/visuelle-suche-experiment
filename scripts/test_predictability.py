"""Exact constraints, deterministic preprocessing and actual-source failure tests."""
import copy
import json
import unittest
from unittest.mock import patch

import build_trial_specs as source
import build_predictability as pred


def fixture(index=1, misses=2, fas=2):
    symbols = []
    for color, size, shape in pred.CATEGORIES:
        for n in range(2):
            symbols.append({"symbol_id": f"t{index}_{color}_{size}_{shape}_{n}", "shape": shape,
                            "color": color, "size": size, "source_csv_row": len(symbols) + 2})
    return {"phase": "ai_practice", "trial_index": index, "stimulus_id": f"test_{index}",
            "specified_misses": misses, "specified_false_alarms": fas,
            "agent_verdict": "Pass", "symbols": symbols}


class PredictabilityTests(unittest.TestCase):
    def test_failed_validator_never_exports_rejected_mode(self):
        originals = [fixture(i, 1, 1) for i in range(1, 41)]
        for i, trial in enumerate(originals):
            trial['phase'] = 'ai_practice' if i < 10 else 'main_task'
            trial['trial_index'] = i + 1 if i < 10 else i - 9
        original_validator = pred.validate_plan
        def reject_low(plan, sources):
            if plan[0]['predictability_condition'] == 'low':
                raise pred.ValidationError('Injected validation failure')
            original_validator(plan, sources)
        with patch.object(pred, 'enrich', return_value=originals), patch.object(pred, 'validate_plan', side_effect=reject_low):
            outputs = pred.build_plans({}, allow_valid=True)
        self.assertNotIn('data/generated/conditions/v1_trials.json', outputs)
        self.assertNotIn('data/generated/conditions/v3_trials.json', outputs)
        self.assertFalse(json.loads(outputs['data/generated/conditions/validation_status.json'])['experiment_start_allowed'])

    def test_actual_high_low_parity_for_all_39_feasible_trials(self):
        originals = pred.enrich(source.build())
        low = pred.allocate(originals, 'low', pred.DEFAULT_SEED)
        feasible = [t for t in originals if not (t['phase'] == 'main_task' and t['trial_index'] == 28)]
        high = pred.allocate(feasible, 'high', pred.DEFAULT_SEED)
        pred.validate_plan(high, feasible)
        by_id = {t['stimulus_id']: t for t in low}
        for trial in high:
            other = by_id[trial['stimulus_id']]
            self.assertEqual(len(trial['miss_symbol_ids']), len(other['miss_symbol_ids']))
            self.assertEqual(len(trial['false_alarm_symbol_ids']), len(other['false_alarm_symbol_ids']))
            self.assertEqual(trial['agent_verdict'], other['agent_verdict'])

    def test_valid_partial_exports_keep_global_start_blocked(self):
        sources = source.build()
        outputs = pred.build_plans(sources, allow_valid=True)
        self.assertEqual(outputs, pred.build_plans(sources, allow_valid=True))
        status = json.loads(outputs['data/generated/conditions/validation_status.json'])
        self.assertFalse(status['experiment_start_allowed'])
        self.assertEqual(status['valid_versions'], [1, 3])
        self.assertEqual(len(outputs), 3)
        self.assertIn('main_task trial 28', status['validation_errors'][0])
        for version in (1, 3):
            plan = json.loads(outputs[f'data/generated/conditions/v{version}_trials.json'])
            self.assertEqual(len(plan['trials']), 40)
            pred.validate_plan(plan['trials'], pred.enrich(sources))

    def test_all_validators_and_determinism(self):
        originals = [fixture(i) for i in range(1, 5)]
        modes = {}
        for mode in ("low", "high"):
            modes[mode] = pred.allocate(originals, mode, pred.DEFAULT_SEED)
            self.assertEqual(modes[mode], pred.allocate(originals, mode, pred.DEFAULT_SEED))
            pred.validate_plan(modes[mode], originals)
            for trial in modes[mode]:
                self.assertEqual(trial["balance_score"], 0)
                self.assertEqual(trial["seed"], pred.DEFAULT_SEED)
                self.assertEqual(len(trial["miss_symbol_ids"]), 2)
                self.assertEqual(len(trial["false_alarm_symbol_ids"]), 2)
        for low, high in zip(modes["low"], modes["high"]):
            self.assertEqual(low["agent_verdict"], high["agent_verdict"])
        self.assertNotEqual(modes["low"], pred.allocate(originals, "low", pred.DEFAULT_SEED + 1))

    def test_no_errors_marks_all_defects(self):
        original = fixture(misses=0, fas=0)
        for mode in ("low", "high"):
            trial = pred.allocate([original], mode, 1)[0]
            pred.validate_plan([trial], [original])
            self.assertEqual(trial["error_symbol_ids"], [])
            self.assertEqual(len(trial["ai_marked_symbol_ids"]), 16)

    def test_actual_candidate_audits_low_passes_high_fails_trial_28(self):
        mapping = json.loads((source.ROOT / "scripts/source_asset_mapping.json").read_text())
        for candidate in (49, 50):
            with self.subTest(candidate=candidate):
                audit = copy.deepcopy(mapping)
                audit["status"] = "confirmed"  # Hypothesis only, never persisted.
                audit.pop("exceptions", None)
                audit["PostPO"][23] = f"Post_PO_Images/visual_search_data({candidate}).zip"
                outputs = source.build(mapping=audit)
                trials = pred.enrich(outputs)
                self.assertEqual(len(trials), 40)
                low = pred.allocate(trials, "low", pred.DEFAULT_SEED)
                pred.validate_plan(low, trials)
                self.assertEqual(low, pred.allocate(trials, "low", pred.DEFAULT_SEED))
                trial28 = trials[10 + 27]
                self.assertEqual(trial28["specified_misses"], 2)
                self.assertEqual(sum(s["color"] == "orange" and s["shape"] in ("L", "O") for s in trial28["symbols"]), 1)
                # Every other HIGH trial runs all validators, but no incomplete plan is exported.
                feasible = [t for t in trials if t is not trial28]
                high = pred.allocate(feasible, "high", pred.DEFAULT_SEED)
                pred.validate_plan(high, feasible)
                with self.assertRaisesRegex(pred.ValidationError, "trial 28.*requires 2 misses.*only 1 orange"):
                    pred.build_plans(outputs)

    def test_illegal_runs_for_each_feature_and_across_trial_boundaries(self):
        # Use real category properties; the constructed error lists are deliberately invalid.
        for feature, value in (("color", "orange"), ("size", "small"), ("shape", "L")):
            original = fixture(misses=3, fas=0)
            symbols = [s for s in original["symbols"] if s["shape"] in ("L", "O") and s[feature] == value][:3]
            ids = [s["symbol_id"] for s in symbols]
            trial = copy.deepcopy(original)
            trial.update(ai_marked_symbol_ids=[s["symbol_id"] for s in trial["symbols"] if s["shape"] in ("L", "O") and s["symbol_id"] not in ids],
                         miss_symbol_ids=ids, false_alarm_symbol_ids=[], error_symbol_ids=ids)
            with self.assertRaises(pred.ValidationError):
                pred.validateLowPredictability([trial])
        # One all-orange miss on each of three trials must also fail (no per-trial reset).
        trials = []
        for i in range(3):
            trial = pred.allocate([fixture(i, 1, 0)], "high", 2)[0]
            trials.append(trial)
        with self.assertRaisesRegex(pred.ValidationError, "color=orange"):
            pred.validateLowPredictability(trials)

    def test_mathematical_infeasibility_is_not_silently_relaxed(self):
        original = fixture(misses=3, fas=0)
        original["symbols"] = [s for s in original["symbols"] if s["color"] == "blue" and s["shape"] == "L"]
        with self.assertRaisesRegex(pred.ValidationError, "HIGH requires"):
            pred.allocate([original], "high", 1)
        with self.assertRaisesRegex(pred.ValidationError, "no exact error assignment"):
            pred.allocate([original], "low", 1)

    def test_bad_ids_counts_and_verdict_are_rejected(self):
        original = fixture()
        good = pred.allocate([original], "low", 1)[0]
        bad = copy.deepcopy(good)
        bad["ai_marked_symbol_ids"].append("unknown")
        with self.assertRaises(pred.ValidationError):
            pred.validateMissCount(bad, original)
        bad = copy.deepcopy(good)
        bad["specified_false_alarms"] += 1
        with self.assertRaises(pred.ValidationError):
            pred.validateFalseAlarmCount(bad, original)
        bad = copy.deepcopy(good)
        bad["agent_verdict"] = "Reject"
        with self.assertRaises(pred.ValidationError):
            pred.validateAgentVerdict(bad, original)
        bad = copy.deepcopy(good)
        bad["error_symbol_ids"].append(bad["error_symbol_ids"][0])
        with self.assertRaises(pred.ValidationError):
            pred.validateLowPredictability([bad])

    def test_high_rejects_non_orange_errors(self):
        original = fixture()
        low = pred.allocate([original], "low", 1)[0]
        with self.assertRaisesRegex(pred.ValidationError, "non-orange"):
            pred.validateHighPredictability(low)

    def test_four_condition_plans_on_feasible_test_data(self):
        originals = [fixture(i, 1, 1) for i in range(1, 41)]
        for i, trial in enumerate(originals):
            trial["phase"] = "ai_practice" if i < 10 else "main_task"
            trial["trial_index"] = i + 1 if i < 10 else i - 9
        with patch.object(pred, "enrich", return_value=originals):
            outputs = pred.build_plans({})
        self.assertEqual(len(outputs), 5)
        self.assertTrue(json.loads(outputs['data/generated/conditions/validation_status.json'])['experiment_start_allowed'])
        plans = [json.loads(outputs[f"data/generated/conditions/v{v}_trials.json"]) for v in range(1, 5)]
        self.assertEqual([p["customization_condition"] for p in plans], ["customization", "customization", "standard", "standard"])
        self.assertEqual([p["predictability_condition"] for p in plans], ["low", "high", "low", "high"])
        self.assertEqual(plans[0]["trials"], plans[2]["trials"])
        self.assertEqual(plans[1]["trials"], plans[3]["trials"])
        self.assertTrue(all(len(p["trials"]) == 40 for p in plans))


if __name__ == "__main__":
    unittest.main()
