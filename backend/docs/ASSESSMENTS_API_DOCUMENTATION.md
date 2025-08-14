# Assessments API Documentation

## Overview

The Assessments API provides comprehensive test management functionality with support for complex question types, nested serializers, and automatic ordering. The API is built with Django REST Framework and includes OpenAPI documentation via drf-spectacular.

## Key Features

- **Single Endpoint Management**: One endpoint handles all test CRUD operations
- **Complex Question Management**: Automatic deletion of orphaned questions, ordering based on array position
- **Multiple Question Types**: Support for text, essay, multiple choice, file uploads, scripture references, and more
- **Nested Serialization**: Full support for questions and options within test objects
- **Role-based Permissions**: Different access levels for admins, lecturers, and students
- **Automatic Ordering**: Questions and options are ordered based on their position in the request array

## API Endpoints

### Tests

#### Base URL: `/api/tests/`

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/tests/` | List all tests | Authenticated users |
| POST | `/api/tests/` | Create a new test | Lecturers/Admins only |
| GET | `/api/tests/{id}/` | Get test details | Authenticated users |
| PUT | `/api/tests/{id}/` | Update test (full) | Lecturers/Admins only |
| PATCH | `/api/tests/{id}/` | Update test (partial) | Lecturers/Admins only |
| DELETE | `/api/tests/{id}/` | Delete test | Lecturers/Admins only |

#### Custom Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tests/{id}/duplicate/` | Create a copy of the test |
| POST | `/api/tests/{id}/publish/` | Publish a draft test |
| POST | `/api/tests/{id}/archive/` | Archive a published test |
| POST | `/api/tests/{id}/unarchive/` | Move published/archived test back to draft |
| GET | `/api/tests/{id}/statistics/` | Get test statistics |

### Submissions

