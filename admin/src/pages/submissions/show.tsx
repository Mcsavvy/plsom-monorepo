import { useOne, useNavigation } from '@refinedev/core';
import {
  Edit,
  User,
  GraduationCap,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Flag,
  MessageSquare,
} from 'lucide-react';
import { useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Submission, SubmissionAnswer } from '@/types/submission';
import { Label } from '@/components/ui/label';
import { transformSubmission } from '@/utils/dataTransformers';

export const SubmissionShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { edit } = useNavigation();

  const {
    result: submission,
    query: { isLoading, isError, error },
  } = useOne<Submission>({
    resource: 'submissions',
    id,
    meta: {
      transform: transformSubmission,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'submitted':
        return 'Submitted';
      case 'in_progress':
        return 'In Progress';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className='h-4 w-4' />;
      case 'submitted':
        return <FileText className='h-4 w-4' />;
      case 'in_progress':
        return <Clock className='h-4 w-4' />;
      case 'returned':
        return <XCircle className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeSpent = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const renderAnswerContent = (answer: SubmissionAnswer) => {
    switch (answer.questionType) {
      case 'text':
      case 'essay':
        return (
          <div className='bg-gray-50 p-3 rounded-md'>
            <p className='text-sm whitespace-pre-wrap'>{answer.textAnswer}</p>
          </div>
        );
      case 'yes_no':
        return (
          <div className='bg-gray-50 p-3 rounded-md'>
            <Badge variant={answer.booleanAnswer ? 'default' : 'secondary'}>
              {answer.booleanAnswer ? 'Yes' : 'No'}
            </Badge>
          </div>
        );
      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className='space-y-3'>
            {/* Available Options */}
            <div>
              <p className='text-sm font-medium text-gray-700 mb-2'>
                Available Options:
              </p>
              <div className='space-y-1'>
                {answer.questionOptions.map(option => (
                  <div
                    key={option.id}
                    className={`flex items-center space-x-2 p-2 rounded-md border ${
                      answer.selectedOptions.includes(option.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        answer.selectedOptions.includes(option.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {answer.selectedOptions.includes(option.id) && (
                        <div className='w-2 h-2 bg-white rounded-full' />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        answer.selectedOptions.includes(option.id)
                          ? 'text-blue-900 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      {option.text}
                    </span>
                    {option.isCorrect && (
                      <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'date':
        return (
          <div className='bg-gray-50 p-3 rounded-md'>
            <p className='text-sm'>{answer.dateAnswer || 'No date provided'}</p>
          </div>
        );
      case 'file_upload':
        return (
          <div className='bg-gray-50 p-3 rounded-md'>
            {answer.fileAnswer ? (
              <a
                href={answer.fileAnswer}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-800 underline'
              >
                View uploaded file
              </a>
            ) : (
              <p className='text-sm text-gray-500'>No file uploaded</p>
            )}
          </div>
        );
      default:
        return (
          <div className='bg-gray-50 p-3 rounded-md'>
            <p className='text-sm'>
              {answer.displayAnswer || 'No answer provided'}
            </p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className='p-4 space-y-4'>
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-96' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-32 w-full' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div className='p-4'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Error loading submission: {error?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const submissionData = submission;

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <div className='flex items-center space-x-2'>
            {getResourceIcon('submissions')}
            <h1 className='text-2xl font-bold'>Submission Details</h1>
          </div>
        </div>
        {['submitted', 'graded'].includes(submissionData.status) && (
          <Button onClick={() => edit('submissions', submissionData.id)}>
            <Edit className='h-4 w-4 mr-2' />
            Grade Submission
          </Button>
        )}
      </div>

      {/* Submission Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>Submission Overview</span>
            <Badge className={getStatusColor(submissionData.status)}>
              <div className='flex items-center space-x-1'>
                {getStatusIcon(submissionData.status)}
                <span>{getStatusText(submissionData.status)}</span>
              </div>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='flex items-center space-x-2'>
              <User className='h-4 w-4 text-gray-500' />
              <div>
                <p className='text-sm font-medium'>
                  {submissionData.studentName}
                </p>
                <p className='text-xs text-gray-500'>
                  {submissionData.studentEmail}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <GraduationCap className='h-4 w-4 text-gray-500' />
              <div>
                <p className='text-sm font-medium'>
                  {submissionData.testTitle}
                </p>
                <p className='text-xs text-gray-500'>Test</p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Clock className='h-4 w-4 text-gray-500' />
              <div>
                <p className='text-sm font-medium'>
                  {formatTimeSpent(submissionData.timeSpentMinutes)}
                </p>
                <p className='text-xs text-gray-500'>Time Spent</p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <FileText className='h-4 w-4 text-gray-500' />
              <div>
                <p className='text-sm font-medium'>
                  {Math.round(submissionData.completionPercentage)}%
                </p>
                <p className='text-xs text-gray-500'>Completion</p>
              </div>
            </div>
          </div>

          <Separator className='my-4' />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <p className='text-sm font-medium'>Started</p>
              <p className='text-sm text-gray-600'>
                {formatDateTime(submissionData.startedAt)}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium'>Submitted</p>
              <p className='text-sm text-gray-600'>
                {submissionData.submittedAt
                  ? formatDateTime(submissionData.submittedAt)
                  : 'Not submitted'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium'>Attempt</p>
              <p className='text-sm text-gray-600'>
                #{submissionData.attemptNumber}
              </p>
            </div>
          </div>

          {/* Score and Grading Info */}
          {(submissionData.status === 'graded' ||
            submissionData.status === 'returned') && (
            <>
              <Separator className='my-4' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <p className='text-sm font-medium'>Score</p>
                  <p className='text-sm text-gray-600'>
                    {submissionData.score} / {submissionData.maxScore}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Graded By</p>
                  <p className='text-sm text-gray-600'>
                    {submissionData.gradedByName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Graded At</p>
                  <p className='text-sm text-gray-600'>
                    {submissionData.gradedAt
                      ? formatDateTime(submissionData.gradedAt)
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* General Feedback */}
      {submissionData.feedback && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <MessageSquare className='h-4 w-4' />
              <span>General Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-gray-50 p-3 rounded-md'>
              <p className='text-sm whitespace-pre-wrap'>
                {submissionData.feedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Answers */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Student Answers</h2>
        {submissionData.answers.map((answer, index) => (
          <Card key={answer.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>
                  Question {index + 1}: {answer.questionTitle}
                </CardTitle>
                <div className='flex items-center space-x-2'>
                  <Badge variant='outline'>
                    {answer.questionType.replace('_', ' ')}
                  </Badge>
                  {answer.isFlagged && (
                    <Flag className='h-4 w-4 text-red-500' />
                  )}
                </div>
              </div>
              {answer.questionDescription && (
                <CardDescription>{answer.questionDescription}</CardDescription>
              )}
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Student's Answer */}
              <div>
                <Label className='text-sm font-medium'>Student's Answer</Label>
                {renderAnswerContent(answer)}
              </div>

              {/* Grading Information */}
              {(submissionData.status === 'graded' ||
                submissionData.status === 'returned') && (
                <>
                  <Separator />
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm font-medium'>Points Earned</p>
                      <p className='text-sm text-gray-600'>
                        {answer.pointsEarned || 0} / {answer.maxPoints}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm font-medium'>Answered At</p>
                      <p className='text-sm text-gray-600'>
                        {formatDateTime(answer.answeredAt)}
                      </p>
                    </div>
                  </div>

                  {answer.feedback && (
                    <div>
                      <p className='text-sm font-medium'>Feedback</p>
                      <div className='bg-blue-50 p-3 rounded-md mt-1'>
                        <p className='text-sm whitespace-pre-wrap'>
                          {answer.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
