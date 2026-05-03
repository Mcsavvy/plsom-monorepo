# Phase B — Tier 2: Quality, Concurrency & Data Integrity

## Goal

Harden the system against real-world concurrent usage, close data-integrity gaps, fix storage
leaks, correct permission logic, and reduce notification noise. Phase B assumes Phase A is
complete and merged.

## Prerequisites

- Phase A fully merged and deployed
- `Submission.grading_history` JSONField migration applied
- Celery beat running with auto-submit task

## Design Decisions (Phase B)

| Decision | Choice |
|---|---|
| Concurrency mechanism | Optimistic via `Submission.updated_at`; no new version field |
| On 409 conflict | Reload server state, merge local-only unsaved answers, show banner |
| File leak on overwrite | Delete old file from storage before saving new one |
| File leak on delete (cascade) | `pre_delete` signal on `Submission` deletes physical files |
| Lecturer permission | AND logic changed to OR (created_by OR course__lecturer) |
| `max_points` min value | `MinValueValidator(0.01)` added to Question |
| Test deletion guard | `confirm=true` required when test has submissions |
| Test cohort/course change | Warn admin; block if has non-draft submissions |
| Notification deduplication | Diff-check on `test_updated`; throttle `submission_returned` |
| Grading concurrency | Optimistic lock via `updated_at` on grade_submission too |
| Frontend `beforeunload` | Warn before leaving if unsaved answers exist |
| Save indicator | Timestamp-based ("Saved 12s ago") |

---

## B.1 Backend — Optimistic Concurrency for `upsert_answers`

### Task B.1.1 — Accept `client_updated_at` in `upsert_answers`
- **File**: `backend/apps/assessments/views.py`
- **Change**: In `upsert_answers` action, before processing answers:
  ```python
  client_updated_at_raw = request.data.get("client_updated_at")
  if client_updated_at_raw:
      from django.utils.dateparse import parse_datetime
      client_updated_at = parse_datetime(client_updated_at_raw)
      if client_updated_at and submission.updated_at > client_updated_at:
          # Return 409 with current submission state so client can merge
          serializer = self.get_serializer(submission)
          return Response(
              {
                  "error": "Submission has been updated elsewhere.",
                  "conflict": True,
                  "current_submission": serializer.data,
              },
              status=status.HTTP_409_CONFLICT,
          )
  ```
- Note: `client_updated_at` is optional. If absent, fall through to last-write-wins (existing behavior).

### Task B.1.2 — Frontend: send `client_updated_at` with upsert
- **File**: `frontend/hooks/tests.ts`
- **Change**: `_saveAnswers` (and `transformAnswersToBackend` caller) passes `client_updated_at`:
  ```typescript
  async function _saveAnswers(client, submissionId, answers, updatedAt?: string) {
    const response = await client.post(
      `/submissions/${submissionId}/answers/`,
      { answers, client_updated_at: updatedAt }
    );
    ...
  }
  ```
  Update `useTests.saveAnswers` to accept and forward `updatedAt`.

### Task B.1.3 — Frontend: handle 409 with merge + banner
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: In auto-save and manual save handlers, catch 409:
  1. Extract `current_submission` from response
  2. Build `serverAnswers = transformAnswersToFrontend(current_submission.answers)`
  3. Merge: for each question, if student has typed something since the last save (track via `dirtyAnswers` set), keep local; else use server value
  4. Update `submission` state with fresh server submission
  5. Show a dismissable banner: "Your test was updated in another tab — local changes preserved where possible."

### Task B.1.4 — Track dirty answers state
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: Add `dirtyQuestionIds` Set state. In `handleAnswerChange`, add the question ID to `dirtyQuestionIds`. After a successful save, clear `dirtyQuestionIds`. Use this set during 409 merge.

---

## B.2 Backend — Optimistic Lock on `grade_submission`

### Task B.2.1 — `grade_submission` accepts `client_updated_at`
- **File**: `backend/apps/assessments/views.py`
- **Change**: Same pattern as B.1.1, inside `grade_submission` action before the transaction:
  ```python
  client_updated_at_raw = request.data.get("client_updated_at")
  if client_updated_at_raw:
      client_updated_at = parse_datetime(client_updated_at_raw)
      if client_updated_at and submission.updated_at > client_updated_at:
          return Response(
              {"error": "Submission was updated since you loaded this page.", "conflict": True},
              status=status.HTTP_409_CONFLICT,
          )
  ```

