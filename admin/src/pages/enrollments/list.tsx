import { useState, useMemo } from 'react';
import { useNavigation } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { format } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getResourceIcon } from '@/utils/resourceUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Enrollment,
  EnrollmentCohort,
  EnrollmentStudent,
} from '@/types/enrollment';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const EnrollmentsList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show } = useNavigation();

  const getProgramTypeColor = (programType: string) => {
    switch (programType) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'diploma':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              ID
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className='ml-2 h-4 w-4' />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className='ml-2 h-4 w-4' />
              ) : (
                <ArrowUpDown className='ml-2 h-4 w-4' />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div
              className='font-bold cursor-pointer hover:text-primary/80 hover:underline px-4'
              onClick={() => show('enrollments', row.original.id)}
            >
              Enrollment #{row.original.id}
            </div>
          );
        },
      },
      {
        accessorKey: 'student',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Student
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className='ml-2 h-4 w-4' />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className='ml-2 h-4 w-4' />
              ) : (
                <ArrowUpDown className='ml-2 h-4 w-4' />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const student = row.getValue('student') as EnrollmentStudent;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8'>
                <AvatarImage
                  src={student.profilePicture || ''}
                  alt={student.firstName}
                />
                <AvatarFallback>{student.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div
                  className='font-medium cursor-pointer hover:text-primary/80 hover:underline'
                  onClick={() => show('students', student.id)}
                >
                  {student.displayName}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {student.email}
                </div>
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const studentA = rowA.getValue('student') as EnrollmentStudent;
          const studentB = rowB.getValue('student') as EnrollmentStudent;
          const nameA = `${studentA.firstName} ${studentA.lastName}`;
          const nameB = `${studentB.firstName} ${studentB.lastName}`;
          return nameA.localeCompare(nameB);
        },
      },
      {
        accessorKey: 'cohort',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Cohort
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className='ml-2 h-4 w-4' />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className='ml-2 h-4 w-4' />
              ) : (
                <ArrowUpDown className='ml-2 h-4 w-4' />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const cohort = row.getValue('cohort') as EnrollmentCohort;
          return (
            <div>
              <div
                className='font-medium cursor-pointer hover:text-primary/80 hover:underline'
                onClick={() => show('cohorts', cohort.id)}
              >
                {cohort.name}
              </div>
              <div className='flex items-center gap-2 mt-1'>
                <Badge
                  variant='outline'
                  className={getProgramTypeColor(cohort.programType)}
                >
                  {cohort.programType}
                </Badge>
                <Badge
                  variant='outline'
                  className={getStatusColor(cohort.isActive)}
                >
                  {cohort.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const cohortA = rowA.getValue('cohort') as EnrollmentCohort;
          const cohortB = rowB.getValue('cohort') as EnrollmentCohort;
          return cohortA.name.localeCompare(cohortB.name);
        },
      },
      {
        accessorKey: 'enrolledAt',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Enrolled At
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className='ml-2 h-4 w-4' />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className='ml-2 h-4 w-4' />
              ) : (
                <ArrowUpDown className='ml-2 h-4 w-4' />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const enrolledAt = row.getValue('enrolledAt') as string;
          return (
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div className='font-medium'>
                {format(new Date(enrolledAt), 'MMM d, yyyy')}
              </div>
              <div className='text-sm text-muted-foreground'>
                {format(new Date(enrolledAt), 'h:mm a')}
              </div>
            </div>
          );
        },
      },
    ],
    [show]
  );

  const refineCoreProps = useMemo(
    () => ({
      resource: 'enrollments',
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      sorters: {
        initial: [
          {
            field: 'enrolled_at',
            order: 'desc' as 'desc' | 'asc',
          },
        ],
      },
      filters: {
        initial: [],
      },
      meta: {
        transform: true,
      },
    }),
    [columns]
  );

  const tableResult = useTable<Enrollment>({
    columns,
    refineCoreProps,
  });

  const {
    reactTable: { getHeaderGroups, getRowModel },
    refineCore: {
      tableQuery: { data, isLoading, error },
      filters,
      setFilters,
      currentPage,
      setCurrentPage,
      pageCount,
    },
  } = tableResult;

  const pagination = useTablePagination({
    table: {
      current: currentPage,
      setCurrent: setCurrentPage,
      pageSize: 10,
      tableQuery: { data, isLoading },
      pageCount,
    },
    showSizeChanger: true,
  });

  const table = useReactTable<Enrollment>({
    data: (data?.data as Enrollment[]) || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    manualPagination: true,
    pageCount: pageCount,
  });

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Failed to load enrollments. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('enrollments')}
            Enrollments
          </h1>
          <p className='text-muted-foreground'>
            View all student enrollments across cohorts
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            All Enrollments
          </CardTitle>
          <CardDescription>
            View all student enrollments in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search enrollments...'
              value={globalFilter ?? ''}
              onChange={event => setGlobalFilter(String(event.target.value))}
              className='max-w-sm'
            />
          </div>

          {isLoading ? (
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <Skeleton className='h-4 w-[200px]' />
                  <Skeleton className='h-4 w-[150px]' />
                  <Skeleton className='h-4 w-[100px]' />
                  <Skeleton className='h-4 w-[80px]' />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      {getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <TableHead
                              key={header.id}
                              className='whitespace-nowrap'
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {getRowModel().rows?.length ? (
                        getRowModel().rows.map(row => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && 'selected'}
                          >
                            {row.getVisibleCells().map(cell => (
                              <TableCell
                                key={cell.id}
                                className='whitespace-nowrap'
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className='h-24 text-center'
                          >
                            No enrollments found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DataTablePagination
                pagination={pagination}
                isLoading={isLoading}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
