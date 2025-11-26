import { useState, useMemo, useCallback } from 'react';
import { useNavigation, useDelete, useCustomMutation } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Archive,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
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
import { getResourceIcon } from '@/utils/resourceUtils';
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
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface Cohort {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  enrolled_students_count: number;
}

export const CohortsList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show, edit, create } = useNavigation();
  const { mutate: deleteRecord } = useDelete();
  const { mutate: archiveCohort } = useCustomMutation();

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

  const handleDelete = useCallback(
    (id: number) => {
      deleteRecord({
        resource: 'cohorts',
        id,
      });
    },
    [deleteRecord]
  );

  const handleArchive = useCallback(
    (id: number) => {
      archiveCohort({
        url: `/cohorts/${id}/archive/`,
        method: 'post',
        successNotification: {
          type: 'success',
          message: 'Cohort archived successfully',
          description: 'The cohort has been archived and deactivated.',
        },
        errorNotification: {
          type: 'error',
          message: 'Failed to archive cohort',
          description: 'There was an error archiving the cohort.',
        },
        values: {},
      });
    },
    [archiveCohort]
  );

  const columns = useMemo<ColumnDef<Cohort>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Name
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
        cell: ({ row }) => (
          <div
            className='font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer'
            onClick={() => show('cohorts', row.original.id)}
          >
            {row.getValue('name')}
          </div>
        ),
      },
      {
        accessorKey: 'program_type',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Program Type
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
          const programType = row.getValue('program_type') as string;
          return (
            <Badge
              variant='outline'
              className={getProgramTypeColor(programType)}
            >
              {programType}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'is_active',
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
          const isActive = row.getValue('is_active') as boolean;
          return (
            <Badge variant='outline' className={getStatusColor(isActive)}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'start_date',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Start Date
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
          const startDate = row.getValue('start_date') as string;
          return (
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              {format(new Date(startDate), 'MMM d, yyyy')}
            </div>
          );
        },
      },
      {
        accessorKey: 'end_date',
        header: 'End Date',
        cell: ({ row }) => {
          const endDate = row.getValue('end_date') as string | null;
          return endDate ? (
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              {format(new Date(endDate), 'MMM d, yyyy')}
            </div>
          ) : (
            <span className='text-muted-foreground'>—</span>
          );
        },
      },
      {
        accessorKey: 'enrolled_students_count',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Students
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
          const count = row.getValue('enrolled_students_count') as number;
          return (
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              {count}
            </div>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const cohort = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => edit('cohorts', cohort.id)}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                {cohort.is_active && (
                  <DropdownMenuItem onClick={() => handleArchive(cohort.id)}>
                    <Archive className='mr-2 h-4 w-4' />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(cohort.id)}
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
    [show, edit, handleDelete, handleArchive]
  );

  const refineCoreProps = useMemo(
    () => ({
      resource: 'cohorts',
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      sorters: {
        initial: [
          {
            field: 'start_date',
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
    []
  );

  const tableResult = useTable<Cohort>({
    columns,
    refineCoreProps,
  });

  const {
    reactTable: { getHeaderGroups, getRowModel },
    refineCore: {
      tableQuery: { data, isLoading, isError, error },
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

  const table = useReactTable<Cohort>({
    data: (data?.data as Cohort[]) || [],
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
  });

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Failed to load cohorts. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('cohorts')}
            Cohorts
          </h1>
          <p className='text-muted-foreground'>
            Manage student cohorts for certificate and diploma programs
          </p>
        </div>
        <Button onClick={() => create('cohorts')} className='gap-2'>
          <Plus className='h-4 w-4' />
          Create Cohort
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>All Cohorts</CardTitle>
          <CardDescription>
            View and manage all student cohorts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search cohorts...'
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
                  <Skeleton className='h-4 w-[100px]' />
                  <Skeleton className='h-4 w-[150px]' />
                  <Skeleton className='h-4 w-[100px]' />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map(headerGroup => (
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
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
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
                            No cohorts found.
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
