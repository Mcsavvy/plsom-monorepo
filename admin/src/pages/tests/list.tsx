import { useState, useMemo, useCallback } from 'react';
import {
  useTable,
  useNavigation,
  useDelete,
  useCreate,
  useCustomMutation,
} from '@refinedev/core';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  FileText,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Clock,
  Users,
  Copy,
  Play,
  Archive,
  Eye,
  BarChart3,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { getResourceIcon } from '@/utils/resourceUtils';
import { TestListItem } from '@/types/test';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const TestsList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show, edit, create } = useNavigation();
  const { mutate: deleteRecord } = useDelete();
  const { mutate: createTest } = useCreate();
  const { mutate: customAction } = useCustomMutation();

  const tableResult = useTable<TestListItem>({
    resource: 'tests',
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

  const handleDelete = useCallback(
    (id: number) => {
      deleteRecord({
        resource: 'tests',
        id,
      });
    },
    [deleteRecord]
  );

  const handleClone = useCallback(
    (test: TestListItem) => {
      const clonedTestData = {
        title: `Copy of ${test.title}`,
        description: test.description,
        status: 'draft' as const,
        // Note: We would need the full test details including questions to clone properly
        // This is a simplified version
      };

      createTest(
        {
          resource: 'tests',
          values: clonedTestData,
        },
        {
          onSuccess: data => {
            if (data.data?.id) {
              edit('tests', data.data.id);
            }
          },
          onError: (error: unknown) => {
            console.error('Clone error:', error);
          },
        }
      );
    },
    [createTest, edit]
  );

  const handlePublish = useCallback(
    (id: number) => {
      // This would use the publish endpoint: POST /api/tests/{id}/publish/
      customAction({
        url: `/tests/${id}/publish/`,
        method: 'post',
        values: {},
      });
    },
    [customAction]
  );

  const handleArchive = useCallback(
    (id: number) => {
      // This would use the archive endpoint: POST /api/tests/{id}/archive/
      customAction({
        url: `/tests/${id}/archive/`,
        method: 'post',
        values: {},
      });
    },
    [customAction]
  );

  const columns = useMemo<ColumnDef<TestListItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Test
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
          const test = row.original;
          const truncate = (str: string, n: number) =>
            str && str.length > n ? str.slice(0, n) + '…' : str;
          return (
            <div className='space-y-1'>
              <div
                className='font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer'
                onClick={() => show('tests', test.id)}
              >
                {test.title}
              </div>
              <p className='text-sm text-muted-foreground line-clamp-2'>
                {truncate(test.description, 100)}
              </p>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>{test.courseName}</span>
                <span>•</span>
                <span>{test.cohortName}</span>
              </div>
            </div>
          );
        },
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
              className='h-auto p-0 font-medium'
            >
              Status
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
          const test = row.original;
          return (
            <Badge variant='outline' className={test.statusColor}>
              {test.statusText}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'totalQuestions',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Questions
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
          const totalQuestions = row.getValue('totalQuestions') as number;
          return (
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{totalQuestions}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalSubmissions',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Submissions
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
          const totalSubmissions = row.getValue('totalSubmissions') as number;
          return (
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{totalSubmissions}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'formattedTimeLimit',
        header: 'Time Limit',
        cell: ({ row }) => {
          const test = row.original;
          return (
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{test.formattedTimeLimit}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdByName',
        header: 'Created By',
        cell: ({ row }) => {
          const createdByName = row.getValue('createdByName') as string;
          return (
            <span className='text-sm text-muted-foreground'>
              {createdByName}
            </span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Updated
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
          const updatedAt = row.getValue('updatedAt') as string;
          return (
            <span className='text-sm text-muted-foreground'>
              {new Date(updatedAt).toLocaleDateString()}
            </span>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const test = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => show('tests', test.id)}>
                  <Eye className='mr-2 h-4 w-4' />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => edit('tests', test.id)}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleClone(test)}>
                  <Copy className='mr-2 h-4 w-4' />
                  Clone
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {test.status === 'draft' && (
                  <DropdownMenuItem onClick={() => handlePublish(test.id)}>
                    <Play className='mr-2 h-4 w-4' />
                    Publish
                  </DropdownMenuItem>
                )}
                {test.status === 'published' && (
                  <DropdownMenuItem onClick={() => handleArchive(test.id)}>
                    <Archive className='mr-2 h-4 w-4' />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <BarChart3 className='mr-2 h-4 w-4' />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(test.id)}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [show, edit, handleDelete, handleClone, handlePublish, handleArchive]
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    manualPagination: true,
  });

  if (isError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Error loading tests: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('tests')}
            Tests
          </h1>
          <p className='text-muted-foreground'>
            Manage assessments and examinations for courses
          </p>
        </div>
        <Button onClick={() => create('tests')} className='gap-2'>
          <Plus className='h-4 w-4' />
          Create Test
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>All Tests</CardTitle>
          <CardDescription>
            View and manage all tests in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search tests...'
              value={globalFilter ?? ''}
              onChange={event => setGlobalFilter(String(event.target.value))}
              className='max-w-sm'
            />
          </div>

          {isLoading ? (
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-[300px]' />
                    <Skeleton className='h-3 w-[400px]' />
                    <Skeleton className='h-3 w-[200px]' />
                  </div>
                  <Skeleton className='h-6 w-[80px]' />
                  <Skeleton className='h-4 w-[60px]' />
                  <Skeleton className='h-4 w-[60px]' />
                  <Skeleton className='h-4 w-[100px]' />
                  <Skeleton className='h-4 w-[120px]' />
                  <Skeleton className='h-4 w-[80px]' />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
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
                    {table.getRowModel().rows?.length ? (
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
                          No tests found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
