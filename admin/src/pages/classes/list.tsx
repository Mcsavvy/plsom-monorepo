import { useState, useMemo, useCallback } from 'react';
import { useTable, useNavigation, useDelete, useCreate } from '@refinedev/core';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Copy,
  Play,
  Video,
  Clock,
  Users,
  Calendar,
  ClipboardCheck,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Class } from '@/types/class';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const ClassesList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show, edit, create, list } = useNavigation();
  const { mutate: deleteRecord } = useDelete();
  const { mutate: createClass } = useCreate();

  const tableResult = useTable<Class>({
    resource: 'classes',
    pagination: {
      current: 1,
      pageSize: 10,
    },
    sorters: {
      initial: [
        {
          field: 'scheduled_at',
          order: 'asc',
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
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgramTypeColor = (programType: string) => {
    switch (programType) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'diploma':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm('Are you sure you want to delete this class?')) {
        deleteRecord({
          resource: 'classes',
          id: id,
        });
      }
    },
    [deleteRecord]
  );

  const handleClone = useCallback(
    (classItem: Class) => {
      const clonedClassData = {
        course_id: classItem.course.id,
        lecturer_id: classItem.lecturer?.id,
        cohort_id: classItem.cohort.id,
        title: `${classItem.title} (Copy)`,
        description: classItem.description,
        scheduled_at: new Date(
          new Date(classItem.scheduledAt).getTime() +
            (classItem.durationMinutes + 60) * 60000
        ).toISOString(),
        duration_minutes: classItem.durationMinutes,
        // Explicitly exclude zoom-related fields for clone
      };

      createClass(
        {
          resource: 'classes',
          values: clonedClassData,
        },
        {
          onSuccess: () => {
            // Optionally redirect to edit the new class
          },
        }
      );
    },
    [createClass]
  );

  const columns: ColumnDef<Class>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0'
          >
            Title
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
          <div className='max-w-[200px]'>
            <div
              className='font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer'
              onClick={() => show('classes', row.original.id)}
            >
              {row.original.title}
            </div>
            <div className='text-sm text-gray-500 truncate'>
              {row.original.description.length > 100
                ? row.original.description.substring(0, 100) + '...'
                : row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'course',
        header: 'Course',
        cell: ({ row }) => (
          <div className='max-w-[200px]'>
            <div
              className='font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer'
              onClick={() => show('courses', row.original.course.id)}
            >
              <span className='truncate'>{row.original.course.name}</span>
            </div>
            <Badge
              variant='outline'
              className={`text-xs mt-1 ${getProgramTypeColor(
                row.original.course.programType
              )}`}
            >
              {row.original.course.programType}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'lecturer',
        header: 'Lecturer',
        cell: ({ row }) => (
          <div
            className='flex items-center space-x-3 cursor-pointer'
            onClick={() => show('staff', row.original.lecturer.id)}
          >
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={row.original.lecturer.profilePicture || ''}
                alt={row.original.lecturer.displayName}
              />
              <AvatarFallback className='text-xs'>
                {row.original.lecturer.initials}
              </AvatarFallback>
            </Avatar>
            <div className='max-w-[150px]'>
              <div className='font-medium truncate'>
                {row.original.lecturer.displayName}
              </div>
              <div className='text-sm text-gray-500 truncate'>
                {row.original.lecturer.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'cohort',
        header: 'Cohort',
        cell: ({ row }) => (
          <div className='max-w-[120px]'>
            <div
              className='font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer'
              onClick={() => show('cohorts', row.original.cohort.id)}
            >
              {row.original.cohort.name}
            </div>
            <Badge
              variant={row.original.cohort.isActive ? 'default' : 'secondary'}
              className='text-xs mt-1'
            >
              {row.original.cohort.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'scheduledAt',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 p-0'
          >
            <Calendar className='mr-2 h-4 w-4' />
            Scheduled
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
          <div className='min-w-[140px]'>
            <div className='text-sm'>{row.original.formattedDateTime}</div>
            <div className='flex items-center gap-1 text-xs text-gray-500 mt-1'>
              <Clock className='h-3 w-3' />
              {row.original.formattedDuration}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className='space-y-1'>
            <Badge
              variant='outline'
              className={getStatusColor(row.original.status)}
            >
              {row.original.statusText}
            </Badge>
            <div className='flex items-center gap-1 text-xs text-gray-500'>
              <Users className='h-3 w-3' />
              {row.original.attendanceCount} attended
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.canJoin && row.original.zoomJoinUrl && (
              <Button
                variant='outline'
                size='sm'
                className='h-8'
                onClick={() => window.open(row.original.zoomJoinUrl!, '_blank')}
              >
                <Play className='h-4 w-4 mr-1' />
                Join
              </Button>
            )}
            {row.original.recordingUrl && (
              <Button
                variant='outline'
                size='sm'
                className='h-8'
                onClick={() =>
                  window.open(row.original.recordingUrl!, '_blank')
                }
              >
                <Video className='h-4 w-4 mr-1' />
                Recording
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => edit('classes', row.original.id)}
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                {row.original.isPast && (
                  <DropdownMenuItem
                    onClick={() => list('classes/attendance', { class_id: row.original.id })}
                  >
                    <ClipboardCheck className='mr-2 h-4 w-4' />
                    Manage Attendance
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleClone(row.original)}>
                  <Copy className='mr-2 h-4 w-4' />
                  Clone (No Meeting Link)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-red-600'
                  onClick={() => handleDelete(row.original.id)}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [show, edit, handleDelete, handleClone]
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
  });

  if (isError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Error loading classes: {error?.message || 'Unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('classes')}
            Classes
          </h1>
          <p className='text-muted-foreground'>
            Manage class sessions and schedules
          </p>
        </div>
        <Button onClick={() => create('classes')} className='gap-2'>
          <Plus className='h-4 w-4' />
          Add Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>All Classes</CardTitle>
          <CardDescription>
            View and manage all class sessions ({data?.total || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search classes...'
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
                    <Skeleton className='h-4 w-[200px]' />
                    <Skeleton className='h-3 w-[300px]' />
                  </div>
                  <Skeleton className='h-4 w-[100px]' />
                  <Skeleton className='h-4 w-[80px]' />
                  <div className='flex items-center space-x-2'>
                    <Skeleton className='h-8 w-8 rounded-full' />
                    <div className='space-y-1'>
                      <Skeleton className='h-3 w-[120px]' />
                      <Skeleton className='h-2 w-[100px]' />
                    </div>
                  </div>
                  <Skeleton className='h-4 w-[60px]' />
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
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id} className='py-4'>
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
                          No classes found.
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