### Task B.2.2 — Admin grade page sends `updated_at`
- **File**: `admin/src/pages/submissions/grade.tsx`
- **Change**: Store `submission.updatedAt` when submission loads. Include it in the grade request payload. On 409, show toast: "Submission was updated by another grader — please refresh."

---

## B.3 Backend — File Storage Leaks

### Task B.3.1 — `upload_document`: delete old file before overwriting
- **File**: `backend/apps/assessments/views.py`
- **Change**: In `upload_document`, before `answer.file_answer = uploaded_file`:
  ```python
  if answer.file_answer:
      answer.file_answer.delete(save=False)  # Remove from storage
  ```

### Task B.3.2 — `pre_delete` signal on `Submission` cleans up files
- **File**: `backend/apps/assessments/signals.py`
- **Change**: Add signal:
  ```python
  from django.db.models.signals import pre_delete

  @receiver(pre_delete, sender=Submission)
  def cleanup_submission_files(sender, instance, **kwargs):
      """Delete physical files when a submission is deleted."""
      for answer in instance.answers.all():
          if answer.file_answer:
              answer.file_answer.delete(save=False)
  ```

### Task B.3.3 — `pre_delete` signal on `Answer` cleans up files
- **File**: `backend/apps/assessments/signals.py`
- **Change**: Add signal:
  ```python
  @receiver(pre_delete, sender=Answer)
  def cleanup_answer_files(sender, instance, **kwargs):
      if instance.file_answer:
          instance.file_answer.delete(save=False)
  ```

### Task B.3.4 — Question type change away from `document_upload`: clean orphaned files
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: In `_update_references_to_new_instances` or `_create_new_questions_and_update_references`, when an existing question's type changes FROM `document_upload` to something else, delete file_answers for all affected answers:
  ```python
  if (existing_question.question_type == "document_upload"
          and question_data.get("question_type") != "document_upload"):
      for answer in existing_question.answers.all():
          if answer.file_answer:
              answer.file_answer.delete(save=False)
              answer.file_answer = None
              answer.save()
  ```

---

## B.4 Backend — Lecturer Permission Fix

### Task B.4.1 — Change `AND` to `OR` in lecturer queryset
- **File**: `backend/apps/assessments/views.py`
- **Change**: Lines 524-530:
  ```python
  if self.request.user.role == "lecturer":
      queryset = queryset.filter(
          models.Q(test__created_by=self.request.user)
          | models.Q(test__course__lecturer=self.request.user)
      )
  ```
  This allows a lecturer to see submissions for tests they created OR for courses they're assigned to.

---

## B.5 Backend — Score & Validation Guards

### Task B.5.1 — `Question.max_points` minimum value validator
- **File**: `backend/apps/assessments/models.py`
- **Change**: Update field definition:
  ```python
  max_points = models.FloatField(
      default=1.0,
      validators=[MinValueValidator(0.01)],
      help_text="Maximum points possible for this question"
  )
  ```
- **Migration**: `AlterField` migration.

### Task B.5.2 — Guard against zero `total_points` in score display
- **File**: `backend/apps/assessments/models.py`
- **Change**: In `Submission.score` property, if `test.total_points == 0`, return `0.0` (not crash). Add guard in `completion_percentage` for zero `total_questions` (already exists).

### Task B.5.3 — Clamp displayed `points_earned` in `AnswerSerializer`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: In `AnswerSerializer`, override `to_representation`:
  ```python
  def to_representation(self, instance):
      data = super().to_representation(instance)
      if (data.get("points_earned") is not None
              and data.get("max_points") is not None):
          data["points_earned"] = min(data["points_earned"], data["max_points"])
      return data
  ```

---

## B.6 Backend — Test Lifecycle Guards

### Task B.6.1 — Test deletion with submissions: require `confirm=true`
- **File**: `backend/apps/assessments/views.py`
- **Change**: Override `destroy` in `TestViewSet`:
  ```python
  def destroy(self, request, *args, **kwargs):
      test = self.get_object()
      if test.submissions.exists():
          confirm = request.data.get("confirm") or request.query_params.get("confirm")
          if confirm != "true":
              return Response(
                  {
                      "error": "This test has existing submissions. Pass confirm=true to delete.",
                      "submission_count": test.submissions.count(),
                  },
                  status=status.HTTP_400_BAD_REQUEST,
              )
      return super().destroy(request, *args, **kwargs)
  ```

