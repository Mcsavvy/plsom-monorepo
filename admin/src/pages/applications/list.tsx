import { useState, useMemo, useCallback } from 'react';
import { useNavigation, useDelete, useNotification } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileText,
  Mail,
  Phone,
  UserPlus,
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

export interface Application {
  id: number;
  full_name: string;
  father_name: string;
  mother_name: string;
  gender: 'MALE' | 'FEMALE';
  phone: string;
  email: string;
  full_residential_address: string;
  nationality: string;
  employment_status: 'EMPLOYED' | 'UNEMPLOYED' | 'STUDENT';
  program_type: 'CERTIFICATE' | 'DIPLOMA';
  program_interest: string;
  submitted_at: string;
}

export const ApplicationsList: React.FC = () => {
  const { show } = useNavigation();
  const { mutate: deleteApplication } = useDelete();
  const { open } = useNotification();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm('Delete this application?')) {
        deleteApplication(
          { resource: 'applications', id },
          {
            onSuccess: () => open?.({ type: 'success', message: 'Application deleted.' }),
            onError: (err: { message: string }) =>
              open?.({ type: 'error', message: err?.message || 'Failed to delete.' }),
          }
        );
      }
    },
    [deleteApplication, open]
  );

  const getProgramColor = (program: string) => {
    switch (program) {
      case 'CERTIFICATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DIPLOMA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmploymentColor = (status: string) => {
    switch (status) {
      case 'EMPLOYED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UNEMPLOYED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'STUDENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const columns = useMemo<ColumnDef<Application>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
        ),
        cell: ({ row }) => (
          <div
            className='font-medium hover:underline cursor-pointer'
            onClick={() => show('applications', row.original.id)}
          >
            {row.getValue('full_name')}
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Mail className='h-4 w-4 text-muted-foreground' />
            <span className='font-mono text-sm'>{row.getValue('email')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Phone className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm'>{row.getValue('phone')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'program_type',
        header: 'Program',
        cell: ({ row }) => {
          const val = row.getValue('program_type') as string;
          return (
            <Badge variant='outline' className={getProgramColor(val)}>
              {val}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'employment_status',
        header: 'Employment',
        cell: ({ row }) => {
          const val = row.getValue('employment_status') as string;
          return (
            <Badge variant='outline' className={getEmploymentColor(val)}>
              {val}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'nationality',
        header: 'Nationality',
      },
      {
        accessorKey: 'submitted_at',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-medium'
          >
            Submitted
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue('submitted_at') as string;
          return <span className='text-sm'>{format(new Date(date), 'MMM dd, yyyy')}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const app = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => show('applications', app.id)}>
                  <Eye className='mr-2 h-4 w-4' />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => show('applications', app.id)}>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Invite as Student
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(app.id)}
                  className='text-red-600'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
      },
    ],
    [show, handleDelete]
  );

  const refineCoreProps = useMemo(
    () => ({
      resource: 'applications',
      pagination: { currentPage: 1, pageSize: 10 },
      sorters: { initial: [{ field: 'submitted_at', order: 'desc' as const }] },
      filters: { initial: [] },
    }),
    []
  );

  const tableResult = useTable<Application>({ columns, refineCoreProps });

  const {
    reactTable: { getHeaderGroups, getRowModel },
    refineCore: {
      tableQuery: { data, isLoading, isError, error },
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

  const table = useReactTable<Application>({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    manualPagination: true,
    pageCount,
  });

  if (isError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Error loading applications: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('applications')}
            Applications
          </h1>
          <p className='text-muted-foreground'>
            Enrollment applications submitted from the landing page
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            All Applications
          </CardTitle>
          <CardDescription>
            Review and invite applicants as students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search applications...'
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(String(e.target.value))}
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
                      {getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <TableHead key={header.id} className='whitespace-nowrap'>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {getRowModel().rows?.length ? (
                        getRowModel().rows.map(row => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                            {row.getVisibleCells().map(cell => (
                              <TableCell key={cell.id} className='whitespace-nowrap'>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className='h-24 text-center'>
                            No applications found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DataTablePagination pagination={pagination} isLoading={isLoading} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
