import { useState, useMemo } from 'react';
import { useNavigation } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import {
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Edit,
  Clock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InviteStudentForm } from '../../components/InviteForm';
import { Student } from '@/types/student';
import { getStandardPhoneNumber } from '@/utils/common';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { getResourceIcon } from '@/utils/resourceUtils';

export const StudentsList: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { show, edit } = useNavigation();

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

  const getStatusColor = (status: 'active' | 'inactive' | 'pending') => {
    switch (status) {
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: 'active' | 'inactive' | 'pending') => {
    switch (status) {
      case 'inactive':
        return <XCircle className='h-3 w-3' />;
      case 'pending':
        return <Calendar className='h-3 w-3' />;
      case 'active':
        return <CheckCircle className='h-3 w-3' />;
      default:
        return <CheckCircle className='h-3 w-3' />;
    }
  };

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
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
          const student = row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage
                  src={student.profilePicture || ''}
                  alt={student.firstName}
                />
                <AvatarFallback>{student.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className='flex items-center gap-2'>
                  <div
                    className='font-medium cursor-pointer hover:text-primary/80 hover:underline'
                    onClick={() => show('students', student.id)}
                  >
                    {student.displayName}
                  </div>
                </div>
                <a
                  href={`mailto:${student.email}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 text-sm text-muted-foreground'
                >
                  <Mail className='h-3 w-3' />
                  {student.email}
                </a>
                {student.whatsappNumber && (
                  <a
                    href={`https://wa.me/${getStandardPhoneNumber(student.whatsappNumber)}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-sm text-muted-foreground'
                  >
                    <Phone className='h-3 w-3' />
                    {student.whatsappNumber}
                  </a>
                )}
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const studentA = rowA.original;
          const studentB = rowB.original;
          return studentA.fullName.localeCompare(studentB.fullName);
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
          const student = row.original;
          return (
            <Badge variant='outline' className={getStatusColor(student.status)}>
              {getStatusIcon(student.status)}
              <span className='ml-1'>{student.statusText}</span>
            </Badge>
          );
        },
        sortingFn: (rowA, rowB) => {
          const studentA = rowA.original;
          const studentB = rowB.original;
          return studentA.statusText.localeCompare(studentB.statusText);
        },
      },
      {
        accessorKey: 'enrollmentCounts',
        header: 'Programs',
        cell: ({ row }) => {
          const student = row.original;
          if (student.enrollmentCount === 0) {
            return (
              <span className='text-muted-foreground'>No enrollments</span>
            );
          }

          return (
            <div className='space-y-1'>
              <div className='flex flex-wrap gap-1'>
                {student.programTypes.map((type, index) => (
                  <Badge
                    key={index}
                    variant='outline'
                    className={`${getProgramTypeColor(type)} text-xs`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const studentA = rowA.original;
          const studentB = rowB.original;
          return (
            studentA.activeEnrollmentCount - studentB.activeEnrollmentCount
          );
        },
      },
      {
        accessorKey: 'enrollments',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Enrollments
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
          const student = row.original;
          if (student.enrollmentCount === 0) {
            return <span className='text-muted-foreground'>No programs</span>;
          }

          return (
            <div className='flex flex-wrap gap-1'>
              {student.enrollments.slice(0, 3).map(enrollment => (
                <Badge
                  key={enrollment.id}
                  variant='outline'
                  className={`${getProgramTypeColor(enrollment.cohort.programType)} cursor-pointer text-xs`}
                  onClick={() => show('enrollments', enrollment.id)}
                >
                  {enrollment.cohort.name}
                </Badge>
              ))}
              {student.enrollments.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{student.enrollments.length - 3} more
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'joinDate',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className='h-auto p-0 font-medium'
            >
              Join Date
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
          const student = row.original;
          if (student.enrollments.length === 0) {
            return <span className='text-muted-foreground'>Not enrolled</span>;
          }

          const firstEnrollment = student.enrollments.reduce(
            (earliest, current) =>
              new Date(current.enrolledAt) < new Date(earliest.enrolledAt)
                ? current
                : earliest
          );

          const latestEnrollment = student.enrollments.reduce(
            (latest, current) =>
              new Date(current.enrolledAt) > new Date(latest.enrolledAt)
                ? current
                : latest
          );

          return (
            <div className='space-y-1'>
              <div className='flex items-center gap-1 text-sm'>
                <Calendar className='h-3 w-3' />
                <span>
                  {new Date(firstEnrollment.enrolledAt).toLocaleDateString()}
                </span>
              </div>
              {firstEnrollment.id !== latestEnrollment.id && (
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Clock className='h-3 w-3' />
                  Latest:{' '}
                  {new Date(latestEnrollment.enrolledAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const studentA = rowA.original;
          const studentB = rowB.original;

          if (
            studentA.enrollments.length === 0 &&
            studentB.enrollments.length === 0
          )
            return 0;
          if (studentA.enrollments.length === 0) return 1;
          if (studentB.enrollments.length === 0) return -1;

          const firstEnrollmentA = studentA.enrollments.reduce(
            (earliest, current) =>
              new Date(current.enrolledAt) < new Date(earliest.enrolledAt)
                ? current
                : earliest
          );
          const firstEnrollmentB = studentB.enrollments.reduce(
            (earliest, current) =>
              new Date(current.enrolledAt) < new Date(earliest.enrolledAt)
                ? current
                : earliest
          );

          return (
            new Date(firstEnrollmentA.enrolledAt).getTime() -
            new Date(firstEnrollmentB.enrolledAt).getTime()
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const student = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => edit('students', student.id)}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Student
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [show, edit]
  );

  const refineCoreProps = useMemo(
    () => ({
      resource: 'students',
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      sorters: {
        initial: [
          {
            field: 'firstName',
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
    []
  );

  const tableResult = useTable<Student>({
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

  const table = useReactTable<Student>({
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
          Error loading students: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('students')}
            Students
          </h1>
          <p className='text-muted-foreground'>
            Manage students and their enrollments across programs
          </p>
        </div>
        <div className='flex gap-2'>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className='gap-2'>
                <UserPlus className='h-4 w-4' />
                Invite Student
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Invite New Student</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new student to join a program
                </DialogDescription>
              </DialogHeader>
              <InviteStudentForm onSuccess={() => setInviteDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            All Students
          </CardTitle>
          <CardDescription>
            View and manage all students in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Input
              placeholder='Search students...'
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
            <>
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
                          No students found.
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
