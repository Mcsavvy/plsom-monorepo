import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useStudentAcademicSummary } from '@/hooks/useStudentAcademicSummary';
import type { AcademicSummary, AssessmentRow } from '@/types/academicSummary';
import {
  STATUS_META,
  type AttentionItem,
  type GradeFilter,
  type Tone,
  buildAttentionItems,
  buildGradeTrend,
  filterAndSortTests,
  formatPercent,
  formatScore,
  percentTone,
  rateTone,
  toneBar,
  toneText,
} from '@/utils/academicSummary';

const fmtDate = (iso: string | null) =>
  iso ? format(new Date(iso), 'MMM d, yyyy') : '–';

const Meter = ({ value, tone }: { value: number | null; tone: Tone }) => (
  <div
    className='h-1.5 w-full rounded-full bg-muted overflow-hidden'
    role='presentation'
  >
    <div
      className={cn('h-full rounded-full', toneBar[tone])}
      style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
    />
  </div>
);

const StatusBadge = ({ status }: { status: AssessmentRow['status'] }) => (
  <Badge
    variant='outline'
    className={cn('whitespace-nowrap', STATUS_META[status].className)}
  >
    {STATUS_META[status].label}
  </Badge>
);

/** Where an admin should land for a test row: the counted submission. */
const submissionHref = (t: AssessmentRow) =>
  t.submissionId ? `/submissions/${t.submissionId}` : `/tests/${t.testId}`;

// ---------------------------------------------------------------------------

