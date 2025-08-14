import { useState, useMemo, useCallback } from 'react';
import { useTable, useNavigation, useDelete, useCreate } from '@refinedev/core';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Hash,
  Copy,
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
import { Course } from '@/types/course';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const CoursesList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show, edit, create } = useNavigation();
  const { mutate: deleteRecord } = useDelete();
  const { mutate: createCourse } = useCreate();

  const tableResult = useTable<Course>({
    resource: 'courses',
    pagination: {
      current: 1,
      pageSize: 10,
    },
    sorters: {
      initial: [
        {
          field: 'name',
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
        resource: 'courses',
        id,
      });
    },
    [deleteRecord]
  );

  const handleClone = useCallback(
    (course: Course) => {
      const clonedCourseData = {
        name: `Copy of ${course.name}`,
        description: course.description,
        program_type: course.programType,
        module_count: course.moduleCount,
        is_active: false, // Set as inactive by default for cloned courses
        ...(course.lecturer?.id && { lecturer_id: course.lecturer.id }),
      };

      createCourse(
        {
          resource: 'courses',
          values: clonedCourseData,
        },
        {
          onSuccess: data => {
            // Navigate to edit the cloned course
            if (data.data?.id) {
              edit('courses', data.data.id);
            }
          },
          onError: (error: unknown) => {
            console.error('Clone error:', error);
          },
        }
      );
    },
    [createCourse, edit]
  );

  const columns = useMemo<ColumnDef<Course>[]>(
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
              Course
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
          const course = row.original;
          const truncate = (str: string, n: number) =>
            str && str.length > n ? str.slice(0, n) + '…' : str;
          return (
            <div className='space-y-1'>
              <div
                className='font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer'
                onClick={() => show('courses', course.id)}
              >
                {course.name}
              </div>
              <p className='text-sm text-muted-foreground line-clamp-2'>
                {truncate(course.description, 100)}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'programType',
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
          const programType = row.getValue('programType') as string;
          return (
            <Badge
              variant='outline'
              className={getProgramTypeColor(programType)}
            >
              <GraduationCap className='h-3 w-3 mr-1' />
              {programType}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'isActive',
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
          const isActive = row.getValue('isActive') as boolean;
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
        accessorKey: 'lecturer',
        header: 'Lecturer',
        cell: ({ row }) => {
          const course = row.original;

          if (!course.lecturer) {
            return (
              <span className='text-muted-foreground'>
                No lecturer assigned
              </span>
            );
          }

          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8'>
                <AvatarImage
                  src={course.lecturer.profilePicture || ''}
                  alt={course.lecturer.firstName}
                />
                <AvatarFallback className='text-xs'>
                  {course.lecturer.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className='font-medium text-sm'>
                  {course.lecturer.displayName}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {course.lecturer.email}
                </div>
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const lecturerA = rowA.original.lecturer?.displayName || '';
          const lecturerB = rowB.original.lecturer?.displayName || '';
          return lecturerA.localeCompare(lecturerB);
        },
      },
      {
        accessorKey: 'moduleCount',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Modules
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
          const moduleCount = row.getValue('moduleCount') as number;
          return (
            <div className='flex items-center gap-2'>
              <Hash className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{moduleCount}</span>
              <span className='text-xs text-muted-foreground'>
                module{moduleCount !== 1 ? 's' : ''}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const course = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => edit('courses', course.id)}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleClone(course)}>
                  <Copy className='mr-2 h-4 w-4' />
                  Clone
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(course.id)}
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
    manualPagination: true,
  });

  if (isError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Error loading courses: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('courses')}
            Courses
          </h1>
          <p className='text-muted-foreground'>
            Manage courses across certificate and diploma programs
          </p>
        </div>
        <Button onClick={() => create('courses')} className='gap-2'>
          <Plus className='h-4 w-4' />
          Create Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>All Courses</CardTitle>
          <CardDescription>
            View and manage all courses in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search courses...'
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
                          No courses found.
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
