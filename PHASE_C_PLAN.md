# Phase C — Tier 3: Advanced Features & Polish

## Goal

Surface the last layer of edge-case handling, advanced editorial controls for teachers, and
UX polish for students. These features are non-blocking but significantly raise the quality
bar once Phases A and B are stable in production.

## Prerequisites

- Phase A fully merged and deployed
- Phase B fully merged and deployed
- `Submission.grading_history` JSONField in use and populated

## Design Decisions (Phase C)

| Decision | Choice |
|---|---|
| Minor-edit flag | Teacher can mark a test edit as "minor" — skips breaking-change return flow |
| Extra-credit flag | Teacher can mark a new question as "extra credit" — adding it doesn't trigger return |
| Re-grade audit UI | Admin grade page shows full grading history timeline |
| Scripture validation | Backend validates `required_translation` against student answer text |
| Empty test after publish | Backend rejects submit on a test with zero questions |
| Double-submit guard | Frontend disables submit button after first click; no separate backend dedup |
| Accidental-return undo | 15-minute undo window via "undo return" endpoint; after that, permanent |
| Notification opt-out | Per-student notification preferences for test_updated, deadline_reminder |
| Student unenrolled mid-test | Submission allowed to complete; test hidden from portal but submission accessible |
| Offline draft storage | Browser IndexedDB cache for answers so network outage doesn't lose work |

---

## C.1 Backend — Minor-Edit Flag

Allows teachers to make small corrections (typos, formatting, clarification) without triggering
the breaking-change-return machinery for all students.

### Task C.1.1 — `minor_edit` request parameter on test update
- **File**: `backend/apps/assessments/views.py`
- **Change**: Thread a `minor_edit` boolean (alongside `force`) from request data into serializer context.

### Task C.1.2 — Skip return when `minor_edit=true`
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: In `_handle_question_updates_with_breaking_changes`, before returning submissions:
  ```python
  if self.context.get("minor_edit", False):
      # Skip return — just apply safe update, don't return any submissions
      self._safe_update_questions(test, questions_data)
      return False, 0
  ```
  `minor_edit` bypasses both the breaking-change detection AND the return step. It is the teacher's explicit acknowledgement that the change is cosmetic.
- **Note**: `minor_edit` and `force` are mutually exclusive. If both are passed, reject with an error.

### Task C.1.3 — `minor_edit` cannot delete questions or change types
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: Before accepting `minor_edit`, validate it only applies to non-structural changes. If any question was deleted, added, or type-changed, reject `minor_edit` with:
  ```python
  "minor_edit is not allowed when questions are added, deleted, or type-changed."
  ```
  Only allow `minor_edit` for: title/description/instruction text changes, max_points, word_count, options text (same option IDs, text-only update), `is_required` changes.

### Task C.1.4 — Admin UI: "Minor Edit" toggle in edit form
- **File**: `admin/src/pages/tests/edit.tsx`
- **Change**: Add a `Switch` in the form below the warning banner:
  - Label: "This is a minor edit (typo fixes, clarifications only)"
  - When enabled, sets `minor_edit: true` in the submit payload
  - When enabled, the "breaking changes" warning banner changes to: "Minor edit mode — students will NOT be notified or returned."
  - If submission triggers backend rejection of `minor_edit` (structural change), show error inline.

---

## C.2 Backend — Extra-Credit Questions

Allows a teacher to add a new question to an already-live test without returning all submissions,
by marking the question as optional and extra-credit.

### Task C.2.1 — `is_extra_credit` field on `Question`
- **File**: `backend/apps/assessments/models.py`
- **Change**: Add field:
  ```python
  is_extra_credit = models.BooleanField(
      default=False,
      help_text="Extra credit questions do not count toward max_points total and "
                "do not trigger re-submission when added to a live test."
  )
  ```
- **Migration**: `AddField` migration.

### Task C.2.2 — `calculate_total_points` excludes extra-credit
- **File**: `backend/apps/assessments/models.py`
- **Change**:
  ```python
  def calculate_total_points(self):
      total = sum(
          q.max_points or 0
          for q in self.questions.filter(is_extra_credit=False)
      )
      ...
  ```

### Task C.2.3 — Breaking-change detection skips extra-credit additions
- **File**: `backend/apps/assessments/serializers.py`
- **Change**: In `_detect_breaking_changes`, when a new question is detected (incoming ID not in existing), check if it's extra-credit:
  ```python
  if not existing_question and question_data.get("is_extra_credit", False):
      continue  # New extra-credit question — not breaking
  ```

### Task C.2.4 — `grade_submission` treats extra-credit as optional
- **File**: `backend/apps/assessments/views.py`
- **Change**: In submit validation (Phase A, Task A.3.3), exclude extra-credit questions from required-question count. Students not penalized for skipping extra-credit.

