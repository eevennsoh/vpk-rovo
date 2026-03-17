# Future Chat Test Execution Checklist

Use this as the operator-facing companion to [FUTURE_CHAT_TEST_AUTOMATION_PLAN.md](/Users/esoh/Documents/Labs/VPK-rovodev/FUTURE_CHAT_TEST_AUTOMATION_PLAN.md).

## Setup

- Start RovoDev Serve if needed
- Start the app with `pnpm run dev`
- Confirm Future Chat loads at `/future-chat`
- Set `PLAYWRIGHT_BASE_URL` if not using `http://127.0.0.1:3000`

## Evidence To Capture

- Screenshots on failure
- Network activity for:
	- `POST /api/future-chat/chat`
	- `POST /api/agent-mode`
- Backend logs for:
	- `PUT /v3/agent-mode`
	- `ask_user_questions`
	- `exit_plan_mode`
	- artifact creation/update
- `data-route-decision` evidence for core routing cases

## Required Cases

- [x] Use Case 1: Baseline chat routing
- [x] Use Case 2: Direct artifact creation
- [x] Use Case 3: GenUI vs artifact regression
- [x] Use Case 4: Manual plan mode happy path
- [ ] Use Case 5: Simple ambiguous artifact uses deferred `ask_user_questions` without requiring a plan
- [ ] Use Case 6: Complex artifact requires a plan card before generation starts
- [ ] Use Case 7: Plan rejection keeps plan mode active and requires a new prompt for a new plan
- [x] Use Case 8: Complex artifact programmatically triggers native plan mode
- [x] Use Case 9: Existing artifact update creates exactly one new version on the same artifact id
- [ ] Use Case 10: Explicit new artifact creates a new artifact id and preserves the original artifact history
- [ ] Use Case 11: Negative artifact-creation regression
- [ ] Use Case 12: History-aware follow-up creates a new sibling artifact
- [x] Use Case 13: Plan toggle is disabled during streaming

## Execution Order

1. Use Case 1
2. Use Case 2
3. Use Case 3
4. Use Case 4
5. Use Case 5
6. Use Case 6
7. Use Case 7
8. Use Case 9
9. Use Case 10
10. Use Case 11
11. Use Case 12
12. Use Case 13
13. Use Case 8

## Stop Conditions

Stop and investigate before continuing if:

- Future Chat cannot load
- `POST /api/future-chat/chat` fails consistently
- `data-route-decision` is missing from streamed responses for core routing cases
- Native agent mode calls fail in the plan-mode scenarios

## First Spec To Implement

- [ ] `tests/future-chat/baseline-chat-routing.spec.ts`

Goal:
- Verify Use Case 1 end to end with route-decision evidence and no artifact/question/plan UI regressions.
