import { useState, useMemo } from 'react';

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  showQuickJumper?: boolean;
}

export interface PaginationControls {
  current: number;
  pageSize: number;
  total: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  startIndex: number;
  endIndex: number;
  pageSizeOptions: number[];
  showSizeChanger: boolean;
  setCurrent: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

export interface UsePaginationProps {
  current?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number, page: number) => void;
}

export function usePagination({
  current: initialCurrent = 1,
  pageSize: initialPageSize = 10,
  total = 0,
  showSizeChanger = true,
  pageSizeOptions = [10, 20, 30, 40, 50],
  onPageChange,
  onPageSizeChange,
}: UsePaginationProps = {}): PaginationControls {
  const [current, setCurrent] = useState(initialCurrent);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const pageCount = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );

  const canPrevious = current > 1;
  const canNext = current < pageCount;

  const startIndex = (current - 1) * pageSize + 1;
  const endIndex = Math.min(current * pageSize, total);

  const handlePageChange = (page: number) => {
    const clampedPage = Math.max(1, Math.min(page, pageCount));
    setCurrent(clampedPage);
    onPageChange?.(clampedPage);
  };

  const handlePageSizeChange = (size: number) => {
    const newPageCount = Math.ceil(total / size);
    const newPage = Math.min(current, newPageCount);

    setPageSize(size);
    setCurrent(newPage);
    onPageSizeChange?.(size, newPage);
  };

  const goToFirst = () => handlePageChange(1);
  const goToLast = () => handlePageChange(pageCount);
  const goToPrevious = () => handlePageChange(current - 1);
  const goToNext = () => handlePageChange(current + 1);

  return {
    current,
    pageSize,
    total,
    pageCount,
    canPrevious,
    canNext,
    startIndex,
    endIndex,
    pageSizeOptions,
    showSizeChanger,
    setCurrent: handlePageChange,
    setPageSize: handlePageSizeChange,
    goToFirst,
    goToLast,
    goToPrevious,
    goToNext,
  };
}
