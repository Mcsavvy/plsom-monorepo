import { useState, useMemo } from 'react';
import { useTable, useNavigation } from '@refinedev/core';
import {
  MoreHorizontal,
  Edit,
  FileText,
  ArrowUpDown,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  GraduationCap,
} from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { getResourceIcon } from '@/utils/resourceUtils';
import { SubmissionListItem } from '@/types/submission';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const SubmissionsList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show, edit } = useNavigation();

  const tableResult = useTable<SubmissionListItem>({
    resource: 'submissions',
    pagination: {
      current: 1,
      pageSize: 10,
    },
    sorters: {
      initial: [
        {
          field: 'updated_at',
          order: 'desc',
        },
      ],
    },
    meta: {
      transform: true,
    },
  });

  const {
    tableQuery: { data, isLoading, isError, error },
  } = tableResult;

  const pagination = useTablePagination({
    table: tableResult,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'returned':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className='h-4 w-4' />;
      case 'submitted':
        return <FileText className='h-4 w-4' />;
      case 'in_progress':
        return <Clock className='h-4 w-4' />;
      case 'returned':
        return <XCircle className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'submitted':
        return 'Submitted';
      case 'in_progress':
        return 'In Progress';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeSpent = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const columns = useMemo<ColumnDef<SubmissionListItem>[]>(
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
              className='h-8 px-2 lg:px-3'
            >
              ID
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div
            className='text-sm px-2 lg:px-3 cursor-pointer hover:text-primary/80 hover:underline'
            onClick={() => show('submissions', row.getValue('id'))}
          >
            Submission #{row.getValue('id')}
          </div>
        ),
      },
      {
        accessorKey: 'studentName',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Student
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div
            className='flex items-center space-x-2 px-2 lg:px-3 cursor-pointer hover:text-primary/80 hover:underline'
            onClick={() => show('students', row.original.student)}
          >
            <User className='h-4 w-4 text-gray-500' />
            <span className='font-medium'>{row.getValue('studentName')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'testTitle',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Test
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div
            className='flex items-center space-x-2 px-2 lg:px-3 cursor-pointer hover:text-primary/80 hover:underline'
            onClick={() => show('tests', row.original.test)}
          >
            <GraduationCap className='h-4 w-4 text-gray-500' />
            <span className='font-medium'>{row.getValue('testTitle')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Status
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge className={getStatusColor(status)}>
              <div className='flex items-center space-x-1'>
                {getStatusIcon(status)}
                <span>{getStatusText(status)}</span>
              </div>
            </Badge>
          );
        },
      },
      {
        accessorKey: 'score',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Score
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const isGraded = row.original.status === 'graded';
          const score = row.getValue('score') as string;
          const maxScore = row.original.maxScore;
          return (
            <div className='text-sm px-2 lg:px-3'>
              {isGraded ? `${score} / ${maxScore}` : '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'completionPercentage',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Completion
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const percentage = row.getValue('completionPercentage') as number;
          return (
            <div className='text-sm px-2 lg:px-3'>
              {Math.round(percentage)}%
            </div>
          );
        },
      },
      {
        accessorKey: 'timeSpentMinutes',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Time Spent
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const timeSpent = row.getValue('timeSpentMinutes') as number | null;
          return (
            <div className='text-sm px-2 lg:px-3'>
              {formatTimeSpent(timeSpent)}
            </div>
          );
        },
      },
      {
        accessorKey: 'submittedAt',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Submitted
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const submittedAt = row.getValue('submittedAt') as string | null;
          return (
            <div className='text-sm px-2 lg:px-3'>
              {submittedAt ? formatDateTime(submittedAt) : 'Not submitted'}
            </div>
          );
        },
      },
      {
        accessorKey: 'gradedByName',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-8 px-2 lg:px-3'
            >
              Graded By
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const gradedByName = row.getValue('gradedByName') as string;
          return (
            <div className='text-sm px-2 lg:px-3'>
              {gradedByName || 'Not graded'}
            </div>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const submission = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => show('submissions', submission.id)}
                >
                  <Eye className='mr-2 h-4 w-4' />
                  View Details
                </DropdownMenuItem>
                {['submitted', 'graded'].includes(submission.status) && (
                  <DropdownMenuItem
                    onClick={() => edit('submissions', submission.id)}
                  >
                    <Edit className='mr-2 h-4 w-4' />
                    Grade Submission
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [show, edit]
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (isError) {
    return (
      <div className='p-4'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Error loading submissions: {error?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='p-4 space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            {getResourceIcon('submissions')}
            <span>Test Submissions</span>
          </CardTitle>
          <CardDescription>
            Manage and grade student test submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center py-4'>
            <Input
              placeholder='Search submissions...'
              value={globalFilter ?? ''}
              onChange={event => setGlobalFilter(event.target.value)}
              className='max-w-sm'
            />
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: columns.length }).map(
                        (_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className='h-4 w-full' />
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
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
                      No submissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination pagination={pagination} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};
