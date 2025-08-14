import React, { useMemo } from 'react';
import { useTable } from '@refinedev/react-table';
import { useNavigation, CrudFilters, CrudFilter } from '@refinedev/core';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  User,
  Database,
  Calendar,
  Activity,
  X,
} from 'lucide-react';
import { getResourceIcon } from '@/utils/resourceUtils';
import { ColumnDef, flexRender } from '@tanstack/react-table';

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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditLog } from '@/types/auditLog';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const getActionColor = (action: string) => {
  switch (action?.toLowerCase()) {
    case 'create':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'update':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'delete':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'read':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getResourceColor = (resource: string) => {
  switch (resource?.toLowerCase()) {
    case 'users':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'cohorts':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'enrollments':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'invitations':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const useColumns = () => {
  const { show } = useNavigation();
  return useMemo<ColumnDef<AuditLog>[]>(
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
              className='h-8 p-0 hover:bg-transparent'
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
        cell: ({ row }) => {
          const name = row.getValue('name') as string;
          return (
            <div
              className='text-sm hover:underline cursor-pointer'
              onClick={() => show('audit-logs', row.original.id!)}
            >
              {name}
            </div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0 hover:bg-transparent'
          >
            <Calendar className='mr-2 h-4 w-4' />
            Timestamp
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
          const timestamp = row.getValue('timestamp') as string;
          return (
            <div className='text-sm'>
              {timestamp
                ? format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')
                : '-'}
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: 'author_name',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0 hover:bg-transparent'
          >
            <User className='mr-2 h-4 w-4' />
            Author
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
          const author = row.original.author;
          const authorName = row.getValue('author_name') as string;
          if (!author && !authorName) {
            return <span className='text-muted-foreground'>System</span>;
          }
          return (
            <div>
              <div className='font-medium text-sm'>
                {author?.name || authorName || 'System'}
              </div>
              {author?.email && (
                <div className='text-xs text-muted-foreground'>
                  {author.email}
                </div>
              )}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'resource',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0 hover:bg-transparent'
          >
            <Database className='mr-2 h-4 w-4' />
            Resource
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
          const resource = row.getValue('resource') as string;
          return (
            <Badge variant='outline' className={getResourceColor(resource)}>
              {resource}
            </Badge>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'action',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0 hover:bg-transparent'
          >
            <Activity className='mr-2 h-4 w-4' />
            Action
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
          const action = row.getValue('action') as string;
          return (
            <Badge variant='outline' className={getActionColor(action)}>
              {action}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'ip_address',
        header: 'IP Address',
        cell: ({ row }) => {
          const ipAddress = row.getValue('ip_address') as string;
          return (
            <span className='text-sm font-mono'>
              {ipAddress || <span className='text-muted-foreground'>-</span>}
            </span>
          );
        },
        size: 120,
      },
    ],
    [show]
  );
};

export const AuditLogsList: React.FC = () => {
  const columns = useColumns();

  // Memoize refineCoreProps to prevent useTable from resetting on every render
  const refineCoreProps = useMemo(
    () => ({
      resource: 'audit-logs',
      meta: {
        transform: true,
      },
      pagination: {
        current: 1,
        pageSize: 20,
      },
      sorters: {
        initial: [
          {
            field: 'timestamp',
            order: 'desc' as 'desc' | 'asc',
          },
        ],
        // mode: 'server',
      },
      filters: {
        initial: [],
        // mode: 'server',
      },
    }),
    []
  );

  const tableResult = useTable<AuditLog>({
    columns,
    refineCoreProps,
  });

  const {
    getHeaderGroups,
    getRowModel,
    refineCore: {
      tableQuery: { data, isLoading, isError, error },
      filters,
      setFilters,
      current,
      setCurrent,
      pageCount,
    },
  } = tableResult;

  const pagination = useTablePagination({
    table: {
      current,
      setCurrent,
      pageSize: 20, // Fixed page size for audit logs
      tableQuery: { data, isLoading },
      pageCount,
    },
    showSizeChanger: true,
  });

  // Helper to get filter value
  const getFilterValue = React.useCallback(
    (field: string) => {
      const filter = filters.find(f => 'field' in f && f.field === field);
      const value = filter && 'value' in filter ? filter.value || '' : '';
      return value;
    },
    [filters]
  );

  const searchValue = React.useMemo(() => {
    return getFilterValue('search');
  }, [getFilterValue]);

  const resourceFilter = React.useMemo(() => {
    return getFilterValue('resource');
  }, [getFilterValue]);

  const actionFilter = React.useMemo(() => {
    return getFilterValue('action');
  }, [getFilterValue]);

  // Helper to update filters
  const updateFilter = React.useCallback(
    (field: string, value: string) => {
      setCurrent(1); // Reset to first page when filters change

      setFilters((prev: CrudFilters) => {
        const newFilters = [
          ...prev.filter(
            (f: CrudFilter) => !('field' in f) || f.field !== field
          ),
          ...(value ? [{ field, operator: 'eq' as const, value }] : []),
        ];
        return newFilters;
      });
    },
    [setFilters, setCurrent]
  );

  const updateSearchFilter = React.useCallback(
    (value: string) => {
      updateFilter('search', value);
    },
    [updateFilter]
  );
  const updateResourceFilter = React.useCallback(
    (value: string) => {
      updateFilter('resource', value === 'all' ? '' : value);
    },
    [updateFilter]
  );
  const updateActionFilter = React.useCallback(
    (value: string) => {
      updateFilter('action', value === 'all' ? '' : value);
    },
    [updateFilter]
  );

  // Unique values for dropdowns
  const uniqueResources = React.useMemo(() => {
    if (!data?.data) return [];
    const resources = data.data.map(log => log.resource);
    return Array.from(new Set(resources));
  }, [data?.data]);

  const uniqueActions = React.useMemo(() => {
    if (!data?.data) return [];
    const actions = data.data.map(log => log.action);
    return Array.from(new Set(actions));
  }, [data?.data]);

  const clearFilters = React.useCallback(() => {
    setFilters([]);
  }, [setFilters]);

  const hasActiveFilters = filters.length > 0;

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-8 w-32' />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-4 w-64' />
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert>
        <AlertDescription>
          {error?.message || 'Failed to load audit logs'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            {getResourceIcon('audit-logs')}
            Audit Logs
          </h1>
          <p className='text-muted-foreground'>
            Track all system activities and changes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>View and filter system audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className='flex flex-wrap gap-4 mb-4'>
            <div className='flex-1 min-w-[200px]'>
              <Input
                placeholder='Search audit logs...'
                value={searchValue}
                onChange={e => updateSearchFilter(e.target.value)}
                className='max-w-sm'
              />
            </div>
            <Select
              value={resourceFilter || 'all'}
              onValueChange={updateResourceFilter}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Filter by resource' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={actionFilter || 'all'}
              onValueChange={updateActionFilter}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Filter by action' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant='outline'
                onClick={clearFilters}
                className='shrink-0'
              >
                <X className='h-4 w-4 mr-2' />
                Clear Filters
              </Button>
            )}
          </div>
          {/* Table */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
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
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <DataTablePagination pagination={pagination} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};
