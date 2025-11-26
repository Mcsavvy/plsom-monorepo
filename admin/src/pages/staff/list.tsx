import { useState, useMemo, useCallback } from 'react';
import { useNavigation, useCustomMutation } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import {
  Mail,
  Phone,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  Edit,
  Crown,
  Award,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Staff } from '@/types/staff';
import { getStandardPhoneNumber } from '@/utils/common';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { getResourceIcon } from '@/utils/resourceUtils';

export const StaffList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { show, edit } = useNavigation();
  const {
    mutate: promoteOrDemote,
    mutation: { isPending: isPromotingDemoting },
  } = useCustomMutation();

  const getRoleColor = (role: 'admin' | 'lecturer') => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'lecturer':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role: 'admin' | 'lecturer') => {
    switch (role) {
      case 'admin':
        return <Crown className='h-3 w-3' />;
      case 'lecturer':
        return <Award className='h-3 w-3' />;
      default:
        return <Users className='h-3 w-3' />;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className='h-3 w-3' />
    ) : (
      <XCircle className='h-3 w-3' />
    );
  };

  const handlePromoteDemote = useCallback(
    async (staffId: number) => {
      promoteOrDemote(
        {
          url: `/staff/${staffId}/promote-demote/`,
          method: 'post',
          values: {},
        },
        {
          onSuccess: () => {
            // Refetch the data to get updated roles
          },
          onError: error => {
            console.error('Failed to promote/demote staff:', error);
          },
        }
      );
    },
    [promoteOrDemote]
  );

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

  const columns: ColumnDef<Staff>[] = useMemo(
    () => [
      {
        accessorKey: 'staff',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Staff
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
          const staff = row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage
                  src={staff.profilePicture || ''}
                  alt={staff.firstName}
                />
                <AvatarFallback>{staff.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className='flex items-center gap-2'>
                  <div
                    className='font-medium cursor-pointer hover:text-primary/80 hover:underline'
                    onClick={() => show('staff', staff.id)}
                  >
                    {staff.displayName}
                  </div>
                </div>
                <a
                  href={`mailto:${staff.email}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 text-sm text-muted-foreground'
                >
                  <Mail className='h-3 w-3' />
                  {staff.email}
                </a>
                {staff.whatsappNumber && (
                  <a
                    href={`https://wa.me/${getStandardPhoneNumber(staff.whatsappNumber)}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-sm text-muted-foreground'
                  >
                    <Phone className='h-3 w-3' />
                    {staff.whatsappNumber}
                  </a>
                )}
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const staffA = rowA.original;
          const staffB = rowB.original;
          return staffA.fullName.localeCompare(staffB.fullName);
        },
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
              className='hover:bg-transparent p-0 font-semibold'
            >
              Role
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const role = row.getValue('role') as 'admin' | 'lecturer';
          return (
            <Badge variant='outline' className={getRoleColor(role)}>
              {getRoleIcon(role)}
              <span className='ml-1 capitalize'>{role}</span>
            </Badge>
          );
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
              className='hover:bg-transparent p-0 font-semibold'
            >
              Status
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <div className='space-y-1'>
              <Badge
                variant='outline'
                className={getStatusColor(staff.isActive)}
              >
                {getStatusIcon(staff.isActive)}
                <span className='ml-1'>
                  {staff.isActive ? 'Active' : 'Inactive'}
                </span>
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'coursesTaught',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='hover:bg-transparent p-0 font-semibold'
            >
              Courses
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const staff = row.original;
          if (!staff.coursesTaught || staff.coursesTaught.length === 0) {
            return (
              <span className='text-muted-foreground'>No courses assigned</span>
            );
          }

          const programTypes = Array.from(
            new Set(staff.coursesTaught.map(course => course.programType))
          );

          return (
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm'>
                  {staff.coursesTaught.length} course
                  {staff.coursesTaught.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className='flex flex-wrap gap-1'>
                {staff.coursesTaught.slice(0, 2).map(course => (
                  <Badge
                    key={course.id}
                    variant='outline'
                    className={`${getProgramTypeColor(course.programType)} text-xs`}
                  >
                    {course.name}
                  </Badge>
                ))}
                {staff.coursesTaught.length > 2 && (
                  <Badge variant='outline' className='text-xs'>
                    +{staff.coursesTaught.length - 2} more
                  </Badge>
                )}
              </div>
              <div className='flex flex-wrap gap-1'>
                {programTypes.map((type, index) => (
                  <Badge key={index} variant='secondary' className='text-xs'>
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const staffA = rowA.original;
          const staffB = rowB.original;
          const coursesA = staffA.coursesTaught?.length || 0;
          const coursesB = staffB.coursesTaught?.length || 0;
          return coursesA - coursesB;
        },
      },
      {
        accessorKey: 'totalClasses',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='hover:bg-transparent p-0 font-semibold'
            >
              Teaching Load
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          );
        },
        cell: ({ row }) => {
          const staff = row.original;
          const courseCount = staff.coursesTaught?.length || 0;
          const totalClasses = staff.totalClasses || 0;

          return (
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <BookOpen className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>{totalClasses} classes</span>
              </div>
              {courseCount > 0 && (
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <GraduationCap className='h-3 w-3' />
                  <span>
                    {courseCount} course{courseCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {courseCount > 0 && totalClasses > 0 && (
                <div className='text-xs text-muted-foreground'>
                  ~{Math.round(totalClasses / courseCount)} classes/course
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => edit('staff', staff.id)}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePromoteDemote(staff.id)}
                  disabled={isPromotingDemoting}
                >
                  {staff.role === 'admin' ? (
                    <>
                      <TrendingDown className='mr-2 h-4 w-4' />
                      Demote to Lecturer
                    </>
                  ) : (
                    <>
                      <TrendingUp className='mr-2 h-4 w-4' />
                      Promote to Admin
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
      },
    ],
    [show, edit, handlePromoteDemote, isPromotingDemoting]
  );

  const refineCoreProps = useMemo(
    () => ({
      resource: 'staff',
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      sorters: {
        initial: [
          {
            field: 'first_name',
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

  const tableResult = useTable<Staff>({
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
    pageCount: pageCount,
  });

  if (isError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Error loading staff: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('staff')}
            Staff
          </h1>
          <p className='text-muted-foreground'>
            Manage administrative staff and lecturers
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            All Staff Members
          </CardTitle>
          <CardDescription>
            View and manage administrative staff and lecturers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search staff...'
              value={globalFilter ?? ''}
              onChange={event => setGlobalFilter(String(event.target.value))}
              className='max-w-sm'
            />
          </div>

          {isLoading ? (
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-[200px]' />
                    <Skeleton className='h-3 w-[160px]' />
                  </div>
                  <Skeleton className='h-4 w-[100px]' />
                  <Skeleton className='h-4 w-[150px]' />
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  {getHeaderGroups().map(headerGroup => (
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
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <DataTablePagination pagination={pagination} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};