### Task B.6.2 — Test cohort/course change: warn or block
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: In `TestSerializer.update()`, before saving fields, check if `course` or `cohort` changed AND test has non-draft submissions:
  ```python
  if "course" in validated_data or "cohort" in validated_data:
      has_active_submissions = instance.submissions.filter(
          status__in=["submitted", "graded", "returned"]
      ).exists()
      if has_active_submissions and not self.context.get("force", False):
          raise serializers.ValidationError(
              "Cannot change course or cohort: test has active submissions. "
              "Pass force=true to override."
          )
  ```

### Task B.6.3 — Test published-again notification dedup
- **File**: `backend/apps/assessments/signals.py`
- **Change**: In `trigger_test_published_notification`, check if a notification was already sent for this test in the last 5 minutes to avoid re-publish spam:
  ```python
  from django.core.cache import cache
  def trigger_test_published_notification(test_id):
      cache_key = f"test_published_notif_{test_id}"
      if cache.get(cache_key):
          return  # Already sent recently
      cache.set(cache_key, True, timeout=300)
      send_test_notification.delay(test_id, "test_published")
  ```

---

## B.7 Backend — Notification Hygiene

### Task B.7.1 — `test_updated` notification: diff-check before firing
- **File**: `backend/apps/assessments/signals.py`
- **Change**: In `handle_test_saved` (post_save for Test), track which fields actually changed. Skip `test_updated` notification if only `updated_at` / `total_points` changed (those are internal saves):
  ```python
  meaningful_fields = {"title", "description", "instructions", "available_from", "available_until", "status"}
  changed_fields = set(kwargs.get("update_fields", []) or [])
  if changed_fields and not (changed_fields & meaningful_fields):
      return  # No meaningful change — skip notification
  ```
  When `update_fields=None` (full save), fire normally.

### Task B.7.2 — `submission_returned` throttle
- **File**: `backend/apps/notifications/tasks.py`
- **Change**: In `send_submission_returned_notification_to_student`, use Django cache to deduplicate:
  ```python
  from django.core.cache import cache
  cache_key = f"submission_returned_notif_{submission_id}"
  if cache.get(cache_key):
      return
  cache.set(cache_key, True, timeout=60)
  # ... proceed with notification
  ```

### Task B.7.3 — `submission_graded` fires only on first grade
- **File**: `backend/apps/assessments/signals.py`
- **Change**: In `handle_submission_saved`, when `status` transitions to `graded`, check if `grading_history` is non-empty (meaning this is a re-grade). If so, fire `submission_regraded` type instead of `submission_graded`:
  ```python
  if new_status == "graded":
      if instance.grading_history:
          event_type = "submission_regraded"
      else:
          event_type = "submission_graded"
  ```
  Add `submission_regraded` to notification type choices if it needs distinct handling; otherwise fire nothing on re-grade.

---

## B.8 Backend — Admin Queryset Visibility

### Task B.8.1 — Admin can see in-progress stats (opt-in)
- **File**: `backend/apps/assessments/views.py`
- **Change**: In `SubmissionViewSet.get_queryset`, for admin users allow optional `include_in_progress` query param:
  ```python
  if self.request.user.role == "admin":
      include_in_progress = self.request.query_params.get("include_in_progress")
      if not include_in_progress:
          queryset = queryset.exclude(status="in_progress")
  elif self.request.user.role == "lecturer":
      queryset = queryset.exclude(status="in_progress")
  ```

---

## B.9 Frontend — Concurrency UX

### Task B.9.1 — Save indicator with timestamp
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: Track `lastSavedAt` state (Date | null). Set it after each successful auto-save or manual save. Render relative timestamp:
  ```tsx
  {lastSavedAt && (
    <span className="text-muted-foreground text-xs">
      Saved {formatRelativeTime(lastSavedAt)}
    </span>
  )}
  ```
  Use a 10s interval to re-render the relative time string.

### Task B.9.2 — `beforeunload` prompt when dirty answers exist
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: Add effect:
  ```typescript
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyQuestionIds.size > 0 && submission?.status === "in_progress") {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyQuestionIds, submission]);
  ```

### Task B.9.3 — Conflict banner component
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: Add dismissable `Alert` at the top of the test page that appears when a 409 merge occurs. Message: "Your submission was updated in another session. Your local changes to [N] questions were preserved."

---

## B.10 Admin — Test Deletion Confirmation

