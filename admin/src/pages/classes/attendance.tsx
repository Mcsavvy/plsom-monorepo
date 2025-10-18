import { useState, useMemo, useCallback } from 'react';
import { useCustom, useUpdate, useCreate, useList } from '@refinedev/core';
import { useParams } from 'react-router';
import { useMeta } from '@/hooks/use-meta';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  UserCheck,
  UserX,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  Video,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/dataTransformers';

interface AttendanceSummary {
  class_info: {
    id: number;
    title: string;
    course_name: string;
    scheduled_at: string;
    duration_minutes: number;
  };
  attendance_summary: {
    total_enrolled: number;
    total_attended: number;
    total_absent: number;
    total_verified: number;
    total_unverified: number;
    attendance_rate: number;
    verification_rate: number;
  };
  attendance_list: Array<{
    student: {
      id: number;
      name: string;
      email: string;
      profile_picture?: string;
    };
    attendance: {
      id: number;
      join_time: string;
      leave_time: string | null;
      duration_minutes: number;
      via_recording: boolean;
      verified: boolean;
    } | null;
    status: 'attended' | 'absent';
  }>;
}

export const ClassAttendance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const { toast } = useToast();

  // Enhanced title and metadata support for breadcrumb integration
  const { meta: classMeta, isLoading: metaLoading } = useMeta('classes', id);

  const { mutate: updateAttendance } = useUpdate();
  const { mutate: createAttendance } = useCreate();

  // Get attendance summary for the class from URL
  const {
    query: {
      isLoading,
      refetch
    },

    result: attendanceData
  } = useCustom<AttendanceSummary>({
    url: 'attendance/class-summary/',
    method: 'get',
    config: {
      query: {
        class_id: id,
      },
    },
    queryOptions: {
      enabled: !!id,
      queryKey: ['attendance-summary', id],
    },
  });

  const absentStudents = attendanceData?.data?.attendance_list?.filter(student => student.status === 'absent');

  const handleVerifyAttendance = useCallback(
    (attendanceId: number) => {
      updateAttendance(
        {
          resource: 'attendance',
          id: attendanceId,
          values: { verified: true },
        },
        {
          onSuccess: () => {
            toast({
              title: 'Success',
              description: 'Attendance verified successfully.',
            });
            refetch();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: error.message || 'Failed to verify attendance.',
              variant: 'destructive',
            });
          },
        }
      );
    },
    [updateAttendance, toast, refetch]
  );

  const handleUnverifyAttendance = useCallback(
    (attendanceId: number) => {
      updateAttendance(
        {
          resource: 'attendance',
          id: attendanceId,
          values: { verified: false },
        },
        {
          onSuccess: () => {
            toast({
              title: 'Success',
              description: 'Attendance unverified successfully.',
            });
            refetch();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: error.message || 'Failed to unverify attendance.',
              variant: 'destructive',
            });
          },
        }
      );
    },
    [updateAttendance, toast, refetch]
  );

  const handleBulkVerify = useCallback(() => {
    if (!id) return;

    updateAttendance(
      {
        resource: 'attendance',
        id:  `${id}/bulk-verify`,
        values: {},
        meta: {
          query: { class_id: id },
          // Override the id for audit log to use only the numeric class ID
          id: parseInt(id),
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'All attendance records verified successfully.',
          });
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to verify attendance records.',
            variant: 'destructive',
          });
        },
      }
    );
  }, [id, updateAttendance, toast, refetch]);

  const handleAddManualAttendance = useCallback(() => {
    if (!id || !selectedStudentId) return;

    createAttendance(
      {
        resource: 'attendance',
        values: {
          class_session_id: parseInt(id),
          student_id: parseInt(selectedStudentId),
          join_time: attendanceData?.data?.class_info?.scheduled_at || new Date().toISOString(),
          duration_minutes: attendanceData?.data?.class_info?.duration_minutes || 90,
          via_recording: false,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Manual attendance added successfully.',
          });
          setIsAddAttendanceOpen(false);
          setSelectedStudentId('');
          refetch();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to add manual attendance.',
            variant: 'destructive',
          });
        },
      }
    );
  }, [id, selectedStudentId, attendanceData, createAttendance, toast, refetch]);

  const columns: ColumnDef<AttendanceSummary['attendance_list'][0]>[] = useMemo(
    () => [
      {
        accessorKey: 'student',
        header: 'Student',
        cell: ({ row }) => (
          <div className='flex items-center space-x-3'>
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={row.original.student.profile_picture?.replace("b2l/", "b2/") || ''}
                alt={row.original.student.name}
              />
              <AvatarFallback className='text-xs'>
                {getInitials(row.original.student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className='font-medium'>{row.original.student.name}</div>
              <div className='text-sm text-gray-500'>{row.original.student.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'attended' ? 'default' : 'secondary'}
            className='flex items-center gap-1'
          >
            {row.original.status === 'attended' ? (
              <>
                <UserCheck className='h-3 w-3' />
                Attended
              </>
            ) : (
              <>
                <UserX className='h-3 w-3' />
                Absent
              </>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: 'attendance',
        header: 'Attendance Details',
        cell: ({ row }) => {
          const attendance = row.original.attendance;
          if (!attendance) return <span className='text-gray-400'>No attendance record</span>;

          return (
            <div className='space-y-1'>
              <div className='text-sm'>
                <span className='font-medium'>Join:</span> {new Date(attendance.join_time).toLocaleTimeString()}
              </div>
              {attendance.leave_time && (
                <div className='text-sm'>
                  <span className='font-medium'>Leave:</span> {new Date(attendance.leave_time).toLocaleTimeString()}
                </div>
              )}
              <div className='text-sm'>
                <span className='font-medium'>Duration:</span> {attendance.duration_minutes}m
              </div>
              {attendance.via_recording && (
                <Badge variant='outline' className='text-xs'>
                  <Video className='h-3 w-3 mr-1' />
                  Recording
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'verified',
        header: 'Verification',
        cell: ({ row }) => {
          const attendance = row.original.attendance;
          if (!attendance) return <span className='text-gray-400'>Not Attended</span>;

          return (
            <div className='flex items-center gap-2'>
              <Badge
                variant={attendance.verified ? 'default' : 'secondary'}
                className='flex items-center gap-1'
              >
                {attendance.verified ? (
                  <>
                    <CheckCircle className='h-3 w-3' />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className='h-3 w-3' />
                    Pending
                  </>
                )}
              </Badge>
              {!attendance.verified ? (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleVerifyAttendance(attendance.id)}
                >
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Verify
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleUnverifyAttendance(attendance.id)}
                >
                  <XCircle className='h-3 w-3 mr-1' />
                  Unverify
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [handleVerifyAttendance, handleUnverifyAttendance]
  );

  const table = useReactTable({
    data: attendanceData?.data?.attendance_list || [],
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

  const summary = attendanceData?.data?.attendance_summary;
  const classInfo = attendanceData?.data?.class_info;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Users className='h-8 w-8' />
            {metaLoading ? (
              <Skeleton className='h-8 w-64' />
            ) : (
              classMeta?.name ? `${classMeta.name} - Attendance` : 'Class Attendance Management'
            )}
          </h1>
          <p className='text-muted-foreground'>
            {classMeta?.description || 'View and manage attendance for class sessions'}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => refetch()}
            disabled={!id}
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Dialog open={isAddAttendanceOpen} onOpenChange={setIsAddAttendanceOpen}>
            <DialogTrigger asChild>
              <Button disabled={!id}>
                <Plus className='h-4 w-4 mr-2' />
                Add Manual Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Attendance</DialogTitle>
                <DialogDescription>
                  Add attendance for a student who attended without using the platform.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='student'>Select Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Choose a student' />
                    </SelectTrigger>
                    <SelectContent>
                      {absentStudents?.map((student) => (
                        <SelectItem key={student.student.id} value={student.student.id.toString()}>
                          {student.student.name} ({student.student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' onClick={() => setIsAddAttendanceOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddManualAttendance} disabled={!selectedStudentId}>
                    Add Attendance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {id && (
        <>
          {/* Attendance Summary */}
          {summary && (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Enrolled</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{summary.total_enrolled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Attended</CardTitle>
                  <UserCheck className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>{summary.total_attended}</div>
                  <p className='text-xs text-muted-foreground'>
                    {summary.attendance_rate}% attendance rate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Absent</CardTitle>
                  <UserX className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-red-600'>{summary.total_absent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Verified</CardTitle>
                  <CheckCircle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-blue-600'>{summary.total_verified}</div>
                  <p className='text-xs text-muted-foreground'>
                    {summary.verification_rate}% verification rate
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Class Info */}
          {classInfo && (
            <Card>
              <CardHeader>
                <CardTitle>{classInfo.title}</CardTitle>
                <CardDescription>
                  {classInfo.course_name} • {new Date(classInfo.scheduled_at).toLocaleDateString()} • {classInfo.duration_minutes} minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex gap-2'>
                  <Button onClick={handleBulkVerify} variant='outline'>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Verify All Pending
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {summary && `${summary.total_attended} of ${summary.total_enrolled} students attended`}
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
                      <Skeleton className='h-8 w-8 rounded-full' />
                      <div className='space-y-2'>
                        <Skeleton className='h-4 w-[200px]' />
                        <Skeleton className='h-3 w-[150px]' />
                      </div>
                      <Skeleton className='h-4 w-[80px]' />
                      <Skeleton className='h-4 w-[120px]' />
                      <Skeleton className='h-4 w-[100px]' />
                    </div>
                  ))}
                </div>
              ) : (
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
                          <TableRow key={row.id}>
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
                          <TableCell colSpan={columns.length} className='h-24 text-center'>
                            No attendance records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!id && (
        <Card>
          <CardContent className='flex items-center justify-center h-32'>
            <div className='text-center'>
              <AlertTriangle className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
              <p className='text-muted-foreground'>Invalid class ID</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
