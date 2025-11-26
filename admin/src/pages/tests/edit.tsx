import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdate, useOne, useNavigation, useList } from '@refinedev/core';
import { useParams } from 'react-router';
import {
  Plus,
  Trash2,
  FileText,
  Settings,
  GripVertical,
  Calendar,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AxiosError } from 'axios';
import { Course } from '@/types/course';
import {
  QUESTION_TYPES,
  TestFormData,
  TestDetail,
  TestDetailResponse,
} from '@/types/test';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { transformTestDetail } from '@/utils/dataTransformers';
import { addDays, format } from 'date-fns';
import { DateTimeInput } from '@/components/ui/datetime-input';

const TODAY = format(new Date(), 'yyyy-MM-ddTHH:mm');
const NEXT_WEEKEND = format(addDays(new Date(), 7), 'yyyy-MM-ddTHH:mm');

const questionSchema = z.object({
  id: z.string(),
  question_type: z.enum([
    'text',
    'essay',
    'yes_no',
    'single_choice',
    'multiple_choice',
    'scripture_reference',
    'document_upload',
    'reflection',
    'ministry_plan',
    'theological_position',
    'case_study',
    'sermon_outline',
  ]),
  title: z.string().min(1, 'Question title is required').max(500),
  description: z.string().optional(),
  is_required: z.boolean(),
  min_word_count: z.number().min(0).optional(),
  max_word_count: z.number().min(0).optional(),
  text_max_length: z.number().min(0).optional(),
  text_placeholder: z.string().optional(),
  max_file_size_mb: z.number().min(1).max(100).optional(),
  allowed_file_types: z.string().optional(),
  required_translation: z.string().optional(),
  allow_multiple_verses: z.boolean().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1, 'Option text is required'),
        is_correct: z.boolean(),
      })
    )
    .optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  instructions: z.string().optional(),
  course: z.number().min(1, 'Course is required'),
  cohort: z.number().min(1, 'Cohort is required'),
  time_limit_minutes: z.number().min(1).optional(),
  max_attempts: z.number().min(1).max(10),
  allow_review_after_submission: z.boolean(),
  randomize_questions: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  available_from: z.string().optional(),
  available_from_timezone: z.string().optional(),
  available_until: z.string().optional(),
  available_until_timezone: z.string().optional(),
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required'),
});

type FormData = z.infer<typeof formSchema>;

