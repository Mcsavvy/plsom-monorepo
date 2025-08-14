import {
  usePagination,
  UsePaginationProps,
  PaginationControls,
} from './usePagination';

/**
 * Interface for Refine's useTable return value (the parts we need for pagination)
 */
export interface RefineTableData {
  current: number;
  setCurrent: (page: number) => void;
  pageSize: number;
  setPageSize?: (size: number) => void;
  pageCount?: number;
  tableQuery: {
    data?: {
      total?: number;
      data?: unknown[];
    };
    isLoading?: boolean;
  };
}

export interface UseTablePaginationProps
  extends Omit<
    UsePaginationProps,
    'current' | 'pageSize' | 'total' | 'onPageChange' | 'onPageSizeChange'
  > {
  table: RefineTableData;
}

/**
 * Hook that creates pagination controls from Refine's useTable data.
 * This bridges our generic usePagination hook with Refine's useTable.
 */
export function useTablePagination({
  table,
  ...paginationProps
}: UseTablePaginationProps): PaginationControls & {
  isLoading: boolean;
  hasData: boolean;
} {
  const {
    current,
    setCurrent,
    pageSize,
    setPageSize,
    tableQuery: { data, isLoading = false },
  } = table;

  const total = data?.total || 0;
  const hasData = (data?.data?.length || 0) > 0;

  const pagination = usePagination({
    current,
    pageSize,
    total,
    onPageChange: setCurrent,
    onPageSizeChange: setPageSize
      ? (size: number) => setPageSize(size)
      : undefined,
    ...paginationProps,
  });

  return {
    ...pagination,
    isLoading,
    hasData,
  };
}

/**
 * Utility function to extract pagination data from Refine's useTable result
 */
export function extractPaginationData(table: RefineTableData) {
  return {
    current: table.current,
    pageSize: table.pageSize,
    total: table.tableQuery.data?.total || 0,
    pageCount: table.pageCount,
    isLoading: table.tableQuery.isLoading || false,
    hasData: (table.tableQuery.data?.data?.length || 0) > 0,
  };
}
