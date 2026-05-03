# Phase A — Tier 1: Critical Resubmission & Validation Fixes

## Goal

Make the test edit → submit → return → resubmit lifecycle actually work end-to-end. Fix every
bug that blocks or corrupts a student's ability to resubmit a returned test, and close all
validation gaps that allow bad data into the system.

## Design Decisions

| Decision | Choice |
|---|---|
| Resubmission model | Reopen same submission (`returned → in_progress`) |
| Score on `returned` | `None` — hidden until re-graded |
| Breaking edits | Rejected by default; require `force=true` in request |
| Submissions returned on breaking edit | Both `submitted` and `graded` |
| Grader feedback on resubmit | Preserved alongside answers; cleared only when student re-submits |
| Time-limit enforcement | Celery beat every 5 min; auto-submits expired in-progress submissions |
| Submit past `available_until` | Allowed if `submission.started_at < test.available_until` |
| Validation on submit | Hard reject empty; `confirm=true` override for incomplete-required/word-count |
| `max_points` change | Breaking change (epsilon no-op detection: delta < 0.001) |
| `is_required: false→true` | Breaking only when ≥1 submission has no answer for that question |
| File-upload race fix | `upsert_answers` stops clearing `file_answer` |
| Re-grade audit | Lightweight `grading_history` JSONField on Submission |

---

## A.1 Backend — Models (`backend/apps/assessments/models.py`)

### Task A.1.1 — `Submission.score` hides on `returned`
- **File**: `backend/apps/assessments/models.py`
- **Change**: `score` property (line 393) — change guard from `["graded", "returned"]` to `["graded"]` only. `returned` submissions return `None`.
- **Rationale**: Score from a prior (possibly partial) grading round is confusing when student is supposed to revise. Hide until re-graded.

### Task A.1.2 — `Submission.is_resubmittable` property
- **File**: `backend/apps/assessments/models.py`
- **Change**: Add property after `score`:
  ```python
  @property
  def is_resubmittable(self):
      """Check if this submission can be reopened for revision."""
      return self.status == "returned"
  ```

### Task A.1.3 — `Submission.grading_history` JSONField
- **File**: `backend/apps/assessments/models.py`
- **Change**: Add field to `Submission` model:
  ```python
  grading_history = models.JSONField(
      default=list,
      blank=True,
      help_text="List of previous grading events: [{grader_id, grader_name, graded_at, score, feedback, per_answer}]"
  )
  ```
- **Migration**: New `AddField` migration required.

### Task A.1.4 — `Answer.validate_for_submission` — fix required-field bug
- **File**: `backend/apps/assessments/models.py`
- **Change**: In `validate_for_submission` (line 511), the required check is at the bottom and returns early if `not self.has_answer` before reaching it. Move the required check BEFORE the early return so blank answers on required questions are caught:
  ```python
  def validate_for_submission(self):
      if self.question.is_required and not self.has_answer:
          raise ValidationError(
              f"Question '{self.question.title}' is required"
          )
      if not self.has_answer:
          return  # Non-required, empty — valid
      # ... rest of validation
  ```

---

## A.2 Backend — Serializers (`backend/apps/assessments/serializers.py`)

### Task A.2.1 — `get_attempts_remaining` excludes `returned`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Line 915 — filter out `returned` submissions:
  ```python
  attempts_used = obj.submissions.filter(
      student=request.user
  ).exclude(status="returned").count()
  ```

### Task A.2.2 — `get_can_attempt` excludes `returned`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Line 930 — same exclusion in `get_can_attempt`:
  ```python
  attempts_used = obj.submissions.filter(
      student=request.user
  ).exclude(status="returned").count()
  ```

### Task A.2.3 — Add `can_resubmit` field to `StudentTestSerializer`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Add `can_resubmit = serializers.SerializerMethodField()` to `StudentTestSerializer` and its `Meta.fields`. Implement:
  ```python
  @extend_schema_field(serializers.BooleanField)
  def get_can_resubmit(self, obj):
      request = self.context.get("request")
      if not request or not hasattr(request, "user"):
          return False
      latest = obj.submissions.filter(student=request.user).order_by("-created_at").first()
      return latest is not None and latest.status == "returned"
  ```

