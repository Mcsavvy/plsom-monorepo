"use client";

import { useCallback } from "react";
import { useClient } from "./axios";
import {
  TestDetail,
  TestListItem,
  TestsQuery,
  PaginatedTestsResponse,
  testDetailSchema,
  paginatedTestsResponseSchema,
  TestCardData,
  transformTestToCardData,
  CreateSubmission,
  Submission,
  SubmissionDetail,
  submissionDetailSchema,
  BackendAnswer,
  BackendAnswerDetail,
  FrontendAnswer,
} from "@/types/tests";

/**
 * Get all tests for the current student
 */
async function _getMyTests(
  client: ReturnType<typeof useClient>,
  query?: TestsQuery
): Promise<TestListItem[]> {
  try {
    const params = new URLSearchParams();
    
    if (query?.ordering) params.append("ordering", query.ordering);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.page_size) params.append("page_size", query.page_size.toString());
    if (query?.search) params.append("search", query.search);

    const url = `/tests/my-tests/${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await client.get<PaginatedTestsResponse>(url);
    
    if (response.status === 200) {
      const paginatedTests = paginatedTestsResponseSchema.parse(response.data);
      return paginatedTests.results;
    }
    throw new Error("Failed to fetch tests");
  } catch (error) {
    // Return mock data for development/demo purposes
    console.warn("Using mock tests data for development");
    return getMockTests();
  }
}

/**
 * Get detailed information about a specific test for the current student
 */
async function _getTestDetails(
  client: ReturnType<typeof useClient>,
  testId: number
): Promise<TestDetail> {
  try {
    const response = await client.get<TestDetail>(`/tests/${testId}/my-test/`);
    if (response.status === 200) {
      const testData = testDetailSchema.parse(response.data);
      return testData;
    }
    throw new Error("Failed to fetch test details");
  } catch (error) {
    // Return mock data for development/demo purposes
    console.warn("Using mock test detail data for development");
    const mockTests = getMockTests();
    const test = mockTests.find(t => t.id === testId);
    if (!test) {
      throw new Error("Test not found");
    }
    // Add mock questions to the test
    return {
      ...test,
      questions: getMockQuestions(),
    };
  }
}

/**
 * Mock tests data for development/demo purposes
 */
function getMockTests(): TestListItem[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      id: 1,
      title: "Biblical Interpretation Final Exam",
      description: "Comprehensive assessment of hermeneutical principles and methods.",
      instructions: "Answer all questions thoroughly. Use specific examples from Scripture where appropriate.",
      time_limit_minutes: 120,
      max_attempts: 2,
      allow_review_after_submission: true,
      status: "published",
      available_from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      available_until: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      is_available: true,
      course_name: "Biblical Interpretation",
      cohort_name: "Fall 2024 Cohort",
      created_by_name: "Dr. Caleb Stone",
      total_questions: 15,
      my_submission: null,
      my_latest_submission_id: null,
      my_submission_status: "Not Started",
      attempts_remaining: 2,
      can_attempt: true,
      created_at: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Systematic Theology Quiz",
      description: "Assessment on the doctrine of God and divine attributes.",
      instructions: "Choose the best answer for each question. Some questions may have multiple correct answers.",
      time_limit_minutes: 45,
      max_attempts: 3,
      allow_review_after_submission: false,
      status: "published",
      available_from: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      available_until: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_available: true,
      course_name: "Systematic Theology",
      cohort_name: "Fall 2024 Cohort",
      created_by_name: "Prof. Miriam Hayes",
      total_questions: 10,
      my_submission: {
        id: 1,
        test: 2,
        attempt_number: 1,
        status: "in_progress",
        started_at: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        submitted_at: null,
        score: null,
        max_score: null,
        completion_percentage: 60,
        time_spent_minutes: 25,
      },
      my_latest_submission_id: 1,
      my_submission_status: "In Progress",
      attempts_remaining: 2,
      can_attempt: true,
      created_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "Ministry Leadership Case Study",
      description: "Analyze practical ministry scenarios and provide strategic solutions.",
      instructions: "Read each scenario carefully and provide detailed responses based on biblical principles and practical wisdom.",
      time_limit_minutes: null,
      max_attempts: 1,
      allow_review_after_submission: true,
      status: "published",
      available_from: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      available_until: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_available: true,
      course_name: "Ministry Leadership",
      cohort_name: "Fall 2024 Cohort",
      created_by_name: "Dr. Elizabeth Carter",
      total_questions: 5,
      my_submission: {
        id: 2,
        test: 3,
        attempt_number: 1,
        status: "graded",
        started_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        submitted_at: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        score: 85,
        max_score: 100,
        completion_percentage: 100,
        time_spent_minutes: 180,
      },
      my_latest_submission_id: 2,
      my_submission_status: "Graded",
      attempts_remaining: 0,
      can_attempt: false,
      created_at: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      title: "Church History Midterm",
      description: "Comprehensive examination covering early church history through the Reformation.",
      instructions: "Answer all questions. Provide specific dates, names, and historical context where applicable.",
      time_limit_minutes: 90,
      max_attempts: 1,
      allow_review_after_submission: false,
      status: "published",
      available_from: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      available_until: new Date(today.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago (overdue)
      is_available: false,
      course_name: "Church History",
      cohort_name: "Fall 2024 Cohort",
      created_by_name: "Dr. Michael Thompson",
      total_questions: 20,
      my_submission: null,
      my_latest_submission_id: null,
      my_submission_status: "Not Started",
      attempts_remaining: 1,
      can_attempt: false,
      created_at: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Mock questions for development/demo purposes
 */
function getMockQuestions() {
  return [
    {
      id: "q1-uuid",
      question_type: "essay" as const,
      title: "Explain the historical-critical method of biblical interpretation.",
      description: "Provide a comprehensive overview including its development, key principles, and both strengths and limitations.",
      is_required: true,
      order: 1,
      min_word_count: 300,
      max_word_count: 500,
      text_placeholder: "Begin your response here...",
    },
    {
      id: "q2-uuid",
      question_type: "single_choice" as const,
      title: "Which hermeneutical principle emphasizes the importance of understanding the original audience?",
      description: "Select the most appropriate answer.",
      is_required: true,
      order: 2,
      options: [
        { id: "opt1", text: "Grammatical-historical interpretation", order: 1, is_correct: true },
        { id: "opt2", text: "Allegorical interpretation", order: 2, is_correct: false },
        { id: "opt3", text: "Typological interpretation", order: 3, is_correct: false },
        { id: "opt4", text: "Moral interpretation", order: 4, is_correct: false },
      ],
    },
    {
      id: "q3-uuid",
      question_type: "multiple_choice" as const,
      title: "Which of the following are valid principles of biblical hermeneutics? (Select all that apply)",
      description: "Choose all correct answers.",
      is_required: true,
      order: 3,
      options: [
        { id: "opt5", text: "Scripture interprets Scripture", order: 1, is_correct: true },
        { id: "opt6", text: "Context determines meaning", order: 2, is_correct: true },
        { id: "opt7", text: "Personal experience supersedes text", order: 3, is_correct: false },
        { id: "opt8", text: "Cultural background is irrelevant", order: 4, is_correct: false },
        { id: "opt9", text: "Literary genre affects interpretation", order: 5, is_correct: true },
      ],
    },
    {
      id: "q4-uuid",
      question_type: "scripture_reference" as const,
      title: "Provide a scripture reference that demonstrates the principle of progressive revelation.",
      description: "Include the book, chapter, and verse(s), and briefly explain how it illustrates progressive revelation.",
      is_required: true,
      order: 4,
      required_translation: "ESV",
      allow_multiple_verses: true,
    },
    {
      id: "q5-uuid",
      question_type: "document_upload" as const,
      title: "Upload your exegetical paper on Romans 8:28-30",
      description: "Submit your completed exegetical analysis as discussed in class.",
      is_required: false,
      order: 5,
      max_file_size_mb: 10,
      allowed_file_types: "pdf,doc,docx",
    },
  ];
}

/**
 * Create a new submission for a test
 */
async function _createSubmission(
  client: ReturnType<typeof useClient>,
  data: CreateSubmission
): Promise<Submission> {
  try {
    const response = await client.post<Submission>(`/submissions/`, data);
    if (response.status === 201) {
      return response.data;
    }
    throw new Error("Failed to create submission");
  } catch (error) {
    console.error("Error creating submission:", error);
    throw error;
  }
}

/**
 * Save answers to a submission (upsert answers)
 */
async function _saveAnswers(
  client: ReturnType<typeof useClient>,
  submissionId: number,
  answers: BackendAnswer[]
): Promise<Submission> {
  try {
    const response = await client.post<Submission>(
      `/submissions/${submissionId}/answers/`, 
      { answers }
    );
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to save answers");
  } catch (error) {
    console.error("Error saving answers:", error);
    throw error;
  }
}

/**
 * Submit a test (change status to submitted)
 */
async function _submitTest(
  client: ReturnType<typeof useClient>,
  submissionId: number
): Promise<Submission> {
  try {
    const response = await client.post<Submission>(
      `/submissions/${submissionId}/submit/`
    );
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to submit test");
  } catch (error) {
    console.error("Error submitting test:", error);
    throw error;
  }
}

/**
 * Upload a file for a document upload question
 */
async function _uploadFile(
  client: ReturnType<typeof useClient>,
  submissionId: number,
  questionId: string,
  file: File
): Promise<Submission> {
  try {
    const formData = new FormData();
    formData.append('question', questionId);
    formData.append('file', file);

    const response = await client.post<Submission>(
      `/submissions/${submissionId}/upload/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to upload file");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Delete an uploaded document for a document upload question
 */
async function _deleteDocument(
  client: ReturnType<typeof useClient>,
  submissionId: number,
  questionId: string
): Promise<Submission> {
  try {
    const response = await client.delete<Submission>(
      `/submissions/${submissionId}/delete-document/`,
      {
        data: {
          question: questionId,
        },
      }
    );
    
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to delete document");
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}

/**
 * Get detailed submission with answers
 */
async function _getSubmissionDetail(
  client: ReturnType<typeof useClient>,
  submissionId: number
): Promise<SubmissionDetail> {
  try {
    const response = await client.get<SubmissionDetail>(`/submissions/${submissionId}/`);
    if (response.status === 200) {
      return submissionDetailSchema.parse(response.data);
    }
    throw new Error("Failed to fetch submission details");
  } catch (error) {
    console.error("Error fetching submission details:", error);
    throw error;
  }
}

/**
 * Transform backend answers to frontend format
 */
function transformAnswersToFrontend(
  backendAnswers: BackendAnswerDetail[]
): Record<string, FrontendAnswer> {
  const frontendAnswers: Record<string, FrontendAnswer> = {};

  backendAnswers.forEach(backendAnswer => {
    if (!backendAnswer.has_answer) return; // Skip empty answers

    const questionId = backendAnswer.question;
    
    // Handle different answer types based on what's populated
    if (backendAnswer.text_answer) {
      frontendAnswers[questionId] = {
        question_id: questionId,
        text_answer: backendAnswer.text_answer,
      };
    } else if (backendAnswer.boolean_answer !== null && backendAnswer.boolean_answer !== undefined) {
      frontendAnswers[questionId] = {
        question_id: questionId,
        boolean_answer: backendAnswer.boolean_answer,
      };
    } else if (backendAnswer.selected_options && backendAnswer.selected_options.length > 0) {
      frontendAnswers[questionId] = {
        question_id: questionId,
        selected_options: backendAnswer.selected_options,
      };
    } else if (backendAnswer.file_answer) {
      frontendAnswers[questionId] = {
        question_id: questionId,
        file_url: backendAnswer.file_answer,
      };
    }
  });

  return frontendAnswers;
}

/**
 * Transform frontend answers to backend format (excluding file uploads)
 */
function transformAnswersToBackend(
  answers: Record<string, FrontendAnswer>,
  flaggedQuestions?: Set<string>
): BackendAnswer[] {
  return Object.values(answers)
    .filter(answer => !('file_answer' in answer)) // Exclude file uploads - they're handled separately
    .map(answer => {
      const backendAnswer: BackendAnswer = {
        question: answer.question_id,
      };

      // Handle different answer types
      if ('text_answer' in answer) {
        backendAnswer.text_answer = answer.text_answer;
      } else if ('boolean_answer' in answer) {
        backendAnswer.boolean_answer = answer.boolean_answer;
      } else if ('selected_options' in answer) {
        backendAnswer.selected_options = answer.selected_options;
      } else if ('scripture_references' in answer) {
        // Convert scripture references to text format for backend
        const refs = answer.scripture_references.map(ref => {
          let refText = `${ref.book} ${ref.chapter}:${ref.verse_start}`;
          if (ref.verse_end) refText += `-${ref.verse_end}`;
          refText += ` (${ref.translation})`;
          return refText;
        });
        backendAnswer.text_answer = refs.join('; ');
      }

      return backendAnswer;
    });
}

/**
 * Hook for managing test-related operations
 */
export function useTests() {
  const client = useClient();

  /**
   * Fetch all tests for the current student
   */
  const getMyTests = useCallback(
    async (query?: TestsQuery): Promise<TestListItem[]> => {
      return await _getMyTests(client, query);
    },
    [client]
  );

  /**
   * Fetch detailed information about a specific test
   */
  const getTestDetails = useCallback(
    async (testId: number): Promise<TestDetail> => {
      return await _getTestDetails(client, testId);
    },
    [client]
  );

  /**
   * Get tests formatted for UI components
   */
  const getMyTestsForUI = useCallback(
    async (query?: TestsQuery): Promise<TestCardData[]> => {
      const tests = await getMyTests(query);
      return tests.map(transformTestToCardData);
    },
    [getMyTests]
  );

  /**
   * Get test details formatted for UI
   */
  const getTestDetailsForUI = useCallback(
    async (testId: number): Promise<TestDetail> => {
      return await getTestDetails(testId);
    },
    [getTestDetails]
  );

  /**
   * Create a new test submission
   */
  const createSubmission = useCallback(
    async (testId: number): Promise<Submission> => {
      return await _createSubmission(client, { test: testId });
    },
    [client]
  );

  /**
   * Get detailed submission with answers
   */
  const getSubmissionDetail = useCallback(
    async (submissionId: number): Promise<SubmissionDetail> => {
      return await _getSubmissionDetail(client, submissionId);
    },
    [client]
  );

  /**
   * Load existing answers from a submission
   */
  const loadSubmissionAnswers = useCallback(
    async (submissionId: number): Promise<Record<string, FrontendAnswer>> => {
      const submissionDetail = await _getSubmissionDetail(client, submissionId);
      return transformAnswersToFrontend(submissionDetail.answers);
    },
    [client]
  );

  /**
   * Save answers to a submission (auto-save functionality)
   */
  const saveAnswers = useCallback(
    async (
      submissionId: number,
      answers: Record<string, FrontendAnswer>
    ): Promise<Submission> => {
      const backendAnswers = transformAnswersToBackend(answers);
      return await _saveAnswers(client, submissionId, backendAnswers);
    },
    [client]
  );

  /**
   * Upload a file for a document upload question
   */
  const uploadFile = useCallback(
    async (
      submissionId: number,
      questionId: string,
      file: File
    ): Promise<Submission> => {
      return await _uploadFile(client, submissionId, questionId, file);
    },
    [client]
  );

  /**
   * Delete an uploaded document for a document upload question
   */
  const deleteDocument = useCallback(
    async (
      submissionId: number,
      questionId: string
    ): Promise<Submission> => {
      return await _deleteDocument(client, submissionId, questionId);
    },
    [client]
  );

  /**
   * Submit a test for grading
   */
  const submitTest = useCallback(
    async (
      submissionId: number,
      answers: Record<string, FrontendAnswer>
    ): Promise<Submission> => {
      // First save the answers (excluding files which are handled separately)
      const backendAnswers = transformAnswersToBackend(answers);
      if (backendAnswers.length > 0) {
        await _saveAnswers(client, submissionId, backendAnswers);
      }

      // Then submit the test
      return await _submitTest(client, submissionId);
    },
    [client]
  );

  return {
    getMyTests,
    getTestDetails,
    getMyTestsForUI,
    getTestDetailsForUI,
    createSubmission,
    getSubmissionDetail,
    loadSubmissionAnswers,
    saveAnswers,
    uploadFile,
    deleteDocument,
    submitTest,
  };
}
