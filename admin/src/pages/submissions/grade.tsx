import { useState, useEffect } from 'react';
import { useOne, useNavigation, useCustomMutation } from '@refinedev/core';
import {
  Save,
  AlertCircle,
  Clock,
  User,
  GraduationCap,
  FileText,
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Submission, SubmissionAnswer } from '@/types/submission';
import { useToast } from '@/hooks/use-toast';
import { transformSubmission } from '@/utils/dataTransformers';

export const SubmissionGrade: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { goBack } = useNavigation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingData, setGradingData] = useState<{
    answers: Record<
      string,
      { pointsEarned: number; feedback: string; isFlagged: boolean }
    >;
    generalFeedback: string;
    returnForRevision: boolean;
  }>({
    answers: {},
    generalFeedback: '',
    returnForRevision: false,
  });

  const {
    data: submission,
    isLoading,
    isError,
    error,
  } = useOne<Submission>({
    resource: 'submissions',
    id,
    meta: {
      transform: transformSubmission,
    },
  });

  const { mutate: gradeSubmission } = useCustomMutation();

  useEffect(() => {
    if (submission?.data) {
      const initialGradingData: Record<
        string,
        { pointsEarned: number; feedback: string; isFlagged: boolean }
      > = {};

      submission.data.answers.forEach(answer => {
        initialGradingData[answer.id.toString()] = {
          pointsEarned: answer.pointsEarned || 0,
          feedback: answer.feedback || '',
          isFlagged: answer.isFlagged || false,
        };
      });

      setGradingData({
        answers: initialGradingData,
        generalFeedback: submission.data.feedback || '',
        returnForRevision: false,
      });
    }
  }, [submission]);

  const handleAnswerGradeChange = (
    answerId: string,
    field: string,
    value: any
  ) => {
    setGradingData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [answerId]: {
          ...prev.answers[answerId],
          [field]: value,
        },
      },
    }));
  };

  const handleGeneralFeedbackChange = (value: string) => {
    setGradingData(prev => ({
      ...prev,
      generalFeedback: value,
    }));
  };

  const handleReturnForRevisionChange = (value: boolean) => {
    setGradingData(prev => ({
      ...prev,
      returnForRevision: value,
    }));
  };

  const handleSubmitGrade = async () => {
    if (!submission?.data) return;

    setIsSubmitting(true);
    try {
      const answers = Object.entries(gradingData.answers).map(
        ([answerId, data]) => ({
          answer_id: answerId,
          points_earned: data.pointsEarned,
          feedback: data.feedback,
          is_flagged: data.isFlagged,
        })
      );

      await gradeSubmission({
        url: `/submissions/${id}/grade/`,
        method: 'post',
        values: {
          answers,
          feedback: gradingData.generalFeedback,
          return: gradingData.returnForRevision,
        },
      });

      toast({
        title: 'Submission graded successfully',
        description: 'The submission has been graded and saved.',
      });

      goBack();
    } catch (error) {
      toast({
        title: 'Error grading submission',
        description: 'There was an error while grading the submission.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <p className='text-sm font-medium text-gray-700 mb-2'>Available Options:</p>
              <div className='space-y-1'>
                {answer.questionOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center space-x-2 p-2 rounded-md border ${
                      answer.selectedOptions.includes(option.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      answer.selectedOptions.includes(option.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answer.selectedOptions.includes(option.id) && (
                        <div className='w-2 h-2 bg-white rounded-full' />
                      )}
                    </div>
                    <span className={`text-sm ${
                      answer.selectedOptions.includes(option.id)
                        ? 'text-blue-900 font-medium'
                        : 'text-gray-600'
                    }`}>
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
            
            {/* Selected Options Summary */}
            <div className='bg-blue-50 p-3 rounded-md border border-blue-200'>
              <p className='text-sm font-medium text-blue-900'>
                Student Selected:{' '}
                {answer.selectedOptions.length > 0
                  ? answer.selectedOptions.map((selectedOption) => {
                    const option = answer.questionOptions.find((o) => o.id === selectedOption);
                    return option?.text;
                  }).join(', ')
                  : 'None'}
              </p>
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

  if (isError || !submission?.data) {
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

  const submissionData = submission.data;
  const totalPossiblePoints = submissionData.answers.reduce(
    (sum, answer) => sum + answer.maxPoints,
    0
  );
  const currentTotalPoints = Object.values(gradingData.answers).reduce(
    (sum, data) => sum + data.pointsEarned,
    0
  );

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <div className='flex items-center space-x-2'>
            {getResourceIcon('submissions')}
            <h1 className='text-2xl font-bold'>Grade Submission</h1>
          </div>
        </div>
        <Button onClick={handleSubmitGrade} disabled={isSubmitting}>
          <Save className='h-4 w-4 mr-2' />
          {isSubmitting ? 'Saving...' : 'Save Grade'}
        </Button>
      </div>

      {/* Submission Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>Submission Overview</span>
            <Badge className={getStatusColor(submissionData.status)}>
              {getStatusText(submissionData.status)}
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
        </CardContent>
      </Card>

      {/* Grading Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Grading Summary</CardTitle>
          <CardDescription>
            Current score: {currentTotalPoints} / {totalPossiblePoints} points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <Label htmlFor='return-revision'>Return for revision</Label>
              <Switch
                id='return-revision'
                checked={gradingData.returnForRevision}
                onCheckedChange={handleReturnForRevisionChange}
              />
            </div>
          </div>

          <div className='mt-4'>
            <Label htmlFor='general-feedback'>General Feedback</Label>
            <Textarea
              id='general-feedback'
              placeholder='Provide general feedback for the entire submission...'
              value={gradingData.generalFeedback}
              onChange={e => handleGeneralFeedbackChange(e.target.value)}
              className='mt-2'
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Answers */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Grade Individual Answers</h2>
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

              {/* Grading Section */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor={`points-${answer.id}`}>
                    Points Earned (Max: {answer.maxPoints})
                  </Label>
                  <Input
                    id={`points-${answer.id}`}
                    type='number'
                    min='0'
                    max={answer.maxPoints}
                    step='0.1'
                    value={gradingData.answers[answer.id]?.pointsEarned || 0}
                    onChange={e =>
                      handleAnswerGradeChange(
                        answer.id.toString(),
                        'pointsEarned',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className='mt-1'
                  />
                </div>
                <div className='flex items-center space-x-2 mt-8'>
                  <Switch
                    id={`flag-${answer.id}`}
                    checked={gradingData.answers[answer.id]?.isFlagged || false}
                    onCheckedChange={checked =>
                      handleAnswerGradeChange(
                        answer.id.toString(),
                        'isFlagged',
                        checked
                      )
                    }
                  />
                  <Label htmlFor={`flag-${answer.id}`}>Flag for review</Label>
                </div>
              </div>

              <div>
                <Label htmlFor={`feedback-${answer.id}`}>
                  <MessageSquare className='h-4 w-4 inline mr-1' />
                  Feedback for this answer
                </Label>
                <Textarea
                  id={`feedback-${answer.id}`}
                  placeholder='Provide specific feedback for this answer...'
                  value={gradingData.answers[answer.id]?.feedback || ''}
                  onChange={e =>
                    handleAnswerGradeChange(
                      answer.id.toString(),
                      'feedback',
                      e.target.value
                    )
                  }
                  className='mt-1'
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
