"""Read-only source tests; hypothetical alternatives are built in memory, never exported."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import build_trial_specs as builder


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.mapping = json.loads((builder.ROOT / "scripts/source_asset_mapping.json").read_text())

    def review_mapping(self, candidate=49):
        mapping = copy.deepcopy(self.mapping)
        mapping["status"] = "confirmed"
        mapping["PostPO"][23] = f"Post_PO_Images/visual_search_data({candidate}).zip"
        mapping.pop("exceptions", None)  # Historical hypothetical alternatives only.
        return mapping

    def test_confirmed_exception_and_real_build(self):
        self.assertEqual(self.mapping["status"], "confirmed")
        outputs = builder.build()
        main = json.loads(outputs["data/generated/main_trials.json"])
        self.assertEqual(main[23]["source"]["asset"], "Post_PO_Images/visual_search_data(50).zip")
        self.assertTrue(all("(49).zip" not in t["source"]["asset"] for t in main))
        bad = copy.deepcopy(self.mapping)
        bad["PostPO"][23] = "Post_PO_Images/visual_search_data(49).zip"
        with self.assertRaisesRegex(builder.SourceError, "exception"):
            builder.build(mapping=bad)

    def test_pending_mapping_blocks_build(self):
        mapping = self.review_mapping()
        mapping["status"] = "pending_user_confirmation"
        with self.assertRaisesRegex(builder.SourceError, "pending"):
            builder.build(mapping=mapping)

    def test_both_trial_24_candidates_fit_but_are_different(self):
        a = builder.read_asset(builder.ROOT, "Post_PO_Images/visual_search_data(49).zip")
        b = builder.read_asset(builder.ROOT, "Post_PO_Images/visual_search_data(50).zip")
        self.assertEqual(a[2], b[2])
        self.assertNotEqual(a[0], b[0])
        self.assertNotEqual(a[1], b[1])

    def test_counts_exact_values_and_reproducibility(self):
        for candidate in [49, 50]:
            with self.subTest(candidate=candidate):
                mapping = self.review_mapping(candidate)
                outputs = builder.build(mapping=mapping)
                self.assertEqual(outputs, builder.build(mapping=mapping))
                workbook = builder.read_workbook(builder.ROOT / "Stimuli_log.xlsx")
                for sheet, filename, count, verdict_col, misses_col, fa_col in [
                    ("PrePO", "pre_trials.json", 10, "E", "F", "G"),
                    ("PostPO", "main_trials.json", 30, "F", "G", "H")
                ]:
                    specs = json.loads(outputs[f"data/generated/{filename}"])
                    self.assertEqual(len(specs), count)
                    for spec in specs:
                        row = spec["source"]["row"]
                        cells = workbook[sheet][row]
                        self.assertEqual(spec["agent_verdict"], cells[f"{verdict_col}{row}"])
                        self.assertEqual(spec["specified_misses"], cells[f"{misses_col}{row}"])
                        self.assertEqual(spec["specified_false_alarms"], cells[f"{fa_col}{row}"])
                        self.assertIn(spec["image_path"], outputs)
                        self.assertIn(spec["symbol_table_path"], outputs)
                training = json.loads(outputs["data/generated/training_trials.json"])
                self.assertEqual(len(training), 5)
                self.assertTrue(all(spec["agent_verdict"] is None for spec in training))

    def test_wrong_asset_fails_validation(self):
        mapping = self.review_mapping()
        mapping["PrePO"][0] = "PrePO_Images/visual_search_data(25).zip"
        with self.assertRaisesRegex(builder.SourceError, "disagree"):
            builder.build(mapping=mapping)

    def test_excel_verdict_is_not_recomputed(self):
        # A test-only copy of the real workbook has a deliberately contrary verdict.
        workbook = builder.read_workbook(builder.ROOT / "Stimuli_log.xlsx")
        workbook["PrePO"][2]["E2"] = "Reject"
        with patch.object(builder, "read_workbook", return_value=workbook):
            result = builder.build(mapping=self.review_mapping())
        self.assertEqual(json.loads(result["data/generated/pre_trials.json"])[0]["agent_verdict"], "Reject")

    def test_missing_values_and_new_selection_columns_block(self):
        for missing in [True, False]:
            workbook = builder.read_workbook(builder.ROOT / "Stimuli_log.xlsx")
            if missing:
                del workbook["PrePO"][2]["F2"]
            else:
                workbook["PrePO"][1]["H1"] = "Selected"
            with patch.object(builder, "read_workbook", return_value=workbook):
                with self.assertRaises(builder.SourceError):
                    builder.build(mapping=self.review_mapping())


if __name__ == "__main__":
    unittest.main()
