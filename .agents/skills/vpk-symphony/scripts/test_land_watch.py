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
HEAD_CREATED_AT = land_watch.parse_time("2026-05-12T11:09:00Z")


def codex_comment(body, *, commit_id=None, created_at="2026-05-12T11:08:00Z"):
    comment = {
        "user": {"login": "chatgpt-codex-connector[bot]"},
        "body": body,
        "created_at": created_at,
    }
    if commit_id is not None:
        comment["commit_id"] = commit_id
    return comment


def user_comment(body, *, login="eevennsoh", created_at="2026-05-12T11:10:00Z"):
    return {
        "user": {"login": login, "type": "User"},
        "body": body,
        "created_at": created_at,
    }


def agent_review_comment(status, sha=HEAD_SHA, *, created_at="2026-05-12T11:10:00Z"):
    return user_comment(
        f"""[codex] Symphony Agent Review

Status: {status}
Reviewed commit: `{sha}`
Validation reviewed: targeted tests passed
Findings: none
Risk decision: auto-merge eligible
""",
        created_at=created_at,
    )


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

    def test_stale_no_commit_codex_comments_before_head_floor_are_ignored(self):
        stale = codex_comment("Stale no-commit finding")
        matching = codex_comment(
            "Current no-commit finding",
            created_at="2026-05-12T11:10:00Z",
        )

        filtered = land_watch.filter_codex_comments(
            [stale, matching],
            land_watch.latest_time(None, HEAD_CREATED_AT),
            HEAD_SHA,
        )

        self.assertEqual([matching], filtered)


class LandWatchAgentReviewTests(unittest.TestCase):
    def test_current_head_agent_review_pass_satisfies_gate(self):
        comment = agent_review_comment("pass")

        filtered = land_watch.filter_agent_review_comments([comment], HEAD_SHA)

        self.assertEqual([comment], filtered)
        self.assertEqual(
            "pass",
            land_watch.agent_review_status_from_body(comment["body"]),
        )

    def test_stale_agent_review_is_ignored(self):
        current = agent_review_comment("pass")
        stale = agent_review_comment("pass", sha=STALE_SHA)

        filtered = land_watch.filter_agent_review_comments(
            [stale, current],
            HEAD_SHA,
        )

        self.assertEqual([current], filtered)

    def test_non_pass_agent_review_statuses_do_not_permit_merge(self):
        changes = agent_review_comment("changes-requested")
        needs_human = agent_review_comment("needs-human")

        self.assertEqual(
            "changes-requested",
            land_watch.agent_review_status_from_body(changes["body"]),
        )
        self.assertEqual(
            "needs-human",
            land_watch.agent_review_status_from_body(needs_human["body"]),
        )
        self.assertNotEqual(
            "pass",
            land_watch.agent_review_status_from_body(changes["body"]),
        )
        self.assertNotEqual(
            "pass",
            land_watch.agent_review_status_from_body(needs_human["body"]),
        )

    def test_agent_review_comment_is_not_human_feedback(self):
        comment = agent_review_comment("pass")

        filtered = land_watch.filter_human_issue_comments([comment])

        self.assertEqual([], filtered)

    def test_stale_agent_review_forces_re_review(self):
        stale = agent_review_comment("pass", sha=STALE_SHA)

        filtered = land_watch.filter_stale_agent_review_comments([stale], HEAD_SHA)

        self.assertEqual([stale], filtered)


if __name__ == "__main__":
    unittest.main()
