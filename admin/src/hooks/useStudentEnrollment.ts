import { useState, useCallback } from 'react';
import {
  useCustomMutation,
  useInvalidate,
  useNotification,
} from '@refinedev/core';
import type { HttpError } from '@refinedev/core';

interface EnrollmentActionOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  skipInvalidation?: boolean;
}

interface UseStudentEnrollmentReturn {
  enrollStudent: (
    studentId: number,
    cohortId: number,
    options?: EnrollmentActionOptions
  ) => Promise<void>;
  unenrollStudent: (
    studentId: number,
    cohortId: number,
    options?: EnrollmentActionOptions
  ) => Promise<void>;
  isEnrolling: boolean;
  isUnenrolling: boolean;
  enrollmentError: string | null;
  clearError: () => void;
}

export const useStudentEnrollment = (): UseStudentEnrollmentReturn => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const invalidate = useInvalidate();
  const { open } = useNotification();
  const { mutateAsync: enrollMutation } = useCustomMutation();
  const { mutateAsync: unenrollMutation } = useCustomMutation();

  const clearError = useCallback(() => {
    setEnrollmentError(null);
  }, []);

  const invalidateResources = useCallback(async () => {
    // Invalidate student data and enrollment data
    await Promise.all([
      invalidate({ resource: 'students', invalidates: ['list', 'detail'] }),
      invalidate({ resource: 'enrollments', invalidates: ['list'] }),
      invalidate({ resource: 'cohorts', invalidates: ['list', 'detail'] }),
    ]);
  }, [invalidate]);

  const enrollStudent = useCallback(
    async (
      studentId: number,
      cohortId: number,
      options: EnrollmentActionOptions = {}
    ): Promise<void> => {
      const { onSuccess, onError, skipInvalidation = false } = options;

      setIsEnrolling(true);
      setEnrollmentError(null);

      try {
        const response = await enrollMutation({
          url: `students/${studentId}/enroll/`,
          method: 'post',
          values: { cohort_id: cohortId },
          successNotification: false, // Handle notifications manually
          errorNotification: false, // Handle errors manually
        });

        // Invalidate relevant queries to refresh data
        if (!skipInvalidation) {
          await invalidateResources();
        }

        const message =
          response?.data?.message || 'Student enrolled successfully';

        // Show success notification
        open?.({
          type: 'success',
          message: 'Enrollment Successful',
          description: message,
        });

        onSuccess?.(message);
      } catch (error) {
        const httpError = error as HttpError;
        const errorMessage =
          httpError?.response?.data?.message ||
          httpError?.message ||
          'Failed to enroll student. Please try again.';

        setEnrollmentError(errorMessage);

        // Show error notification
        open?.({
          type: 'error',
          message: 'Enrollment Failed',
          description: errorMessage,
        });

        onError?.(errorMessage);
        throw error;
      } finally {
        setIsEnrolling(false);
      }
    },
    [enrollMutation, invalidateResources, open]
  );

  const unenrollStudent = useCallback(
    async (
      studentId: number,
      cohortId: number,
      options: EnrollmentActionOptions = {}
    ): Promise<void> => {
      const { onSuccess, onError, skipInvalidation = false } = options;

      setIsUnenrolling(true);
      setEnrollmentError(null);

      try {
        const response = await unenrollMutation({
          url: `/students/${studentId}/unenroll/`,
          method: 'post',
          values: { cohort_id: cohortId },
          successNotification: false, // Handle notifications manually
          errorNotification: false, // Handle errors manually
        });

        // Invalidate relevant queries to refresh data
        if (!skipInvalidation) {
          await invalidateResources();
        }

        const message =
          response?.data?.message || 'Student unenrolled successfully';

        // Show success notification
        open?.({
          type: 'success',
          message: 'Unenrollment Successful',
          description: message,
        });

        onSuccess?.(message);
      } catch (error) {
        const httpError = error as HttpError;
        const errorMessage =
          httpError?.response?.data?.message ||
          httpError?.message ||
          'Failed to unenroll student. Please try again.';

        setEnrollmentError(errorMessage);

        // Show error notification
        open?.({
          type: 'error',
          message: 'Unenrollment Failed',
          description: errorMessage,
        });

        onError?.(errorMessage);
        throw error;
      } finally {
        setIsUnenrolling(false);
      }
    },
    [unenrollMutation, invalidateResources, open]
  );

  return {
    enrollStudent,
    unenrollStudent,
    isEnrolling,
    isUnenrolling,
    enrollmentError,
    clearError,
  };
};
