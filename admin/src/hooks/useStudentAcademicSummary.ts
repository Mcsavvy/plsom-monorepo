import { useCustom } from '@refinedev/core';

import type {
  AcademicSummary,
  AcademicSummaryResponse,
} from '@/types/academicSummary';
import { transformAcademicSummary } from '@/utils/academicSummary';

/** Grades, attendance and roll-ups for one student, in a single request. */
export const useStudentAcademicSummary = (studentId?: string | number) => {
  const {
    query: { isLoading, isError, error, refetch },
    result,
  } = useCustom<AcademicSummaryResponse>({
    url: `/students/${studentId}/academic-summary/`,
    method: 'get',
    errorNotification: false,
    queryOptions: {
      enabled: studentId !== undefined && studentId !== '',
      queryKey: ['students', 'academic-summary', String(studentId)],
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const raw = result?.data as AcademicSummaryResponse | undefined;
  const summary: AcademicSummary | undefined =
    raw && raw.summary ? transformAcademicSummary(raw) : undefined;

  return { summary, isLoading, isError, error, refetch };
};