### Task A.2.4 — Fix `_detect_breaking_changes` (new question detection)
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Replace line 341's broken `len(questions_data) - len(incoming_question_ids)` logic:
  ```python
  # Any incoming ID that doesn't exist in existing_questions is a new question
  for q in questions_data:
      qid = q.get("id")
      if qid and str(qid) not in existing_questions:
          return True  # New question with client-generated UUID
      if not qid:
          return True  # New question with no ID
  ```

### Task A.2.5 — `_detect_breaking_changes`: add `max_points` detection
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Inside the per-question loop (after type-change check), add:
  ```python
  # Check max_points change (with epsilon for float no-ops)
  incoming_max_points = question_data.get("max_points")
  if incoming_max_points is not None:
      if abs(float(incoming_max_points) - float(existing_question.max_points)) > 0.001:
          return True
  ```

### Task A.2.6 — `_detect_breaking_changes`: add `is_required` detection
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: After `max_points` check, add:
  ```python
  # Check is_required change false→true
  incoming_required = question_data.get("is_required")
  if (
      incoming_required is True
      and existing_question.is_required is False
  ):
      # Only breaking if at least one submission lacks an answer for this question
      has_unanswered = Answer.objects.filter(
          question=existing_question
      ).filter(
          models.Q(text_answer="") | models.Q(text_answer__isnull=True)
      ).filter(
          boolean_answer__isnull=True,
          date_answer__isnull=True,
          file_answer__isnull=True,
      ).filter(selected_options__isnull=True).exists()
      if has_unanswered:
          return True
  ```
  Note: use `.annotate` or direct check via `Answer.has_answer` equivalent.