### Task B.10.1 — Double-confirm before deleting a test with submissions
- **File**: `admin/src/pages/tests/show.tsx` (or wherever delete is triggered)
- **Change**: On delete click, if test has submissions, show a modal:
  - "This test has X submissions. Deleting it will permanently remove all student answers."
  - Two-step confirm: type test title to confirm, then click delete
  - On confirm, send DELETE with `?confirm=true`

---

## B.11 Admin — Test Cohort/Course Change Warning

### Task B.11.1 — Warn when changing cohort or course on a live test
- **File**: `admin/src/pages/tests/edit.tsx`
- **Change**: On form submit, if `course` or `cohort` changed from original values AND `test.totalSubmissions > 0`, show inline warning before submitting:
  ```
  "Changing the course/cohort will make this test invisible to students in the 
   original cohort. Their submissions will still exist but won't be accessible 
   from the student portal."
  ```
  Require explicit checkbox acknowledgement to proceed.

---

## B.12 Backend — Tests for Phase B

### Task B.12.1 — Concurrency tests (`test_views.py`)
- **Test cases**:
  1. `test_upsert_with_stale_updated_at_returns_409` — client sends old `updated_at`, gets 409
  2. `test_upsert_without_client_updated_at_succeeds` — no version field = last-write-wins
  3. `test_grade_with_stale_updated_at_returns_409`
  4. `test_file_deleted_from_storage_on_overwrite` — asserts file storage mock called with delete
  5. `test_file_deleted_from_storage_on_submission_delete`
  6. `test_file_deleted_when_question_type_changes_from_document_upload`
  7. `test_lecturer_sees_own_created_submissions` — OR logic test
  8. `test_lecturer_sees_course_submissions_not_created_by_them` — OR logic test
  9. `test_delete_test_with_submissions_requires_confirm`
  10. `test_delete_test_without_submissions_succeeds_without_confirm`
  11. `test_cohort_change_blocked_with_active_submissions`
  12. `test_test_updated_notification_skipped_on_internal_save`
  13. `test_max_points_below_minimum_rejected` — validator test

---

## B.13 Frontend — Types & Hooks Updates

### Task B.13.1 — Track `updated_at` through hooks
- **File**: `frontend/hooks/tests.ts`
- **Change**: `_saveAnswers` accepts optional `updatedAt: string` and includes in payload. `useTests.saveAnswers` signature updated to accept it.

### Task B.13.2 — Expose 409 response type
- **File**: `frontend/types/tests.ts`
- **Change**: Add:
  ```typescript
  export const conflictResponseSchema = z.object({
    error: z.string(),
    conflict: z.literal(true),
    current_submission: submissionDetailSchema,
  });
  export type ConflictResponse = z.infer<typeof conflictResponseSchema>;
  ```

---

## Execution Order

1. Backend concurrency (`B.1.1`)
2. Backend grade concurrency (`B.2.1`)
3. Backend file leak fixes (`B.3`)
4. Backend permission fix (`B.4.1`)
5. Backend validation guards (`B.5`)
6. Backend lifecycle guards (`B.6`)
7. Backend notification hygiene (`B.7`)
8. Backend admin visibility (`B.8.1`)
9. Backend tests (`B.12`)
10. Frontend types + hooks (`B.13`)
11. Frontend concurrency UX (`B.9`)
12. Admin deletion confirmation (`B.10`)
13. Admin cohort/course warning (`B.11`)

## Acceptance Criteria

- [ ] Two browser tabs auto-saving the same submission: second tab gets 409 and merges, not silently clobbers
- [ ] Grader submitting grade while another grader is on the same page: second grader gets 409
- [ ] Uploading a second file to a `document_upload` question: old file is deleted from storage
- [ ] Deleting a submission: all associated file answers removed from storage
- [ ] Changing question type away from `document_upload`: orphaned files removed from storage
- [ ] Lecturer assigned to a course sees submissions for that course even if they didn't create the test
- [ ] `Question.max_points = 0` is rejected by validator
- [ ] Deleting a test with submissions requires `confirm=true`; without it returns 400 with submission count
- [ ] Saving a test with only internal field changes (e.g., `total_points` recalc) does NOT fire `test_updated` notification to students
- [ ] `submission_returned` notification not sent twice within 60s for same submission
- [ ] Frontend "Save Progress" button shows timestamp of last successful save
- [ ] Navigating away with unsaved answers shows `beforeunload` browser prompt
- [ ] Admin changing test cohort/course shows warning if test has submissions; requires acknowledgement
