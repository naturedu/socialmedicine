import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("collector", ROOT / "skills/skill-download-stats/scripts/collect_downloads.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
REPO, NAMES = "sample/repo", ["skill.zip"]


def asset(i=1, count=2, tag="v1"):
    return {"id": i, "name": "skill.zip", "downloadCount": count, "tag": tag}


class DownloadTests(unittest.TestCase):
    def merge(self, previous=None, assets=None, date="2026-10-24T01:00:00Z"):
        return c.merge_snapshot(previous, assets if assets is not None else [asset()], REPO, NAMES, date)

    def test_first_record_is_baseline_not_new_downloads(self):
        r = self.merge()
        self.assertEqual(r["observedTotal"], 2)
        self.assertIsNone(r["daily"][0]["increaseSincePreviousRecord"])

    def test_same_day_repeat_does_not_accumulate(self):
        r = self.merge(self.merge(), [asset(count=5)], "2026-10-24T02:00:00Z")
        self.assertEqual(r["observedTotal"], 5)
        self.assertEqual(len(r["daily"]), 1)
        self.assertIsNone(r["daily"][0]["increaseSincePreviousRecord"])

    def test_day_delta_uses_previous_record_and_keeps_missing_days_missing(self):
        r = self.merge(self.merge(), [asset(count=5)], "2026-10-27T01:00:00Z")
        self.assertEqual(len(r["daily"]), 2)
        self.assertEqual(r["daily"][-1]["increaseSincePreviousRecord"], 3)
        r = self.merge(r, [asset(count=6)], "2026-10-27T02:00:00Z")
        self.assertEqual(r["daily"][-1]["increaseSincePreviousRecord"], 4)

    def test_deleted_asset_retained_and_reupload_counted_by_new_id(self):
        initial = self.merge()
        r = self.merge(initial, [asset(2, 1, "v2")], "2026-10-25T01:00:00Z")
        self.assertEqual(r["observedTotal"], 3)
        self.assertEqual(r["availableTotal"], 1)
        self.assertFalse(r["assets"][0]["available"])
        self.assertTrue(initial["assets"][0]["available"])  # no mutation

    def test_regression_and_scope_change_rejected(self):
        with self.assertRaises(ValueError): self.merge(self.merge(), [asset(count=1)])
        with self.assertRaises(ValueError): c.merge_snapshot(self.merge(), [], "other/repo", NAMES, "2026-10-25T00:00:00Z")
        with self.assertRaises(ValueError): c.merge_snapshot(self.merge(), [], REPO, ["other.zip"], "2026-10-25T00:00:00Z")

    def test_empty_release_inventory_is_real_zero(self):
        self.assertEqual(self.merge(assets=[])["observedTotal"], 0)

    def test_invalid_counts_not_zero(self):
        for value in [None, True, "3", -1, 2.5]:
            with self.assertRaises(ValueError): c.integer(value, "count")

    def test_pagination_exhausted(self):
        calls = []
        def get(path):
            calls.append(path)
            return list(range(100)) if path.endswith("&page=1") else [100]
        self.assertEqual(len(list(c.paginated("/sample", get))), 101)
        self.assertEqual(len(calls), 2)

    def test_only_published_selected_assets(self):
        def get(path):
            if "/assets?" in path:
                return [{"id": 7, "name": "skill.zip", "state": "uploaded", "download_count": 9,
                         "browser_download_url": "https://github.com/sample/repo/releases/download/v1/skill.zip"},
                        {"id": 8, "name": "other.zip"}]
            return [{"id": 1, "published_at": "2026-10-24", "tag_name": "v1"},
                    {"id": 2, "draft": True}, {"id": 3, "prerelease": True}]
        self.assertEqual(c.fetch_assets(REPO, NAMES, get)[0]["downloadCount"], 9)

    def test_incomplete_or_failed_api_is_rejected(self):
        with self.assertRaises(ValueError): list(c.paginated("/sample", lambda _: {"message": "rate limited"}))
        def broken(_): raise TimeoutError()
        with self.assertRaises(TimeoutError): c.fetch_assets(REPO, NAMES, broken)


if __name__ == "__main__": unittest.main()
