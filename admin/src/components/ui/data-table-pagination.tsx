import React from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationControls } from '@/hooks/usePagination';

interface DataTablePaginationProps {
  pagination: PaginationControls;
  isLoading?: boolean;
  className?: string;
}

export function DataTablePagination({
  pagination,
  isLoading = false,
  className = '',
}: DataTablePaginationProps) {
  const {
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
    setCurrent,
    setPageSize,
    goToFirst,
    goToLast,
    goToPrevious,
    goToNext,
  } = pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(pageCount - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < pageCount - 1) {
      rangeWithDots.push('...', pageCount);
    } else if (pageCount > 1) {
      rangeWithDots.push(pageCount);
    }

    return rangeWithDots.filter(
      (item, index, arr) => arr.indexOf(item) === index
    );
  };

  const pageNumbers = pageCount > 1 ? getPageNumbers() : [];

  return (
    <div
      className={`flex items-center justify-between space-x-2 py-4 ${className}`}
    >
      {/* Results info */}
      <div className='flex-1 text-sm text-muted-foreground'>
        {total > 0 ? (
          <>
            Showing <span className='font-medium'>{startIndex}</span> to{' '}
            <span className='font-medium'>{endIndex}</span> of{' '}
            <span className='font-medium'>{total}</span> entries
          </>
        ) : (
          'No entries found'
        )}
      </div>

      {/* Pagination controls */}
      <div className='flex items-center space-x-6 lg:space-x-8'>
        {/* Page size selector */}
        {showSizeChanger && (
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={value => setPageSize(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page navigation */}
        {pageCount > 1 && (
          <div className='flex items-center space-x-2'>
            <div className='text-sm font-medium'>
              Page {current} of {pageCount}
            </div>

            <Pagination>
              <PaginationContent>
                {/* First page button */}
                <PaginationItem>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={goToFirst}
                    disabled={!canPrevious || isLoading}
                    className='h-8 w-8 p-0'
                  >
                    <ChevronsLeft className='h-4 w-4' />
                    <span className='sr-only'>Go to first page</span>
                  </Button>
                </PaginationItem>

                {/* Previous page */}
                <PaginationItem>
                  <PaginationPrevious
                    onClick={goToPrevious}
                    className={`h-8 ${
                      !canPrevious || isLoading
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }`}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {pageNumbers.map((page, index) => (
                  <PaginationItem key={index}>
                    {page === '...' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrent(page as number)}
                        isActive={page === current}
                        className={`h-8 w-8 cursor-pointer ${
                          isLoading ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                {/* Next page */}
                <PaginationItem>
                  <PaginationNext
                    onClick={goToNext}
                    className={`h-8 ${
                      !canNext || isLoading
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }`}
                  />
                </PaginationItem>

                {/* Last page button */}
                <PaginationItem>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={goToLast}
                    disabled={!canNext || isLoading}
                    className='h-8 w-8 p-0'
                  >
                    <ChevronsRight className='h-4 w-4' />
                    <span className='sr-only'>Go to last page</span>
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