export const TestsEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const { list } = useNavigation();
  const { mutate: updateTest } = useUpdate();

  const {
    result: testData,
    query: { isLoading },
  } = useOne<TestDetail>({
    resource: 'tests',
    id: id,
    meta: {
      transform: (data: TestDetailResponse) => transformTestDetail(data),
    },
  });

  // Fetch courses
  const { result: coursesData } = useList<Course>({
    resource: 'courses',
    pagination: { mode: 'off' },
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
    meta: { transform: true },
  });

  // Fetch cohorts
  const { result: cohortsData } = useList({
    resource: 'cohorts',
    pagination: { mode: 'off' },
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
  });

  const test = testData;
  const courses = coursesData?.data || [];
  const cohorts = cohortsData?.data || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      max_attempts: 1,
      allow_review_after_submission: true,
      randomize_questions: false,
      status: 'draft',
      available_from: TODAY,
      available_until: NEXT_WEEKEND,
      questions: [],
    },
  });

  const {
    fields: questions,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  useEffect(() => {
    if (test) {
      const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().slice(0, 16);
      };

      form.reset({
        title: test.title,
        description: test.description,
        instructions: test.instructions || '',
        course: test.course,
        cohort: test.cohort,
        time_limit_minutes: test.timeLimitMinutes || undefined,
        max_attempts: test.maxAttempts,
        allow_review_after_submission: test.allowReviewAfterSubmission,
        randomize_questions: test.randomizeQuestions,
        status: test.status,
        available_from: formatDateTime(test.availableFrom),
        available_until: formatDateTime(test.availableUntil),
        questions: test.questions.map(q => ({
          id: q.id,
          question_type: q.questionType,
          title: q.title,
          description: q.description || '',
          is_required: q.isRequired,
          min_word_count: q.minWordCount || undefined,
          max_word_count: q.maxWordCount || undefined,
          text_max_length: q.textMaxLength || undefined,
          text_placeholder: q.textPlaceholder || '',
          max_file_size_mb: q.maxFileSizeMb || undefined,
          allowed_file_types: q.allowedFileTypes || '',
          required_translation: q.requiredTranslation || '',
          allow_multiple_verses: q.allowMultipleVerses || false,
          options: q.options.map(o => ({
            id: o.id,
            text: o.text,
            is_correct: o.isCorrect,
          })),
        })),
      });
    }
  }, [test, form]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: TestFormData = {
        ...data,
        instructions: data.instructions || '',
        available_from: data.available_from || undefined,
        available_from_timezone: data.available_from_timezone,
        available_until: data.available_until || undefined,
        available_until_timezone: data.available_until_timezone,
        questions: data.questions.map(q => ({
          ...q,
          description: q.description || '',
          options:
            q.options?.map(o => ({
              ...o,
              id: o.id || undefined,
            })) || [],
        })),
      };

      updateTest(
        {
          resource: 'tests',
          id: parseInt(id),
          values: payload,
        },
        {
          onSuccess: () => {
            list('tests');
          },
          onError: (error: unknown) => {
            console.error('Update test error:', error);
            setError(
              (error as AxiosError<{ message: string }>)?.response?.data
                ?.message ||
                (error as AxiosError<{ message: string }>)?.message ||
                'Failed to update test'
            );
          },
        }
      );
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    appendQuestion({
      id: crypto.randomUUID(),
      question_type: 'text',
      title: '',
      description: '',
      is_required: true,
    });
  };

  const addOption = (questionIndex: number) => {
    const currentOptions =
      form.getValues(`questions.${questionIndex}.options`) || [];
    form.setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { id: crypto.randomUUID(), text: '', is_correct: false },
    ]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions =
      form.getValues(`questions.${questionIndex}.options`) || [];
    const newOptions = currentOptions.filter(
      (_, index) => index !== optionIndex
    );
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  const getQuestionTypeInfo = (type: string) => {
    return QUESTION_TYPES.find(qt => qt.value === type);
  };

  // Detect validation errors in each tab
  const tabErrors = useMemo(() => {
    const errors = form.formState.errors;

    const basicFields = [
      'title',
      'description',
      'instructions',
      'course',
      'cohort',
      'status',
    ];
    const settingsFields = [
      'time_limit_minutes',
      'max_attempts',
      'allow_review_after_submission',
      'randomize_questions',
      'available_from',
      'available_until',
    ];
    const questionsFields = ['questions'];

    return {
      basic: basicFields.some(field => errors[field as keyof typeof errors]),
      settings: settingsFields.some(
        field => errors[field as keyof typeof errors]
      ),
      questions:
        questionsFields.some(field => errors[field as keyof typeof errors]) ||
        (Array.isArray(errors.questions) && errors.questions.some(q => q)), // Check for any question errors
    };
  }, [form.formState.errors]);

  // Handle form submission with error detection
  const handleSubmit = form.handleSubmit(onSubmit, errors => {
    // Find the first tab with errors and switch to it
    void errors;
    if (tabErrors.basic) {
      setActiveTab('basic');
    } else if (tabErrors.settings) {
      setActiveTab('settings');
    } else if (tabErrors.questions) {
      setActiveTab('questions');
    }
  });

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
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('tests')}
          Edit Test
        </h1>
        <p className='text-muted-foreground'>Update {test.title}</p>
      </div>

      {test.hasSubmissions && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Important:</strong> This test has existing submissions.
            Changes to questions may affect previous answers. Use caution when
            modifying question types or options.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <div className='space-y-6 relative h-full'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='basic' className='relative'>
                Basic Info
                {tabErrors.basic && (
                  <span className='absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full' />
                )}
              </TabsTrigger>
              <TabsTrigger value='settings' className='relative'>
                Settings
                {tabErrors.settings && (
                  <span className='absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full' />
                )}
              </TabsTrigger>
              <TabsTrigger value='questions' className='relative'>
                Questions
                {tabErrors.questions && (
                  <span className='absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full' />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='basic' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Test Information
                  </CardTitle>
                  <CardDescription>
                    Basic information about the test
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='title'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Title</FormLabel>
                          <FormControl>
                            <Input placeholder='Enter test title' {...field} />
                          </FormControl>
                          <FormDescription>
                            A clear, descriptive title for the test
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='status'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select status' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='draft'>Draft</SelectItem>
                              <SelectItem value='published'>
                                Published
                              </SelectItem>
                              <SelectItem value='archived'>Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Draft tests can be edited freely, published tests
                            are available to students
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder='Enter test description'
                            className='flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A detailed description of what this test covers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='instructions'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions (Optional)</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder='Enter instructions for students taking the test'
                            className='flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Specific instructions that will be shown to students
                          before they start
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='course'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select
                            onValueChange={value =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select course' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map(course => (
                                <SelectItem
                                  key={course.id}
                                  value={course.id.toString()}
                                >
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='cohort'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cohort</FormLabel>
                          <Select
                            onValueChange={value =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select cohort' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cohorts.map(cohort => (
                                <SelectItem
                                  key={cohort.id}
                                  value={cohort.id!.toString()}
                                >
                                  {cohort.name} ({cohort.program_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='settings' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Settings className='h-5 w-5' />
                    Test Settings
                  </CardTitle>
                  <CardDescription>
                    Configure test behavior and constraints
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='time_limit_minutes'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (Minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='No time limit'
                              {...field}
                              value={field.value || ''}
                              onChange={e =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for no time limit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='max_attempts'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Attempts</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='1'
                              max='10'
                              {...field}
                              onChange={e =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            How many times can a student take this test (1-10)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='allow_review_after_submission'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                          <div className='space-y-0.5'>
                            <FormLabel className='text-base'>
                              Allow Review After Submission
                            </FormLabel>
                            <FormDescription>
                              Students can review their answers after submitting
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='randomize_questions'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                          <div className='space-y-0.5'>
                            <FormLabel className='text-base'>
                              Randomize Questions
                            </FormLabel>
                            <FormDescription>
                              Questions appear in random order for each student
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='h-5 w-5' />
                    Availability Window
                  </CardTitle>
                  <CardDescription>
                    When the test is available to students (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='available_from'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available From</FormLabel>
                          <FormControl>
                            <DateTimeInput
                              value={field.value}
                              onChange={(value, timezone) => {
                                field.onChange(value);
                                form.setValue(
                                  'available_from_timezone',
                                  timezone
                                );
                              }}
                              timezone={form.watch('available_from_timezone')}
                              onTimezoneChange={timezone => {
                                form.setValue(
                                  'available_from_timezone',
                                  timezone
                                );
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            When the test becomes available
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='available_until'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Until</FormLabel>
                          <FormControl>
                            <DateTimeInput
                              value={field.value}
                              onChange={(value, timezone) => {
                                field.onChange(value);
                                form.setValue(
                                  'available_until_timezone',
                                  timezone
                                );
                              }}
                              timezone={form.watch('available_until_timezone')}
                              onTimezoneChange={timezone => {
                                form.setValue(
                                  'available_until_timezone',
                                  timezone
                                );
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            When the test is no longer available
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='questions' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <span className='flex items-center gap-2'>
                      <FileText className='h-5 w-5' />
                      Questions ({questions.length})
                    </span>
                    <Button type='button' onClick={addQuestion} size='sm'>
                      <Plus className='h-4 w-4 mr-2' />
                      Add Question
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {questions.map((question, questionIndex) => {
                    const questionType = form.watch(
                      `questions.${questionIndex}.question_type`
                    );
                    const typeInfo = getQuestionTypeInfo(questionType);

                    return (
                      <div
                        key={question.id}
                        className='border rounded-lg p-6 space-y-4'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <GripVertical className='h-4 w-4 text-muted-foreground' />
                            <Badge variant='outline'>
                              Question {questionIndex + 1}
                            </Badge>
                            <Badge variant='outline' className='text-xs'>
                              {typeInfo?.label}
                            </Badge>
                          </div>
                          {questions.length > 1 && (
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeQuestion(questionIndex)}
                              className='text-red-600 hover:text-red-700'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <FormField
                            control={form.control}
                            name={`questions.${questionIndex}.question_type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {QUESTION_TYPES.map(type => (
                                      <SelectItem
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`questions.${questionIndex}.is_required`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Required Question</FormLabel>
                                <div className='flex items-center justify-between pt-2'>
                                  <p className='text-sm text-muted-foreground'>
                                    Is this a compulsory question?
                                  </p>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Enter your question'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <textarea
                                  placeholder='Additional context or instructions'
                                  className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Question type specific fields */}
                        {typeInfo?.hasWordCount && (
                          <div className='grid grid-cols-2 gap-4'>
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.min_word_count`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Min Word Count</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      placeholder='Optional'
                                      {...field}
                                      value={field.value || ''}
                                      onChange={e =>
                                        field.onChange(
                                          e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.max_word_count`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Word Count</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      placeholder='Optional'
                                      {...field}
                                      value={field.value || ''}
                                      onChange={e =>
                                        field.onChange(
                                          e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        {typeInfo?.hasOptions && (
                          <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                              <FormLabel>Answer Options</FormLabel>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => addOption(questionIndex)}
                              >
                                <Plus className='h-4 w-4 mr-2' />
                                Add Option
                              </Button>
                            </div>

                            {form
                              .watch(`questions.${questionIndex}.options`)
                              ?.map((option, optionIndex) => (
                                <div
                                  key={`${questionIndex}-${optionIndex}`}
                                  className='flex items-start gap-3 p-3 border rounded'
                                >
                                  <FormField
                                    control={form.control}
                                    name={`questions.${questionIndex}.options.${optionIndex}.is_correct`}
                                    render={({ field }) => (
                                      <FormItem className='flex items-center space-x-2'>
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                        <FormLabel className='text-sm font-normal'>
                                          Correct
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`questions.${questionIndex}.options.${optionIndex}.text`}
                                    render={({ field }) => (
                                      <FormItem className='flex-1'>
                                        <FormControl>
                                          <Input
                                            placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      removeOption(questionIndex, optionIndex)
                                    }
                                    className='text-red-600 hover:text-red-700'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              ))}

                            {(!form.watch(
                              `questions.${questionIndex}.options`
                            ) ||
                              form.watch(`questions.${questionIndex}.options`)
                                ?.length === 0) && (
                              <div className='text-center py-4 text-muted-foreground text-sm'>
                                No options added. Click "Add Option" to create
                                answer choices.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {questions.length === 0 && (
                    <div className='text-center py-8'>
                      <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>
                        No questions added yet
                      </p>
                      <Button
                        type='button'
                        onClick={addQuestion}
                        className='mt-4'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Add Your First Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Save Button */}
        <div className='sticky bottom-0 bg-background p-4 mt-6'>
          <Card className='border-none shadow-none'>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <Button
                  type='button'
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  {isSubmitting ? 'Updating...' : 'Update Test'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => list('tests')}
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
};
