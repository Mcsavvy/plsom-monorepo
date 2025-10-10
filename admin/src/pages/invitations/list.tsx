import { useState, useMemo, useCallback } from 'react';
import {
  useNavigation,
  useDelete,
  useCustomMutation,
} from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Calendar,
  User,
  RefreshCw,
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

interface Invitation {
  id: number;
  email: string;
  role: string;
  program_type: string | null;
  cohort: number | null;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_by: number;
  is_expired: boolean;
  is_used: boolean;
}

export const InvitationsList: React.FC = () => {
  const { edit, create, show } = useNavigation();
  const { mutate: deleteInvitation } = useDelete();
  const { mutate: resendInvitation } = useCustomMutation();
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm('Are you sure you want to delete this invitation?')) {
        deleteInvitation({
          resource: 'invitations',
          id: id,
        });
      }
    },
    [deleteInvitation]
  );

  const handleResend = useCallback(
    async (id: number) => {
      setLoading(prev => ({ ...prev, [id]: true }));
      try {
        resendInvitation({
          url: `/invitations/${id}/resend/`,
          method: 'post',
          values: {},
        });
        alert('Invitation resent successfully!');
      } catch (error) {
        console.error('Error resending invitation:', error);
        alert('Failed to resend invitation. Please try again.');
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }));
      }
    },
    [resendInvitation]
  );

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'lecturer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (invitation: Invitation) => {
    if (invitation.is_used) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (invitation.is_expired) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatus = (invitation: Invitation) => {
    if (invitation.is_used) return 'Used';
    if (invitation.is_expired) return 'Expired';
    return 'Pending';
  };

  const columns = useMemo<ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: 'email',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Email
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
            className='font-medium hover:underline cursor-pointer'
            onClick={() => show('invitations', row.original.id)}
          >
            {row.getValue('email')}
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Role
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
          const role = row.getValue('role') as string;
          return (
            <Badge variant='outline' className={getRoleColor(role)}>
              {role}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'program_type',
        header: 'Program Type',
        cell: ({ row }) => {
          const programType = row.getValue('program_type') as string | null;
          return programType ? (
            <Badge variant='outline'>{programType}</Badge>
          ) : (
            <span className='text-muted-foreground'>—</span>
          );
        },
      },
      {
        accessorKey: 'cohort',
        header: 'Cohort',
        cell: ({ row }) => {
          const cohort = row.getValue('cohort') as number | null;
          return cohort ? (
            <Badge variant='outline'>Cohort {cohort}</Badge>
          ) : (
            <span className='text-muted-foreground'>—</span>
          );
        },
      },
      {
        id: 'status',
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
          const invitation = row.original;
          return (
            <Badge variant='outline' className={getStatusColor(invitation)}>
              {getStatus(invitation)}
            </Badge>
          );
        },
        sortingFn: (rowA, rowB) => {
          const statusA = getStatus(rowA.original);
          const statusB = getStatus(rowB.original);
          return statusA.localeCompare(statusB);
        },
      },
      {
        accessorKey: 'expires_at',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Expires At
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
          const date = row.getValue('expires_at') as string;
          return (
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              {format(new Date(date), 'MMM dd, yyyy')}
            </div>
          );
        },
      },
      {
        accessorKey: 'used_at',
        header: 'Used At',
        cell: ({ row }) => {
          const date = row.getValue('used_at') as string | null;
          return date ? (
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4 text-muted-foreground' />
              {format(new Date(date), 'MMM dd, yyyy')}
            </div>
          ) : (
            <span className='text-muted-foreground'>—</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const invitation = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => show('invitations', invitation.id)}
                >
                  <Eye className='mr-2 h-4 w-4' />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => edit('invitations', invitation.id)}
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                {!invitation.is_used && (
                  <DropdownMenuItem
                    onClick={() => handleResend(invitation.id)}
                    disabled={loading[invitation.id]}
                  >
                    {loading[invitation.id] ? (
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Send className='mr-2 h-4 w-4' />
                    )}
                    Resend
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(invitation.id)}
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
    [edit, show, handleDelete, handleResend, loading]
  );

  const refineCoreProps = useMemo(

    () => ({
      resource: 'invitations',
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      sorters: {
        initial: [
          {
            field: 'email',
            order: 'asc' as 'asc' | 'desc',
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

  const tableResult = useTable<Invitation>({
    columns,
    refineCoreProps,
  });

  const {
    reactTable: {
      getHeaderGroups,
      getRowModel,

    },
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

  const table = useReactTable<Invitation>({
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
    pageCount: pageCount,
  });

  if (isError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Error loading invitations: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('invitations')}
            Invitations
          </h1>
          <p className='text-muted-foreground'>
            Manage user invitations for admins, lecturers, and students
          </p>
        </div>
        <Button onClick={() => create('invitations')} className='gap-2'>
          <Plus className='h-4 w-4' />
          Send Invitation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            All Invitations
          </CardTitle>
          <CardDescription>
            View and manage all user invitations sent from your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search invitations...'
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
                            No invitations found.
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
