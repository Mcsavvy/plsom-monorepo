import { useState } from 'react';
import {
  useOne,
  useNavigation,
  useDelete,
  useCreate,
  useCustom,
  useCustomMutation,
} from '@refinedev/core';
import { useParams } from 'react-router';
import {
  Edit,
  Trash2,
  FileText,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Play,
  Archive,
  BarChart3,
  Calendar,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Separator } from '@/components/ui/separator';
import {
  TestDetail,
  TestStatistics,
  TestDetailResponse,
  TestStatisticsResponse,
} from '@/types/test';
import {
  transformTestDetail,
  transformTestStatistics,
} from '@/utils/dataTransformers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const TestsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { list, edit, show } = useNavigation();
  const { mutate: deleteTest } = useDelete();
  const { mutate: createTest } = useCreate();
  const { mutate: customAction } = useCustomMutation();

  const { data: testData, isLoading } = useOne<TestDetail>({
    resource: 'tests',
    id: id,
    meta: {
      transform: (data: TestDetailResponse) => transformTestDetail(data),
    },
  });

  const { data: statisticsData, isLoading: isLoadingStats } =
    useCustom<TestStatistics>({
      url: `/tests/${id}/statistics/`,
      method: 'get',
      meta: {
        transform: (data: TestStatisticsResponse) =>
          transformTestStatistics(data),
      },
    });

  const test = testData?.data;
  const statistics = statisticsData?.data;

  const handleDelete = () => {
    if (!test) return;

    setIsDeleting(true);
    deleteTest(
      {
        resource: 'tests',
        id: test.id,
      },
      {
        onSuccess: () => {
          list('tests');
        },
        onError: (error: unknown) => {
          console.error('Delete error:', error);
          setIsDeleting(false);
        },
      }
    );
  };

  const handleClone = () => {
    if (!test) return;

    setIsCloning(true);

    const clonedTestData = {
      title: `Copy of ${test.title}`,
      description: test.description,
      instructions: test.instructions,
      course: test.course,
      cohort: test.cohort,
      time_limit_minutes: test.timeLimitMinutes,
      max_attempts: test.maxAttempts,
      allow_review_after_submission: test.allowReviewAfterSubmission,
      randomize_questions: test.randomizeQuestions,
      status: 'draft' as const,
      questions: test.questions.map(q => ({
        question_type: q.questionType,
        title: q.title,
        description: q.description,
        is_required: q.isRequired,
        options: q.options.map(o => ({
          text: o.text,
          is_correct: o.isCorrect,
        })),
      })),
    };

    createTest(
      {
        resource: 'tests',
        values: clonedTestData,
      },
      {
        onSuccess: data => {
          if (data.data?.id) {
            edit('tests', data.data.id);
          }
        },
        onError: (error: unknown) => {
          console.error('Clone error:', error);
          setIsCloning(false);
        },
      }
    );
  };

  const handleAction = (action: string, endpoint: string) => {
    if (!test) return;

    setActionLoading(action);
    customAction(
      {
        url: `/tests/${test.id}/${endpoint}/`,
        method: 'post',
        values: {},
      },
      {
        onSuccess: () => {
          // Refresh test data
          window.location.reload();
        },
        onError: (error: unknown) => {
          console.error(`${action} error:`, error);
          setActionLoading(null);
        },
      }
    );
  };

  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      text: 'Short Answer',
      essay: 'Essay',
      yes_no: 'Yes/No',
      single_choice: 'Single Choice',
      multiple_choice: 'Multiple Choice',
      scripture_reference: 'Scripture Reference',
      document_upload: 'Document Upload',
      reflection: 'Spiritual Reflection',
      ministry_plan: 'Ministry Plan',
      theological_position: 'Theological Position',
      case_study: 'Case Study',
      sermon_outline: 'Sermon Outline',
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (!test) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Test not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('tests')}
          {test.title}
        </h1>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleClone}
            disabled={isCloning}
            className='gap-2'
          >
            {isCloning ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Copy className='h-4 w-4' />
            )}
            {isCloning ? 'Cloning...' : 'Clone'}
          </Button>

          {test.status === 'draft' && (
            <Button
              variant='outline'
              onClick={() => handleAction('publish', 'publish')}
              disabled={actionLoading === 'publish'}
              className='gap-2'
            >
              {actionLoading === 'publish' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Play className='h-4 w-4' />
              )}
              {actionLoading === 'publish' ? 'Publishing...' : 'Publish'}
            </Button>
          )}

          {test.status === 'published' && (
            <Button
              variant='outline'
              onClick={() => handleAction('archive', 'archive')}
              disabled={actionLoading === 'archive'}
              className='gap-2'
            >
              {actionLoading === 'archive' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Archive className='h-4 w-4' />
              )}
              {actionLoading === 'archive' ? 'Archiving...' : 'Archive'}
            </Button>
          )}

          {test.status === 'archived' && (
            <Button
              variant='outline'
              onClick={() => handleAction('unarchive', 'unarchive')}
              disabled={actionLoading === 'unarchive'}
              className='gap-2'
            >
              {actionLoading === 'unarchive' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Archive className='h-4 w-4' />
              )}
              {actionLoading === 'unarchive' ? 'Unarchiving...' : 'Unarchive'}
            </Button>
          )}

          <Button
            variant='outline'
            onClick={() => edit('tests', test.id)}
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            Edit
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
            className='gap-2'
          >
            {isDeleting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Trash2 className='h-4 w-4' />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='questions'>Questions</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Status
                  </p>
                  <Badge variant='outline' className={test.statusColor}>
                    {test.status === 'published' ? (
                      <>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        Published
                      </>
                    ) : test.status === 'draft' ? (
                      <>
                        <Edit className='mr-1 h-3 w-3' />
                        Draft
                      </>
                    ) : (
                      <>
                        <Archive className='mr-1 h-3 w-3' />
                        Archived
                      </>
                    )}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Course & Cohort
                  </p>
                  <p
                    className='text-sm hover:text-primary/80 hover:underline cursor-pointer'
                    onClick={() => show('courses', test.course)}
                  >
                    {test.courseName}
                  </p>
                  <p
                    className='text-xs text-muted-foreground hover:text-primary/80 hover:underline cursor-pointer'
                    onClick={() => show('cohorts', test.cohort)}
                  >
                    {test.cohortName}
                  </p>
                </div>

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Questions
                  </p>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-muted-foreground' />
                    <span className='font-medium'>{test.totalQuestions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  Test Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Time Limit
                  </p>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>{test.formattedTimeLimit}</span>
                  </div>
                </div>

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Max Attempts
                  </p>
                  <span className='text-sm font-medium'>
                    {test.maxAttempts}
                  </span>
                </div>

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Review After Submission
                  </p>
                  <Badge variant='outline'>
                    {test.allowReviewAfterSubmission ? (
                      <>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        Allowed
                      </>
                    ) : (
                      <>
                        <XCircle className='mr-1 h-3 w-3' />
                        Not Allowed
                      </>
                    )}
                  </Badge>
                </div>

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Randomize Questions
                  </p>
                  <Badge variant='outline'>
                    {test.randomizeQuestions ? (
                      <>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        Yes
                      </>
                    ) : (
                      <>
                        <XCircle className='mr-1 h-3 w-3' />
                        No
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Availability Window
                  </p>
                  <p className='text-sm'>{test.formattedAvailability}</p>
                </div>

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Currently Available
                  </p>
                  <Badge variant='outline'>
                    {test.isAvailable ? (
                      <>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle className='mr-1 h-3 w-3' />
                        Unavailable
                      </>
                    )}
                  </Badge>
                </div>

                <Separator />

                <div className='grid grid-cols-2 gap-4 text-xs text-muted-foreground'>
                  <div>
                    <p>Created</p>
                    <p>{new Date(test.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p>Updated</p>
                    <p>{new Date(test.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='prose prose-sm max-w-none'>
                <p className='text-muted-foreground leading-relaxed'>
                  {test.description ||
                    'No description available for this test.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {test.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Test Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose prose-sm max-w-none'>
                  <p className='text-muted-foreground leading-relaxed'>
                    {test.instructions}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='questions' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>Questions ({test.questions.length})</span>
                <Button
                  onClick={() => edit('tests', test.id)}
                  size='sm'
                  variant='outline'
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Edit Questions
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {test.questions.length === 0 ? (
                <div className='text-center py-8'>
                  <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <p className='text-muted-foreground'>
                    No questions added yet
                  </p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Edit this test to add questions
                  </p>
                </div>
              ) : (
                <div className='space-y-6'>
                  {test.questions.map((question, index) => (
                    <div key={question.id} className='border rounded-lg p-4'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-muted-foreground'>
                            Q{index + 1}
                          </span>
                          <Badge variant='outline' className='text-xs'>
                            {getQuestionTypeLabel(question.questionType)}
                          </Badge>
                          {question.isRequired && (
                            <Badge
                              variant='outline'
                              className='text-xs bg-red-50 text-red-700'
                            >
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>

                      <h4 className='font-medium mb-2'>{question.title}</h4>

                      {question.description && (
                        <p className='text-sm text-muted-foreground mb-3'>
                          {question.description}
                        </p>
                      )}

                      {question.options.length > 0 && (
                        <div className='space-y-2'>
                          <p className='text-sm font-medium text-muted-foreground'>
                            Options:
                          </p>
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={option.id}
                              className='flex items-center gap-2 text-sm'
                            >
                              <span className='text-muted-foreground'>
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option.text}</span>
                              {option.isCorrect && (
                                <CheckCircle className='h-4 w-4 text-green-600' />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {(question.minWordCount || question.maxWordCount) && (
                        <div className='mt-3 text-xs text-muted-foreground'>
                          Word count:{' '}
                          {question.minWordCount &&
                            `min ${question.minWordCount}`}
                          {question.minWordCount &&
                            question.maxWordCount &&
                            ', '}
                          {question.maxWordCount &&
                            `max ${question.maxWordCount}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          {isLoadingStats ? (
            <div className='flex items-center justify-center h-32'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : statistics ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Users className='h-5 w-5 text-muted-foreground' />
                    <span className='text-2xl font-bold'>
                      {statistics.totalSubmissions}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Completed Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-5 w-5 text-green-600' />
                    <span className='text-2xl font-bold'>
                      {statistics.completedSubmissions}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5 text-blue-600' />
                    <span className='text-2xl font-bold'>
                      {statistics.completionRate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Avg. Completion Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-orange-600' />
                    <span className='text-2xl font-bold'>
                      {statistics.formattedAverageTime}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {statistics.averageScore > 0 && (
                <Card className='md:col-span-2'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      Average Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center gap-2'>
                      <BarChart3 className='h-5 w-5 text-purple-600' />
                      <span className='text-2xl font-bold'>
                        {statistics.averageScore.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className='text-center py-8'>
                <BarChart3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>
                  No analytics data available
                </p>
                <p className='text-sm text-muted-foreground mt-2'>
                  Analytics will appear once students start taking this test
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