### Task C.2.5 — Admin UI: "Extra Credit" checkbox on question form
- **File**: `admin/src/pages/tests/edit.tsx`
- **Change**: Add a `Checkbox` in each question card below `is_required`:
  - Label: "Extra Credit (optional, doesn't count toward total)"
  - Disabled when `is_required = true` (mutually exclusive)
  - Sets `is_extra_credit: true` in the question payload

### Task C.2.6 — Frontend: show extra-credit badge on question
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx` and `types/tests.ts`
- **Change**: Add `is_extra_credit` to `testQuestionSchema`. In the question header render:
  ```tsx
  {question.is_extra_credit && (
    <Badge variant="outline" className="text-xs text-green-600">
      Extra Credit
    </Badge>
  )}
  ```

---

## C.3 Backend — Accidental-Return Undo

When a teacher accidentally clicks "Return for Revision", they have a 15-minute window to undo it.

### Task C.3.1 — Track `returned_at` on Submission
- **File**: `backend/apps/assessments/models.py`
- **Change**: Add field:
  ```python
  returned_at = models.DateTimeField(
      null=True, blank=True,
      help_text="When this submission was most recently returned for revision"
  )
  ```
- Set it in `grade_submission` view when `return=true`.

### Task C.3.2 — `POST /submissions/{id}/undo-return/` endpoint
- **File**: `backend/apps/assessments/views.py`
- **Change**: New action on `SubmissionViewSet`:
  ```python
  @action(detail=True, methods=["post"], url_path="undo-return",
          permission_classes=[IsAuthenticated, IsLecturerOrAdmin])
  def undo_return(self, request, pk=None):
      submission = self.get_object()
      if submission.status != "returned":
          return Response({"error": "Submission is not in returned state"},
                          status=status.HTTP_400_BAD_REQUEST)

      if not submission.returned_at:
          return Response({"error": "Cannot determine when submission was returned"},
                          status=status.HTTP_400_BAD_REQUEST)

      from django.utils import timezone
      minutes_since_return = (timezone.now() - submission.returned_at).total_seconds() / 60
      if minutes_since_return > 15:
          return Response(
              {"error": f"Undo window has expired ({int(minutes_since_return)} min ago). "
                        "Returns can only be undone within 15 minutes."},
              status=status.HTTP_400_BAD_REQUEST,
          )

      # Restore to graded, pop last history entry back as current grading
      last_grade = (submission.grading_history or [{}])[-1]
      submission.status = "graded"
      submission.returned_at = None
      # Restore per-answer grading from history entry if present
      # (full restoration from history is best-effort; per-answer detail stored in grading_history)
      submission.save()
      serializer = self.get_serializer(submission)
      return Response(serializer.data)
  ```

### Task C.3.3 — Admin UI: "Undo Return" button with countdown
- **File**: `admin/src/pages/submissions/show.tsx`
- **Change**: When submission is `returned`, show "Undo Return (available for 15 min)" button. Use `returned_at` timestamp + client-side countdown. Disable after 15 minutes. On click, call `POST /submissions/{id}/undo-return/`.

---

## C.4 Backend — Scripture Reference Validation

The `scripture_reference` question type stores answers as freeform text but has a `required_translation` field that is never validated.

### Task C.4.1 — Server-side scripture translation validation
- **File**: `backend/apps/assessments/models.py`
- **Change**: In `Answer.validate_for_submission`, add a case for `scripture_reference`:
  ```python
  elif question_type == "scripture_reference":
      if self.question.required_translation and self.text_answer:
          translation = self.question.required_translation.upper()
          if f"({translation})" not in self.text_answer.upper():
              raise ValidationError(
                  f"Scripture reference must use the {translation} translation. "
                  f"Format: Book Chapter:Verse (TRANSLATION)"
              )
  ```
  This relies on the frontend formatting scripture refs as `"John 3:16 (NIV)"`.

### Task C.4.2 — Frontend: enforce translation in scripture answer input
- **File**: `frontend/components/tests/answers.tsx`
- **Change**: In the scripture reference answer component, if `question.required_translation` is set:
  - Pre-fill the translation dropdown with the required value
  - Lock the translation dropdown (disabled)
  - Show note: "Translation required: {required_translation}"

---

## C.5 Backend — Empty Test After Publish

### Task C.5.1 — Block submit on a zero-question published test
- **File**: `backend/apps/assessments/views.py`
- **Change**: In `SubmissionViewSet.submit`, add guard:
  ```python
  if submission.test.questions.count() == 0:
      return Response(
          {"error": "This test has no questions and cannot be submitted."},
          status=status.HTTP_400_BAD_REQUEST,
      )
  ```
  Note: Questions can be deleted after publish (a bug we don't fully block in this phase). This guard ensures submit doesn't succeed on an empty shell.

---

## C.6 Frontend — Double-Submit Guard

### Task C.6.1 — Disable submit button after first click
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: The existing `disabled={saving}` on the Submit button already prevents this IF `setSaving(true)` fires synchronously before the next click. Verify this is the case. If there's any async gap, wrap with a `submitting` ref:
  ```typescript
  const submittingRef = useRef(false);
  const handleSubmitTest = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try { ... } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };
  ```

---

## C.7 Backend — Notification Preferences

### Task C.7.1 — Per-student notification preference model
- **File**: `backend/apps/notifications/models.py`
- **Change**: Add `NotificationPreference` model:
  ```python
  class NotificationPreference(models.Model):
      student = models.OneToOneField(
          User, on_delete=models.CASCADE, related_name="notification_preferences"
      )
      test_updated = models.BooleanField(default=True)
      test_published = models.BooleanField(default=True)
      deadline_reminder = models.BooleanField(default=True)
      submission_graded = models.BooleanField(default=True)
      submission_returned = models.BooleanField(default=True)

      class Meta:
          verbose_name = "Notification Preference"
  ```

### Task C.7.2 — Notification tasks respect preferences
- **File**: `backend/apps/notifications/tasks.py`
- **Change**: At the start of each `send_*_notification` task, fetch the student's `NotificationPreference` (or use defaults if not set). Skip sending if the relevant preference is `False`.

### Task C.7.3 — Frontend: Notification preferences UI
- **File**: `frontend/app/(dashboard)/settings/` (new or existing settings page)
- **Change**: Add a "Notifications" section with toggles for each event type. Backed by a `GET/PATCH /api/notification-preferences/` endpoint.

### Task C.7.4 — Notification preferences API endpoints
- **File**: `backend/apps/notifications/views.py` (create if missing)
- **Change**: Simple `RetrieveUpdateAPIView` for `NotificationPreference` using the authenticated user as the lookup. `GET` returns current prefs (creates defaults on first access); `PATCH` updates fields.

---

## C.8 Frontend — Offline Draft Storage

Answers typed while offline or during a network outage are preserved in browser storage and
synced on reconnect.

### Task C.8.1 — Auto-save to `localStorage` on every change
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: In `handleAnswerChange`, after updating `answers` state, write to localStorage:
  ```typescript
  const DRAFT_KEY = `plsom_draft_${submissionId}`;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    answers: newAnswers,
    savedAt: new Date().toISOString(),
    submissionId,
  }));
  ```

### Task C.8.2 — Restore from `localStorage` on page load
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: In the `fetchTest` effect, after loading server answers, check for a local draft:
  ```typescript
  const DRAFT_KEY = `plsom_draft_${submissionId}`;
  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    const draft = JSON.parse(raw);
    if (draft.submissionId === submissionId) {
      // Merge: prefer local draft for each question (more recent)
      setAnswers(prev => ({ ...prev, ...draft.answers }));
      showBanner("Restored unsaved answers from local draft.");
    }
  }
  ```

### Task C.8.3 — Clear draft after successful server save
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: After `_saveAnswers` succeeds, call `localStorage.removeItem(DRAFT_KEY)`.

### Task C.8.4 — Clear draft after submission
- **File**: `frontend/app/(dashboard)/tests/[id]/take/page.tsx`
- **Change**: After `submitTest` succeeds, call `localStorage.removeItem(DRAFT_KEY)`.

---

## C.9 Backend — Student Mid-Submission Unenrollment

### Task C.9.1 — Allow submission to complete even if student unenrolled
- **File**: `backend/apps/assessments/views.py`
- **Change**: In `SubmissionViewSet.get_queryset` for students, change the cohort filter to:
  - Show submissions regardless of current enrollment status
  - Current behavior for `my_tests` (listing) already filters by enrollment — keep that
  - But for direct submission access (`/submissions/{id}/`), allow student to retrieve their own submission even if unenrolled from the cohort:
  ```python
  if self.request.user.role == "student":
      queryset = queryset.filter(student=self.request.user)
      # Note: do NOT filter by enrollment here — student can always view their own submissions
  ```
  `get_queryset` for students already does this (line 520) — verify no secondary filter is applied.

### Task C.9.2 — `my_test` detail endpoint: still accessible if enrollment dropped mid-test
- **File**: `backend/apps/assessments/views.py`
- **Change**: In `my_test` action (line 376), the enrollment check currently blocks unenrolled students from viewing the test. Add exception: if student has an existing `in_progress` submission, allow access so they can finish:
  ```python
  has_active_submission = test.submissions.filter(
      student=request.user, status="in_progress"
  ).exists()

  if not enrolled and not has_active_submission:
      return Response({"detail": "You don't have access to this test."},
                      status=status.HTTP_403_FORBIDDEN)
  ```

---

## C.10 Backend — Test Statistics Completeness

### Task C.10.1 — Include `returned` submissions in `statistics` count
- **File**: `backend/apps/assessments/views.py`
- **Change**: In the `statistics` action (line 418), update to be explicit about which statuses are included in which counts. Add `returned` to avg score calculation:
  ```python
  submissions = test.submissions.filter(
      status__in=["submitted", "graded", "returned"]
  )
  ...
  graded_submissions = test.submissions.filter(status__in=["graded"])
  # returned ones excluded from avg score since they have null score (by design from Phase A)
  ```
  Add new stats fields:
  - `in_progress_count`
  - `returned_count`
  - `auto_submitted_count` (if we add an `auto_submitted` flag in Phase A)

---

## C.11 Backend — Tests for Phase C

### Task C.11.1 — Feature tests
- **Test cases**:
  1. `test_minor_edit_skips_return` — minor_edit=true on text-change, no submissions returned
  2. `test_minor_edit_rejected_on_question_type_change` — structural minor_edit rejected
  3. `test_extra_credit_question_added_without_return` — is_extra_credit=true new question, no return
  4. `test_extra_credit_excluded_from_total_points`
  5. `test_undo_return_within_15_min` — status flips back to graded
  6. `test_undo_return_after_15_min_rejected`
  7. `test_scripture_translation_validation` — wrong translation rejected on submit
  8. `test_submit_empty_test_rejected` — zero-question test
  9. `test_notification_preference_respected` — preference off = no notification
  10. `test_unenrolled_student_can_finish_in_progress` — enrollment dropped, submit still works

---

## C.12 Frontend — Re-grade Audit Trail UI (Admin)

### Task C.12.1 — Grading history timeline in grade page
- **File**: `admin/src/pages/submissions/grade.tsx`
- **Change**: After the "Submission Overview" card, add a collapsible "Grading History" card:
  - Timeline view: each entry shows grader name, date, total score, general feedback
  - Collapsed by default; "Show history (N)" button
  - Most recent entry shown expanded if it's a re-grade scenario
  - Badge on header: "Regraded X times"

---

## Execution Order

1. Backend models (`C.1.1` through `C.3.1`, `C.4.1`, `C.7.1`) → migrations for `is_extra_credit`, `returned_at`, `NotificationPreference`
2. Backend serializers (`C.1.2`, `C.1.3`, `C.2.3`, `C.2.4`)
3. Backend views (`C.1.1`, `C.2.4`, `C.3.2`, `C.4`, `C.5.1`, `C.7.4`, `C.8`, `C.9`, `C.10`)
4. Backend tasks (`C.7.2`)
5. Backend tests (`C.11`)
6. Frontend types: add `is_extra_credit`, `returned_at` to schemas
7. Frontend hooks: add undo-return, notification-preferences calls
8. Frontend take-test page (`C.6.1`, `C.8.1`–`C.8.4`, scripture fix `C.4.2`)
9. Frontend settings page (`C.7.3`)
10. Admin edit page (`C.1.4`, `C.2.5`)
11. Admin show page (`C.3.3`)
12. Admin grade page (`C.12.1`)

## Acceptance Criteria

- [ ] Teacher marks an edit as "minor" — typo fix saved, no students returned, no notification spam
- [ ] Teacher attempts "minor edit" on a question type change — blocked with clear error
- [ ] Teacher adds an "extra credit" question to a published test — no submissions returned; question shows "Extra Credit" badge in student view
- [ ] Extra-credit question `max_points` not added to `test.total_points`
- [ ] Teacher accidentally returns a submission → clicks "Undo Return" within 15 minutes → submission reverts to `graded` state
- [ ] "Undo Return" attempt after 15 minutes returns a 400 with countdown info
- [ ] Scripture reference answer with wrong translation (when required) rejected on submit with clear message
- [ ] Submitting a test with zero questions returns 400
- [ ] Student turns off `test_updated` notifications — no longer receives them
- [ ] Answer typed while offline is stored in localStorage and restored on reconnect/reload
- [ ] Draft cleared from localStorage after successful server save
- [ ] Student unenrolled from cohort mid-test can still submit their in-progress submission
- [ ] Admin grade page shows full grading history timeline for regraded submissions
- [ ] Statistics endpoint returns `in_progress_count` and `returned_count` breakdown