#### Base URL: `/api/submissions/`

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/submissions/` | List submissions | Role-based filtering |
| POST | `/api/submissions/` | Start a test submission | Students |
| GET | `/api/submissions/{id}/` | Get submission details | Owner or Lecturer |
| PUT | `/api/submissions/{id}/` | Update submission | Owner or Lecturer |
| DELETE | `/api/submissions/{id}/` | Delete submission | Owner (drafts only) |
| POST | `/api/submissions/{id}/submit/` | Submit test for grading | Owner |

## Data Structure

### Test Object

```json
{
  "id": 1,
  "title": "Theology Final Exam",
  "description": "Comprehensive theology examination",
  "instructions": "Answer all questions thoroughly",
  "course": 1,
  "cohort": 1,
  "created_by": 1,
  "time_limit_minutes": 120,
  "max_attempts": 2,
  "allow_review_after_submission": true,
  "randomize_questions": false,
  "status": "published",
  "available_from": "2024-01-15T09:00:00Z",
  "available_until": "2024-01-20T17:00:00Z",
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-12T14:30:00Z",
  "total_questions": 5,
  "total_submissions": 25,
  "is_available": true,
  "questions": [
    {
      "id": "uuid-here",
      "question_type": "single_choice",
      "title": "What is the primary theme of Romans?",
      "description": "Choose the best answer",
      "is_required": true,
      "order": 0,
      "options": [
        {
          "id": "option-uuid-1",
          "text": "Justification by faith",
          "order": 0,
          "is_correct": true
        },
        {
          "id": "option-uuid-2",
          "text": "Church discipline",
          "order": 1,
          "is_correct": false
        }
      ]
    }
  ]
}
```

### Question Types

The API supports the following question types:

1. **text** - Short answer questions
2. **essay** - Long response questions
3. **yes_no** - Yes/No questions
4. **single_choice** - Single selection from options
5. **multiple_choice** - Multiple selections from options
6. **scripture_reference** - Bible verse references
7. **document_upload** - File upload questions
8. **reflection** - Spiritual reflection questions
9. **ministry_plan** - Ministry planning questions
10. **theological_position** - Theological position papers
11. **case_study** - Ministry case studies
12. **sermon_outline** - Sermon outline questions

## Request/Response Examples

### Creating a Test with Questions

```json
POST /api/tests/
{
  "title": "New Testament Survey",
  "description": "Survey of New Testament books",
  "course": 1,
  "cohort": 1,
  "time_limit_minutes": 90,
  "max_attempts": 1,
  "status": "draft",
  "questions": [
    {
      "question_type": "single_choice",
      "title": "Who wrote the Gospel of John?",
      "description": "Select the correct author",
      "is_required": true,
      "options": [
        {
          "text": "John the Apostle",
          "is_correct": true
        },
        {
          "text": "John the Baptist",
          "is_correct": false
        }
      ]
    },
    {
      "question_type": "essay",
      "title": "Explain the concept of grace",
      "description": "Write a detailed explanation",
      "is_required": true,
      "min_word_count": 200,
      "max_word_count": 500
    }
  ]
}
```

### Updating a Test (Smart Strategy Based on Submission Status)

The API uses different update strategies based on whether the test has existing submissions:

#### For Tests Without Submissions (Clean Slate):
1. **Delete all existing questions** and their options
2. **Create fresh questions** from the provided data
3. **Preserve IDs** sent from frontend for referential integrity
4. **Ordering**: Based on array position (0, 1, 2, etc.)

#### For Tests With Submissions (Protected Mode):
1. **Both draft and published**: Conservative updates only - preserve existing questions with answers
2. **Safe field updates**: Only allow updates to non-structural fields (title, description)
3. **No cascading deletes**: Questions with existing answers are protected
4. **Option protection**: Existing answer references to options are preserved

```json
PUT /api/tests/1/
{
  "title": "Updated Test Title",
  "questions": [
    {
      "id": "existing-question-uuid",
      "title": "Updated question title",
      "question_type": "text"
    },
    {
      "question_type": "single_choice",
      "title": "New question (no ID)",
      "options": [
        {"text": "Option 1"},
        {"text": "Option 2"}
      ]
    }
  ]
}
```

**For tests without submissions**, this will:
- Delete all existing questions and options for the test
- Create the first question with the specified ID (preserving referential integrity)
- Create a new question with a fresh UUID for the second question
- Set question orders to 0 and 1 respectively

**For tests with submissions** (both draft and published), the API will:
- Use conservative updates to protect existing student answers
- Allow safe field updates (titles, descriptions, word counts, etc.)
- Protect questions that have student answers from deletion
- Preserve existing answer references to options

> **🛡️ Answer Protection**: The API automatically detects existing submissions and switches to a conservative update mode to protect student data.

## Data Protection Levels

The API implements intelligent data protection based on the test's state and existing submissions:

| Test Status | Has Submissions | Update Behavior | Reason |
|-------------|-----------------|-----------------|---------|
| Draft | No | ✅ Full Edit (Delete & Recreate) | Safe - no student data exists |
| Draft | Yes | ⚠️ Conservative Edit | Protect existing answers |
| Published | No | ✅ Full Edit (Delete & Recreate) | Safe - no student data exists |
| Published | Yes | ⚠️ Conservative Edit | Protect existing answers |

### Protection Details

- **Full Edit**: Complete delete and recreate with ID preservation
- **Conservative Edit**: Safe field updates, existing questions with answers are protected, new questions can be added, questions without answers can be deleted

### Recommended Workflow

1. **Development Phase**: Use draft status for maximum flexibility
2. **Testing Phase**: Publish when ready for student access
3. **After Submissions**: Conservative updates allow safe modifications to both draft and published tests
4. **Major Restructuring**: Use duplicate action if you need to completely restructure the test
5. **Safe Updates**: Update question titles, descriptions, word counts without breaking existing answers

## Permission System

### Role-Based Access

1. **Admins**: Full access to all tests and submissions
2. **Lecturers**: Can manage tests they created, view submissions for their tests
3. **Students**: Can view published tests from their cohorts, create/manage their own submissions

### Test Visibility

- Students only see published tests from cohorts they belong to
- Lecturers see tests they created
- Admins see all tests

## Error Handling

The API uses DRF's standardized error responses:

```json
{
  "type": "validation_error",
  "errors": [
    {
      "code": "required",
      "detail": "This field is required.",
      "attr": "title"
        }
    ]
}
```

## Filtering and Search

### Tests
- **Search**: `title`, `description`, `course__name`, `cohort__name`
- **Ordering**: `created_at`, `updated_at`, `title`, `available_from`, `available_until`

### Submissions
- **Search**: `test__title`, `student__first_name`, `student__last_name`
- **Ordering**: `created_at`, `submitted_at`, `score`

## Best Practices

1. **Check submission status** - tests with existing answers have update restrictions
2. **Preserve IDs when needed** - include ID field to maintain referential integrity across updates
3. **Validate question types** match expected options (choice questions need options)
4. **Use duplicate for major changes** - if you need to restructure a test with submissions, duplicate it first
5. **Order matters** - questions will be ordered by array position
6. **Test before publishing** - use draft status for development where you have full editing flexibility
7. **Safe updates only** - published tests with submissions only allow non-structural changes

## API Documentation

Full interactive API documentation is available at:
- Swagger UI: `/docs`
- OpenAPI Schema: `/schema`

The documentation includes all endpoints, request/response schemas, and example payloads.
