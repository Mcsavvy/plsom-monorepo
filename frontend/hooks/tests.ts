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
import { toastError, toastSuccess } from "@/lib/utils";

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
    if (query?.page_size)
      params.append("page_size", query.page_size.toString());
    if (query?.search) params.append("search", query.search);

    const url = `/tests/my-tests/${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await client.get<PaginatedTestsResponse>(url);

    if (response.status === 200) {
      const paginatedTests = paginatedTestsResponseSchema.parse(response.data);
      return paginatedTests.results;
    }
    throw new Error("Failed to fetch tests");
  } catch (error) {
    throw error;
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
    throw error;
  }
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
    toastError(error, "Failed to create submission.");
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
    throw new Error("Failed to save answers.");
  } catch (error) {
    toastError(error, "Failed to save answers.");
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
      toastSuccess("Test submitted successfully.");
      return response.data;
    }
    throw new Error("Failed to submit test.");
  } catch (error) {
    toastError(error, "Failed to submit test.");
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
    formData.append("question", questionId);
    formData.append("file", file);

    const response = await client.post<Submission>(
      `/submissions/${submissionId}/upload/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status === 200) {
      toastSuccess("File uploaded successfully.");
      return response.data;
    }
    throw new Error("Failed to upload file.");
  } catch (error) {
    toastError(error, "Failed to upload file.");
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
      toastSuccess("Document deleted successfully.");
      return response.data;
    }
    throw new Error("Failed to delete document.");
  } catch (error) {
    toastError(error, "Failed to delete document.");
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
    const response = await client.get<SubmissionDetail>(
      `/submissions/${submissionId}/`
    );
    if (response.status === 200) {
      return submissionDetailSchema.parse(response.data);
    }
    throw new Error("Failed to fetch submission details.");
  } catch (error) {
    toastError(error, "Failed to fetch submission details.");
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
    } else if (
      backendAnswer.boolean_answer !== null &&
      backendAnswer.boolean_answer !== undefined
    ) {
      frontendAnswers[questionId] = {
        question_id: questionId,
        boolean_answer: backendAnswer.boolean_answer,
      };
    } else if (
      backendAnswer.selected_options &&
      backendAnswer.selected_options.length > 0
    ) {
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
    .filter(answer => !("file_answer" in answer)) // Exclude file uploads - they're handled separately
    .map(answer => {
      const backendAnswer: BackendAnswer = {
        question: answer.question_id,
      };

      // Handle different answer types
      if ("text_answer" in answer) {
        backendAnswer.text_answer = answer.text_answer;
      } else if ("boolean_answer" in answer) {
        backendAnswer.boolean_answer = answer.boolean_answer;
      } else if ("selected_options" in answer) {
        backendAnswer.selected_options = answer.selected_options;
      } else if ("scripture_references" in answer) {
        // Convert scripture references to text format for backend
        const refs = answer.scripture_references.map(ref => {
          let refText = `${ref.book} ${ref.chapter}:${ref.verse_start}`;
          if (ref.verse_end) refText += `-${ref.verse_end}`;
          refText += ` (${ref.translation})`;
          return refText;
        });
        backendAnswer.text_answer = refs.join("; ");
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
    async (submissionId: number, questionId: string): Promise<Submission> => {
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