### Task A.2.7 — Rename + fix `_return_graded_submissions` → `_return_active_submissions`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**:
  - Rename method to `_return_active_submissions`
  - Accept both `submitted` and `graded` submissions (not just `graded`)
  - Do NOT clear `graded_by`, `graded_at`, or existing `feedback`
  - Append to feedback rather than replace (preserve grader's original notes)
  - Fire `trigger_submission_returned_notification(submission.id)` for each:
  ```python
  def _return_active_submissions(self, active_submissions):
      from .signals import trigger_submission_returned_notification
      count = 0
      for submission in active_submissions:
          submission.status = "returned"
          note = "Test has been updated. Please review and resubmit."
          if submission.feedback:
              submission.feedback = f"{submission.feedback}\n\n[System] {note}"
          else:
              submission.feedback = f"[System] {note}"
          submission.save()
          trigger_submission_returned_notification(submission.id)
          count += 1
      return count
  ```
- Update caller `_handle_breaking_changes` to use new name and pass correct queryset:
  ```python
  active_submissions = test.submissions.filter(
      status__in=["submitted", "graded"]
  )
  ```

### Task A.2.8 — `_safe_update_questions`: protect in-progress submissions
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Line 534 — change the condition from `answers__isnull=False` (answered) to any non-archived submission:
  ```python
  has_submissions = test.submissions.filter(
      status__in=["in_progress", "submitted", "graded", "returned"]
  ).exists()
  ```
  This ensures the delete-and-recreate path (`_update_questions_simple`) is only taken for tests with truly zero submissions.

### Task A.2.9 — `TestSerializer.update()`: expose `force` + reject on breaking changes
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: In `_handle_question_updates_with_breaking_changes`, before processing breaking changes:
  - Accept a `_force` flag threaded through from `update()` via `self.context`
  - If breaking changes detected AND `_force != True`, raise:
    ```python
    from rest_framework.exceptions import ValidationError as DRFValidationError
    if breaking_changes and not self.context.get("force", False):
        impacted = test.submissions.filter(
            status__in=["submitted", "graded"]
        ).count()
        raise DRFValidationError({
            "breaking_change": True,
            "message": "This edit contains breaking changes.",
            "impacted_submissions": impacted,
            "detail": "Pass force=true to confirm and apply the changes.",
            "change_reasons": change_reasons,  # list of strings built during detection
        })
    ```
- Thread `force` from view through serializer context: in `TestViewSet.perform_update`, pass `force` from request data into serializer context.

### Task A.2.10 — Expose `question_description` in `AnswerSerializer`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: `question_description` is already a field in `AnswerSerializer` (line 727). Verify it's in `Meta.fields`. If missing, add it. Also add `student_email` is already in `SubmissionSerializer` — just verify it's serialized.

---

## A.3 Backend — Views (`backend/apps/assessments/views.py`)

### Task A.3.1 — New `resubmit` action
- **File**: `backend/apps/assessments/views.py`
- **Change**: Add to `SubmissionViewSet`:
  ```python
  @action(detail=True, methods=["post"])
  def resubmit(self, request, pk=None):
      """Reopen a returned submission for revision."""
      submission = self.get_object()

      if request.user.role == "student" and submission.student != request.user:
          return Response({"error": "You can only resubmit your own tests"},
                          status=status.HTTP_403_FORBIDDEN)

      if not submission.is_resubmittable:
          return Response({"error": "Only returned submissions can be reopened"},
                          status=status.HTTP_400_BAD_REQUEST)

      submission.status = "in_progress"
      submission.submitted_at = None
      # Leave graded_by, graded_at, feedback, per-answer points_earned/feedback intact
      # (student sees grader's notes while revising)
      submission.save()

      serializer = self.get_serializer(submission)
      return Response(serializer.data)
  ```

### Task A.3.2 — Fix `perform_create`: exclude `returned` from attempt count
- **File**: `backend/apps/assessments/views.py`
- **Change**: Line 543:
  ```python
  existing_attempts = Submission.objects.filter(
      test=test, student=self.request.user
  ).exclude(status="returned").count()
  ```

### Task A.3.3 — `submit` action: enforce empty-submission rejection
- **File**: `backend/apps/assessments/views.py`
- **Change**: After status check (line 576), compute completion and validate:
  ```python
  # Hard block: no answers at all
  has_any_answer = submission.answers.filter(
      models.Q(text_answer__gt="")
      | models.Q(boolean_answer__isnull=False)
      | models.Q(file_answer__isnull=False)
      | models.Q(selected_options__isnull=False)
  ).distinct().exists()

  required_count = submission.test.questions.filter(is_required=True).count()
  if not has_any_answer and required_count > 0:
      return Response(
          {"error": "Cannot submit: no questions have been answered."},
          status=status.HTTP_400_BAD_REQUEST,
      )
  ```

### Task A.3.4 — `submit` action: run `validate_for_submission` per answer
- **File**: `backend/apps/assessments/views.py`
- **Change**: After empty check, collect validation errors:
  ```python
  confirm = request.data.get("confirm", False)
  validation_warnings = {}
  for answer in submission.answers.select_related("question").all():
      errors = answer.get_validation_errors()
      if errors:
          validation_warnings[str(answer.question.id)] = {
              "question_title": answer.question.title,
              "errors": errors,
          }
  # Also check required questions with no Answer row at all
  answered_question_ids = set(
      submission.answers.values_list("question_id", flat=True)
  )
  for question in submission.test.questions.filter(is_required=True):
      if str(question.id) not in {str(qid) for qid in answered_question_ids}:
          validation_warnings[str(question.id)] = {
              "question_title": question.title,
              "errors": [f"Question '{question.title}' is required"],
          }

  if validation_warnings and not confirm:
      return Response(
          {
              "error": "Submission has validation issues.",
              "validation_warnings": validation_warnings,
              "confirm_required": True,
          },
          status=status.HTTP_400_BAD_REQUEST,
      )
  ```

### Task A.3.5 — `submit` action: enforce time-window (started-before-deadline)
- **File**: `backend/apps/assessments/views.py`
- **Change**: After validation block:
  ```python
  test = submission.test
  if test.available_until and submission.started_at > test.available_until:
      return Response(
          {"error": "This test was no longer available when you started."},
          status=status.HTTP_400_BAD_REQUEST,
      )
  ```

### Task A.3.6 — `submit` action: clear previous grading on resubmit
- **File**: `backend/apps/assessments/views.py`
- **Change**: Before setting `status="submitted"`, check if this is a resubmission:
  ```python
  # If reopened from 'returned', clear previous grading before re-submitting
  # (grader will see a clean slate; grading_history preserves the record)
  if submission.graded_at is not None:
      # Archive current grading into history
      history_entry = {
          "grader_id": submission.graded_by_id,
          "grader_name": (
              submission.graded_by.get_full_name()
              if submission.graded_by else "Unknown"
          ),
          "graded_at": submission.graded_at.isoformat(),
          "score": float(submission.score or 0),
          "feedback": submission.feedback,
      }
      submission.grading_history = (submission.grading_history or []) + [history_entry]
      # Clear grading fields
      submission.graded_by = None
      submission.graded_at = None
      submission.feedback = ""
      # Clear per-answer grading
      submission.answers.update(points_earned=None, feedback="")
  ```

### Task A.3.7 — `upsert_answers`: stop clearing `file_answer`
- **File**: `backend/apps/assessments/views.py`
- **Change**: Remove line 697 (`answer.file_answer = None`). The file_answer field is managed exclusively by `upload_document` and `delete_document` endpoints. The general answer upsert should not touch it.

### Task A.3.8 — `TestViewSet.perform_update`: thread `force` into serializer context
- **File**: `backend/apps/assessments/views.py`
- **Change**:
  ```python
  @transaction.atomic
  def perform_update(self, serializer):
      force = self.request.data.get("force", False)
      serializer.save(_force=force)
  ```
  And in `TestSerializer.update()`, read `_force` from `validated_data` or thread via `self.context` — use context:
  ```python
  # In TestViewSet.update():
  def get_serializer(self, *args, **kwargs):
      kwargs["context"] = self.get_serializer_context()
      kwargs["context"]["force"] = self.request.data.get("force", False)
      return super().get_serializer(*args, **kwargs)
  ```

---

## A.4 Backend — Celery Tasks (`backend/apps/assessments/tasks.py`)

### Task A.4.1 — `auto_submit_expired_tests` Celery task
- **File**: `backend/apps/assessments/tasks.py`
- **Change**: Add new shared task:
  ```python
  @shared_task
  def auto_submit_expired_tests():
      """
      Find all in-progress submissions whose time limit has expired and auto-submit them.
      Runs every 5 minutes via Celery beat.
      """
      from django.utils import timezone
      from django.db.models import F, ExpressionWrapper, DurationField
      now = timezone.now()

      # Find submissions where: in_progress AND test has time_limit AND now > started_at + limit
      expired = Submission.objects.filter(
          status="in_progress",
          test__time_limit_minutes__isnull=False,
      ).select_related("test", "student")

      auto_submitted = []
      for submission in expired:
          limit_seconds = submission.test.time_limit_minutes * 60
          elapsed = (now - submission.started_at).total_seconds()
          if elapsed >= limit_seconds:
              submission.status = "submitted"
              submission.submitted_at = now
              submission.time_spent_minutes = submission.test.time_limit_minutes  # capped
              submission.save()
              auto_submitted.append(submission.id)

      # Send notifications
      for submission_id in auto_submitted:
          send_submission_auto_submitted_notification.delay(submission_id)

      return f"Auto-submitted {len(auto_submitted)} expired submissions"
  ```

### Task A.4.2 — `send_submission_auto_submitted_notification` task
- **File**: `backend/apps/notifications/tasks.py`
- **Change**: Add new notification task that sends in-app + push to the student with message "Your test was automatically submitted because the time limit expired."

### Task A.4.3 — Register Celery beat schedule
- **File**: `backend/config/settings.py` (or wherever CELERY_BEAT_SCHEDULE is defined)
- **Change**: Add:
  ```python
  CELERY_BEAT_SCHEDULE = {
      ...
      "auto-submit-expired-tests": {
          "task": "apps.assessments.tasks.auto_submit_expired_tests",
          "schedule": crontab(minute="*/5"),
      },
  }
  ```

---

## A.5 Backend — Notification Models (`backend/apps/notifications/models.py`)

### Task A.5.1 — Add `submission_auto_submitted` event type
- **File**: `backend/apps/notifications/models.py`
- **Change**: Add `("submission_auto_submitted", "Submission Auto-Submitted")` to notification type choices.

---

## A.6 Backend — Tests

### Task A.6.1 — New test cases for resubmission flow (`test_views.py`)
- **File**: `backend/apps/assessments/test_views.py`
- **Test cases to add**:
  1. `test_resubmit_endpoint_flips_status` — `returned → in_progress`, clears `submitted_at`
  2. `test_resubmit_preserves_grader_feedback` — `graded_by`, `graded_at`, per-answer `feedback` intact after resubmit
  3. `test_resubmit_only_works_on_returned` — 400 if `status != "returned"`
  4. `test_returned_submission_not_counted_in_attempts` — `attempts_remaining` correct
  5. `test_cannot_start_while_in_progress` — 400 if already in_progress
  6. `test_empty_submission_rejected` — 400 when no answers
  7. `test_incomplete_required_rejected_without_confirm` — 400 + `confirm_required`
  8. `test_incomplete_required_allowed_with_confirm` — 200 when `confirm=true`
  9. `test_submit_after_available_until_blocked_if_started_after` — 400
  10. `test_submit_after_available_until_allowed_if_started_before` — 200
  11. `test_auto_submit_celery_task` — creates expired in-progress, runs task, checks status
  12. `test_file_not_clobbered_by_upsert` — upload file, upsert text answer, file still present
  13. `test_resubmit_clears_per_answer_grading_on_submit` — after resubmit+submit, `points_earned=None`
  14. `test_grading_history_appended_on_resubmit` — `grading_history` has one entry

### Task A.6.2 — New test cases for breaking-change serializer (`test_serializers.py`)
- **File**: `backend/apps/assessments/test_serializers.py`
- **Test cases to add**:
  1. `test_breaking_change_rejected_without_force` — 400 with `breaking_change: True`
  2. `test_breaking_change_accepted_with_force` — 200, submissions returned
  3. `test_new_question_with_uuid_detected_as_breaking` — new client-UUID question detected
  4. `test_max_points_no_op_not_breaking` — 1.0 → 1.0000001 not breaking
  5. `test_max_points_real_change_is_breaking` — 1.0 → 2.0 is breaking
  6. `test_is_required_toggle_with_all_answered_not_breaking` — no return when all answered
  7. `test_is_required_toggle_with_unanswered_is_breaking` — return when some unanswered
  8. `test_in_progress_not_orphaned_on_edit` — questions survive when in_progress exists
  9. `test_submitted_returned_on_breaking_change` — `submitted` submissions returned, not just `graded`
  10. `test_notification_triggered_on_breaking_return` — signal fires per returned submission
  11. `test_score_null_on_returned` — `score` property returns None for `returned` submission

---

## A.7 Frontend — Types (`frontend/types/tests.ts`)

### Task A.7.1 — Add `can_resubmit` to `testDetailSchema`
- **File**: `frontend/types/tests.ts`
- **Change**: Add `can_resubmit: z.boolean()` to `testDetailSchema`.
- Also add it to `testListItemSchema` (it inherits via `omit`, but `testListItemSchema` is derived from `testDetailSchema` — check it includes the field or explicitly add).

### Task A.7.2 — Add `is_resubmittable` to `submissionSchema`
- **File**: `frontend/types/tests.ts`
- **Change**: Add `is_resubmittable: z.boolean()` to `submissionSchema`.

### Task A.7.3 — Add `validation_warnings` type
- **File**: `frontend/types/tests.ts`
- **Change**: Add:
  ```typescript
  export const validationWarningsSchema = z.record(
    z.string(), // question UUID
    z.object({
      question_title: z.string(),
      errors: z.array(z.string()),
    })
  );
  export type ValidationWarnings = z.infer<typeof validationWarningsSchema>;

  export const submitValidationErrorSchema = z.object({
    error: z.string(),
    validation_warnings: validationWarningsSchema,
    confirm_required: z.boolean(),
  });
  export type SubmitValidationError = z.infer<typeof submitValidationErrorSchema>;
  ```

### Task A.7.4 — Add `grading_history` to `submissionDetailSchema`
- **File**: `frontend/types/tests.ts`
- **Change**: Add optional field:
  ```typescript
  grading_history: z.array(z.object({
    grader_id: z.number().nullable(),
    grader_name: z.string(),
    graded_at: z.string(),
    score: z.number(),
    feedback: z.string(),
  })).optional(),
  ```

---

## A.8 Frontend — Hooks (`frontend/hooks/tests.ts`)

### Task A.8.1 — Add `resubmitTest` function
- **File**: `frontend/hooks/tests.ts`
- **Change**: Add:
  ```typescript
  async function _resubmitTest(
    client: ReturnType<typeof useClient>,
    submissionId: number
  ): Promise<Submission> {
    const response = await client.post<Submission>(
      `/submissions/${submissionId}/resubmit/`
    );
    if (response.status === 200) {
      toastSuccess("Test reopened for revision.");
      return response.data;
    }
    throw new Error("Failed to resubmit test.");
  }
  ```
  Expose from `useTests` hook.

### Task A.8.2 — Modify `submitTest` to handle validation errors
- **File**: `frontend/hooks/tests.ts`
- **Change**: In `_submitTest`, catch 400 with `confirm_required` and re-throw as typed error. Add optional `confirm` param to `_submitTest`:
  ```typescript
  async function _submitTest(
    client,
    submissionId,
    options?: { confirm?: boolean }
  ): Promise<Submission> {
    const response = await client.post(
      `/submissions/${submissionId}/submit/`,
      options?.confirm ? { confirm: true } : {}
    );
    if (response.status === 200) {
      toastSuccess("Test submitted successfully.");
      return response.data;
    }
    throw new Error("Failed to submit test.");
  }
  ```
  In `useTests.submitTest`, catch `AxiosError` with `confirm_required: true` and expose as a custom error type the UI can handle.

---

## A.9 Frontend — Take Test Page (`frontend/app/(dashboard)/tests/[id]/take/page.tsx`)

### Task A.9.1 — Fix stale-closure timer bug
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: Convert `handleSubmitTest` to `useCallback` with `[submission, answers, submitTest, router, testId]` as deps. Add it to the timer effect dependency array. Alternatively, use a ref to store the latest version:
  ```typescript
  const handleSubmitTestRef = useRef(handleSubmitTest);
  useEffect(() => { handleSubmitTestRef.current = handleSubmitTest; }, [handleSubmitTest]);
  // Inside timer: handleSubmitTestRef.current()
  ```

### Task A.9.2 — Bounds-check `currentQuestionIndex`
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: Before accessing `test.questions[currentQuestionIndex]`, clamp:
  ```typescript
  const safeIndex = Math.min(currentQuestionIndex, test.questions.length - 1);
  const currentQuestion = test.questions[safeIndex];
  ```
  Reset `currentQuestionIndex` in state if it exceeds bounds.

### Task A.9.3 — Display previous grader feedback when reopened from `returned`
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: After loading submission answers, if `submission.status === "in_progress"` AND `grading_history` has entries (i.e., this is a reopened submission), show a collapsible "Previous Grader Feedback" banner above the question. Per-question: when rendering `QuestionComponent`, pass `previousFeedback={answerFeedbackMap[question.id]}` from the loaded submission detail.

### Task A.9.4 — Validation-error confirmation modal
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: In `handleSubmitTest`:
  1. Catch typed `ValidationWarnings` error from `submitTest`
  2. Show a modal with the list of issues
  3. "Submit Anyway" button retries with `confirm: true`
  4. "Fix Issues" button closes modal and navigates to first failing question

---

## A.10 Frontend — Test Detail Page (`frontend/app/(dashboard)/tests/[id]/page.tsx`)

### Task A.10.1 — Fix `returned` case: add resubmit action
- **File**: `frontend/app/(dashboard)/tests/[id]/page.tsx`
- **Change**: In `getActionButton`, `case "returned"`:
  ```tsx
  case "returned":
    return (
      <div className="flex flex-1 gap-2">
        {test.can_resubmit && (
          <Button onClick={handleResubmitTest} className="flex-1">
            <Timer className="mr-2 h-4 w-4" />
            Resume & Resubmit
          </Button>
        )}
        {test.my_submission && (
          <Button variant="outline"
            onClick={() => router.push(`/submissions/${test.my_submission!.id}`)}>
            View Returned Submission
          </Button>
        )}
      </div>
    );
  ```
- Add `handleResubmitTest` handler:
  ```typescript
  const handleResubmitTest = async () => {
    if (!test.my_submission) return;
    try {
      await resubmitTest(test.my_submission.id);
      router.push(`/tests/${testId}/take`);
    } catch (err) {
      toastError(err, "Failed to reopen submission.");
    }
  };
  ```

### Task A.10.2 — Show grader feedback in `returned` state
- **File**: `frontend/app/(dashboard)/tests/[id]/page.tsx`
- **Change**: When `status === "returned"` AND `test.my_submission?.feedback`, render a card above the action buttons:
  ```tsx
  {status === "returned" && test.my_submission?.feedback && (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>Grader Feedback:</strong> {test.my_submission.feedback}
      </AlertDescription>
    </Alert>
  )}
  ```

---

## A.11 Frontend — Submission Detail Page (`frontend/app/(dashboard)/submissions/[id]/page.tsx`)

### Task A.11.1 — Hide score when `returned`
- **File**: `frontend/app/(dashboard)/submissions/[id]/page.tsx`
- **Change**: Line 201 — add `submission.status !== "returned"` guard:
  ```tsx
  {submission.score !== null &&
    submission.max_score !== null &&
    submission.status !== "returned" && (
      <div className="...">...</div>
    )}
  ```

### Task A.11.2 — Show returned-for-revision banner
- **File**: `frontend/app/(dashboard)/submissions/[id]/page.tsx`
- **Change**: When `submission.status === "returned"`, show a prominent banner with a link:
  ```tsx
  {submission.status === "returned" && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        This submission was returned for revision.
        <Button variant="link" onClick={() => router.push(`/tests/${submission.test}`)}>
          Click here to resubmit
        </Button>
      </AlertDescription>
    </Alert>
  )}
  ```

---

## A.12 Admin — Test Edit Page (`admin/src/pages/tests/edit.tsx`)

### Task A.12.1 — Breaking-change confirmation modal
- **File**: `admin/src/pages/tests/edit.tsx`
- **Change**:
  1. First `updateTest` call — no `force` flag
  2. On 400 with `breaking_change: true`, capture the response payload
  3. Show a `Dialog` modal:
     - Title: "Breaking Changes Detected"
     - Body: "This edit will return X submissions to students for revision. Change reasons: [list]"
     - "Cancel" button — closes modal, user can adjust
     - "Apply Anyway" button — re-fires `updateTest` with `force: true` in payload
  4. On success, redirect to tests list as before

### Task A.12.2 — Enhance submission-exists warning
- **File**: `admin/src/pages/tests/edit.tsx`
- **Change**: The existing `Alert` at line 391 only shows generic warning. Replace with:
  - Show count of graded/submitted/in-progress submissions
  - List which changes are potentially breaking (question type, options, max_points)
  - Yellow banner for "has submissions", red banner when "has graded submissions"

---

## A.13 Admin — Submission Grade Page (`admin/src/pages/submissions/grade.tsx`)

### Task A.13.1 — Show grading history
- **File**: `admin/src/pages/submissions/grade.tsx`
- **Change**: If `submission.gradingHistory` has entries, render a collapsible "Previous Grading History" section before the individual answers. Each entry shows: grader name, date, score, general feedback.

### Task A.13.2 — Allow re-grading returned submissions
- **File**: `admin/src/pages/submissions/grade.tsx`
- **Change**: The current status check at line 1006 in views (backend) already allows re-grading `returned` submissions. In the UI, ensure the grade form is shown (not disabled/hidden) for `returned` status. If currently any conditional rendering hides it, remove that gate.

---

## Execution Order

1. Backend models (A.1) → migration
2. Backend serializers (A.2)
3. Backend views (A.3)
4. Backend tasks + beat schedule (A.4, A.5)
5. Backend tests (A.6)
6. Frontend types (A.7)
7. Frontend hooks (A.8)
8. Frontend take-test page (A.9)
9. Frontend test-detail page (A.10)
10. Frontend submission-detail page (A.11)
11. Admin edit page (A.12)
12. Admin grade page (A.13)

## Acceptance Criteria

- [ ] Student with a `returned` submission can click "Resume & Resubmit" and enter the test-taking page with their previous answers pre-loaded
- [ ] Grader feedback (general + per-answer) is visible to student while revising
- [ ] After re-submitting, `grading_history` has one entry with previous score
- [ ] `attempts_remaining` treats `returned` as a free slot (does not decrement)
- [ ] Submitting a completely empty test returns 400 regardless of `confirm`
- [ ] Submitting with missing required questions returns 400 with `validation_warnings`; `confirm=true` override works
- [ ] Expired in-progress submissions (past time limit) are auto-submitted by Celery beat within 5 minutes
- [ ] Student receives in-app + push notification on auto-submit
- [ ] Breaking test edit without `force=true` returns 400 with impact count
- [ ] Breaking test edit with `force=true` returns all `submitted` + `graded` submissions and sends notifications
- [ ] In-progress submissions are NOT orphaned or dropped when teacher edits a test
- [ ] `max_points` no-op changes (e.g., 1.0 → 1.00) do not trigger breaking change detection
- [ ] `is_required: false→true` on a fully-answered question does not trigger return
- [ ] File uploaded for a document_upload question is NOT cleared when student saves text answers concurrently
- [ ] Score is `null` on `returned` submissions (not visible to student until re-graded)
- [ ] Timer auto-submit uses current state (no stale closure)