const Kpis = ({ data }: { data: AcademicSummary }) => {
  const s = data.summary;
  const gradeTone = percentTone(s.averagePercentage, data.lowScoreThreshold);
  const completionTone = rateTone(s.completionRate);
  const attendanceTone = rateTone(s.attendanceRate);
  const attention =
    s.statusCounts.missed +
    s.statusCounts.returned +
    s.statusCounts.awaiting_grading +
    s.lowScoreCount;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Average grade</CardTitle>
          <Award className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className={cn('text-3xl font-bold', toneText[gradeTone])}>
            {formatPercent(s.averagePercentage)}
          </div>
          <Meter value={s.averagePercentage} tone={gradeTone} />
          <p className='text-xs text-muted-foreground'>
            {s.statusCounts.graded === 0
              ? 'No graded assessments yet'
              : `${s.statusCounts.graded} graded · best ${formatPercent(s.highestPercentage)} · lowest ${formatPercent(s.lowestPercentage)}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Work turned in</CardTitle>
          <ClipboardList className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className={cn('text-3xl font-bold', toneText[completionTone])}>
            {formatPercent(s.completionRate)}
          </div>
          <Meter value={s.completionRate} tone={completionTone} />
          <p className='text-xs text-muted-foreground'>
            {s.testsTurnedIn} of {s.testsDue} due
            {s.statusCounts.upcoming > 0 &&
              ` · ${s.statusCounts.upcoming} upcoming`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Attendance</CardTitle>
          <CalendarCheck className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className={cn('text-3xl font-bold', toneText[attendanceTone])}>
            {formatPercent(s.attendanceRate)}
          </div>
          <Meter value={s.attendanceRate} tone={attendanceTone} />
          <p className='text-xs text-muted-foreground'>
            {s.classesHeld === 0
              ? 'No classes held yet'
              : `${s.classesAttended} of ${s.classesHeld} classes · ${s.classesAttendedRecording} via recording`}
          </p>
        </CardContent>
      </Card>

      <Card className={attention > 0 ? 'border-amber-300' : undefined}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Needs attention</CardTitle>
          <AlertTriangle
            className={cn(
              'h-4 w-4',
              attention > 0 ? 'text-amber-600' : 'text-muted-foreground'
            )}
          />
        </CardHeader>
        <CardContent className='space-y-2'>
          <div
            className={cn(
              'text-3xl font-bold',
              attention > 0 ? 'text-amber-700' : 'text-green-700'
            )}
          >
            {attention}
          </div>
          <p className='text-xs text-muted-foreground'>
            {s.statusCounts.missed} missed · {s.lowScoreCount} low ·{' '}
            {s.statusCounts.awaiting_grading} to grade ·{' '}
            {s.statusCounts.returned} returned
          </p>
          <p className='text-xs text-muted-foreground'>
            Last activity:{' '}
            {s.lastActivityAt
              ? formatDistanceToNow(new Date(s.lastActivityAt), {
                  addSuffix: true,
                })
              : 'none recorded'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------

const ATTENTION_ICON: Record<AttentionItem['kind'], string> = {
  missed: 'bg-red-600',
  low_score: 'bg-red-400',
  returned: 'bg-orange-500',
  awaiting_grading: 'bg-yellow-500',
};

const AttentionList = ({ items }: { items: AttentionItem[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, 5);
  return (
    <Card className='border-amber-300'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4 text-amber-600' />
          Needs attention ({items.length})
        </CardTitle>
        <CardDescription>
          Missed work and low grades first, then work waiting on someone.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-1'>
        {shown.map(item => (
          <Link
            key={item.key}
            to={submissionHref(item.test)}
            className='flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60'
          >
            <span
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                ATTENTION_ICON[item.kind]
              )}
            />
            <span className='min-w-0 flex-1'>
              <span className='block text-sm font-medium truncate'>
                {item.test.title}
              </span>
              <span className='block text-xs text-muted-foreground'>
                {item.test.courseName} · {item.message}
              </span>
            </span>
            <ExternalLink className='mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground' />
          </Link>
        ))}
        {items.length > 5 && (
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------

const trendConfig = {
  percentage: { label: 'Grade', color: 'hsl(221 83% 53%)' },
} satisfies ChartConfig;

const GradeTrend = ({ data }: { data: AcademicSummary }) => {
  const points = useMemo(() => buildGradeTrend(data.tests), [data.tests]);
  if (points.length < 2) return null;
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-sm font-medium mb-1'>Grade trend</p>
      <p className='text-xs text-muted-foreground mb-3'>
        Each graded assessment in the order it was graded. Dashed line marks{' '}
        {formatPercent(data.lowScoreThreshold)}.
      </p>
      <ChartContainer
        config={trendConfig}
        className='aspect-auto h-[200px] w-full'
      >
        <LineChart data={points} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='gradedAt'
            tickLine={false}
            axisLine={false}
            tickFormatter={v => format(new Date(v), 'MMM d')}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={v => `${v}%`}
          />
          <ReferenceLine
            y={data.lowScoreThreshold}
            stroke='hsl(0 72% 51%)'
            strokeDasharray='4 4'
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload;
                  return p ? `${p.label} · ${p.courseName}` : '';
                }}
                formatter={value => formatPercent(Number(value))}
              />
            }
          />
          <Line
            dataKey='percentage'
            type='linear'
            stroke='var(--color-percentage)'
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

const FILTERS: { value: GradeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'graded', label: 'Graded' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'attention', label: 'Needs attention' },
];

const GradesTab = ({ data }: { data: AcademicSummary }) => {
  const [filter, setFilter] = useState<GradeFilter>('all');
  const [course, setCourse] = useState<string>('all');
  const rows = useMemo(
    () =>
      filterAndSortTests(
        data.tests,
        filter,
        course === 'all' ? 'all' : Number(course)
      ),
    [data.tests, filter, course]
  );

  if (data.tests.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className='h-10 w-10' />}
        title='No assessments yet'
        body='Published tests for this student’s cohorts will appear here.'
      />
    );
  }

  return (
    <div className='space-y-4'>
      <GradeTrend data={data} />

      <div className='flex flex-col sm:flex-row sm:items-center gap-3 justify-between'>
        <div className='flex flex-wrap gap-1' role='group' aria-label='Filter'>
          {FILTERS.map(f => (
            <Button
              key={f.value}
              size='sm'
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
            >
              {f.label}
            </Button>
          ))}
        </div>
        {data.courses.length > 1 && (
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className='w-full sm:w-[220px]' aria-label='Course'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All courses</SelectItem>
              {data.courses.map(c => (
                <SelectItem key={c.courseId} value={String(c.courseId)}>
                  {c.courseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {rows.length === 0 ? (
        <p className='text-sm text-muted-foreground py-8 text-center'>
          Nothing matches this filter.{' '}
          <button
            className='underline'
            onClick={() => {
              setFilter('all');
              setCourse('all');
            }}
          >
            Clear filters
          </button>
        </p>
      ) : (
        <div className='rounded-lg border overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='min-w-[220px]'>Assessment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Score</TableHead>
                <TableHead className='text-right'>Grade</TableHead>
                <TableHead className='text-center'>Attempts</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Graded by</TableHead>
                <TableHead className='w-10'>
                  <span className='sr-only'>Open</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(t => {
                const tone = percentTone(t.percentage, data.lowScoreThreshold);
                return (
                  <TableRow key={t.testId}>
                    <TableCell>
                      <div className='font-medium'>{t.title}</div>
                      <div className='text-xs text-muted-foreground'>
                        {t.courseName} · {t.cohortName}
                        {t.availableUntil &&
                          ` · due ${fmtDate(t.availableUntil)}`}
                      </div>
                      {t.feedback && (
                        <div
                          className='text-xs text-muted-foreground italic mt-1 line-clamp-2 max-w-[360px]'
                          title={t.feedback}
                        >
                          “{t.feedback}”
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col items-start gap-1'>
                        <StatusBadge status={t.status} />
                        {t.hasPendingAttempt && (
                          <span className='text-[11px] text-yellow-800'>
                            + newer attempt to grade
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-right tabular-nums whitespace-nowrap'>
                      {t.status === 'graded'
                        ? formatScore(t.score, t.maxScore)
                        : '–'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums font-semibold',
                        toneText[tone]
                      )}
                    >
                      {formatPercent(t.percentage)}
                    </TableCell>
                    <TableCell
                      className='text-center tabular-nums'
                      title={
                        t.attempts.length > 1
                          ? t.attempts
                              .map(
                                a =>
                                  `#${a.attemptNumber} ${a.status}${a.percentage !== null ? ` ${formatPercent(a.percentage)}` : ''}`
                              )
                              .join('\n')
                          : undefined
                      }
                    >
                      {t.attemptsUsed}/{t.maxAttempts}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {fmtDate(t.submittedAt)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-sm'>
                      {t.gradedByName ?? '–'}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={submissionHref(t)}
                        aria-label={`Open ${t.title}`}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted'
                      >
                        <ExternalLink className='h-4 w-4' />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <p className='text-xs text-muted-foreground'>
        The grade shown is the best graded attempt. Averages weigh every
        assessment equally.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------

const CoursesTab = ({ data }: { data: AcademicSummary }) => {
  if (data.courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className='h-10 w-10' />}
        title='No course activity yet'
        body='Courses appear once this student has tests or classes.'
      />
    );
  }
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {data.courses.map(c => {
        const gTone = percentTone(c.averagePercentage, data.lowScoreThreshold);
        const aTone = rateTone(c.attendanceRate);
        return (
          <div key={c.courseId} className='rounded-lg border p-4 space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <h4 className='font-medium truncate'>{c.courseName}</h4>
              <span className='text-xs text-muted-foreground whitespace-nowrap'>
                {c.testsGraded}/{c.testsTotal} graded
              </span>
            </div>
            <div className='space-y-1'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Average grade</span>
                <span
                  className={cn('font-semibold tabular-nums', toneText[gTone])}
                >
                  {formatPercent(c.averagePercentage)}
                </span>
              </div>
              <Meter value={c.averagePercentage} tone={gTone} />
            </div>
            <div className='space-y-1'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>
                  Attendance ({c.classesAttended}/{c.classesHeld})
                </span>
                <span
                  className={cn('font-semibold tabular-nums', toneText[aTone])}
                >
                  {formatPercent(c.attendanceRate)}
                </span>
              </div>
              <Meter value={c.attendanceRate} tone={aTone} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------

const AttendanceTab = ({ data }: { data: AcademicSummary }) => {
  const [showAll, setShowAll] = useState(false);
  if (data.classes.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheck className='h-10 w-10' />}
        title='No classes held yet'
        body='Past classes for this student’s cohorts will appear here.'
      />
    );
  }
  const rows = showAll ? data.classes : data.classes.slice(0, 15);
  return (
    <div className='space-y-3'>
      <div className='rounded-lg border overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className='min-w-[200px]'>Class</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className='text-right'>Minutes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(c => (
              <TableRow key={c.classId}>
                <TableCell className='whitespace-nowrap'>
                  {format(new Date(c.scheduledAt), 'MMM d, yyyy · HH:mm')}
                </TableCell>
                <TableCell>
                  <div className='font-medium'>{c.title}</div>
                  <div className='text-xs text-muted-foreground'>
                    {c.courseName} · {c.cohortName}
                  </div>
                </TableCell>
                <TableCell>
                  {c.attendedVia === 'live' ? (
                    <Badge
                      variant='outline'
                      className='bg-green-100 text-green-800 border-green-300'
                    >
                      Attended live
                    </Badge>
                  ) : c.attendedVia === 'recording' ? (
                    <Badge
                      variant='outline'
                      className='bg-blue-100 text-blue-800 border-blue-300'
                    >
                      Watched recording
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className='bg-red-100 text-red-800 border-red-300'
                    >
                      Absent
                    </Badge>
                  )}
                  {c.attended && c.verified && (
                    <span className='ml-2 text-xs text-muted-foreground'>
                      verified
                    </span>
                  )}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {c.attended
                    ? `${c.minutesAttended}/${c.durationMinutes}`
                    : '–'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data.classes.length > 15 && (
        <Button
          variant='ghost'
          size='sm'
          className='w-full'
          onClick={() => setShowAll(v => !v)}
        >
          {showAll
            ? 'Show recent only'
            : `Show all ${data.classes.length} classes`}
        </Button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const EmptyState = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div className='text-center py-10'>
    <div className='mx-auto mb-3 w-fit text-muted-foreground'>{icon}</div>
    <h3 className='font-medium mb-1'>{title}</h3>
    <p className='text-sm text-muted-foreground'>{body}</p>
  </div>
);

const LoadingState = () => (
  <div className='space-y-4' aria-busy='true'>
    <Skeleton className='h-6 w-[220px]' />
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} className='h-[132px]' />
      ))}
    </div>
    <Skeleton className='h-[320px]' />
  </div>
);

export const AcademicPerformance: React.FC<{ studentId: number }> = ({
  studentId,
}) => {
  const { summary, isLoading, isError, error, refetch } =
    useStudentAcademicSummary(studentId);

  const attention = useMemo(
    () =>
      summary
        ? buildAttentionItems(summary.tests, summary.lowScoreThreshold)
        : [],
    [summary]
  );

  if (isLoading) return <LoadingState />;

  if (isError || !summary) {
    return (
      <Alert variant='destructive'>
        <AlertDescription className='flex items-center justify-between gap-4'>
          <span>
            Could not load grades and attendance
            {error?.message ? `: ${error.message}` : '.'}
          </span>
          <Button size='sm' variant='outline' onClick={() => refetch()}>
            <RefreshCw className='h-3.5 w-3.5 mr-1' /> Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const counts = summary.summary.statusCounts;
  return (
    <section className='space-y-4' aria-labelledby='academic-heading'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 id='academic-heading' className='text-xl font-semibold'>
            Academic performance
          </h2>
          <p className='text-sm text-muted-foreground'>
            Grades, outstanding work and attendance across all cohorts.
          </p>
        </div>
        {summary.scope === 'lecturer' && (
          <Badge variant='secondary'>Showing your courses only</Badge>
        )}
      </div>

      <Kpis data={summary} />
      <AttentionList items={attention} />

      <Card>
        <CardContent className='pt-6'>
          <Tabs defaultValue='grades'>
            <TabsList className='mb-4 h-auto flex-wrap justify-start'>
              <TabsTrigger value='grades'>
                Grades ({summary.summary.testsTotal})
              </TabsTrigger>
              <TabsTrigger value='courses'>
                By course ({summary.courses.length})
              </TabsTrigger>
              <TabsTrigger value='attendance'>
                Attendance ({summary.summary.classesHeld})
              </TabsTrigger>
            </TabsList>
            <TabsContent value='grades'>
              <GradesTab data={summary} />
            </TabsContent>
            <TabsContent value='courses'>
              <CoursesTab data={summary} />
            </TabsContent>
            <TabsContent value='attendance'>
              <AttendanceTab data={summary} />
            </TabsContent>
          </Tabs>
          {counts.in_progress > 0 && (
            <p className='mt-3 text-xs text-muted-foreground'>
              {counts.in_progress} assessment
              {counts.in_progress === 1 ? ' is' : 's are'} still in progress.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
