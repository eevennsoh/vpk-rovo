#!/usr/bin/env python3
import importlib.util
import pathlib
import unittest


MODULE_PATH = pathlib.Path(__file__).with_name("land_watch.py")
SPEC = importlib.util.spec_from_file_location("land_watch", MODULE_PATH)
assert SPEC is not None
land_watch = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(land_watch)


HEAD_SHA = "4753d46d6b095d080dcf0390ac24fec095cc61cd"
STALE_SHA = "d2893daae56167041e76800e4e3336575bf9cbe1"


def codex_comment(body, *, commit_id=None):
    comment = {
        "user": {"login": "chatgpt-codex-connector[bot]"},
        "body": body,
        "created_at": "2026-05-12T11:08:00Z",
    }
    if commit_id is not None:
        comment["commit_id"] = commit_id
    return comment


class LandWatchReviewFreshnessTests(unittest.TestCase):
    def test_review_signal_body_commit_can_match_head_prefix(self):
        body = """
### Codex Review

**Reviewed commit:** `4753d46d6b`
"""

        self.assertEqual("4753d46d6b", land_watch.reviewed_commit_from_body(body))
        self.assertTrue(land_watch.comment_matches_head(codex_comment(body), HEAD_SHA))

    def test_review_signals_without_current_head_are_ignored(self):
        matching = codex_comment(
            """
### Codex Review

**Reviewed commit:** `4753d46d6b`
""",
        )
        stale = codex_comment(
            """
### Codex Review

**Reviewed commit:** `d2893daae5`
""",
        )
        missing_commit = codex_comment("### Codex Review\n\nNo reviewed commit marker.")

        filtered = land_watch.filter_codex_review_signals(
            [matching, stale, missing_commit],
            None,
            HEAD_SHA,
        )

        self.assertEqual([matching], filtered)

    def test_stale_inline_codex_comments_do_not_block_current_head(self):
        stale = codex_comment("Stale inline finding", commit_id=STALE_SHA)
        matching = codex_comment("Current inline finding", commit_id=HEAD_SHA)

        filtered = land_watch.filter_codex_comments(
            [stale, matching],
            None,
            HEAD_SHA,
        )

        self.assertEqual([matching], filtered)


if __name__ == "__main__":
    unittest.main()
