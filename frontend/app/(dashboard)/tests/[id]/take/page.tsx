"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/tests";
import {
  TestDetail,
  FrontendAnswer,
  questionTypeInfo,
  Submission,
} from "@/types/tests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Timer,
  Flag,
} from "lucide-react";
import { toastError, toastSuccess } from "@/lib/utils";
import QuestionComponent from "@/components/tests/answers";

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = parseInt(params.id as string);
  const [test, setTest] = useState<TestDetail | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, FrontendAnswer>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0); // Track time spent in minutes
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);
  const {
    getTestDetailsForUI,
    createSubmission,
    getSubmissionDetail,
    loadSubmissionAnswers,
    saveAnswers,
    uploadFile,
    deleteDocument,
    submitTest,
  } = useTests();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const testData = await getTestDetailsForUI(testId);
        setTest(testData);

        // Initialize or get existing submission
        let currentSubmission = testData.my_submission;
        if (!currentSubmission) {
          // Create new submission if none exists
          try {
            currentSubmission = await createSubmission(testId);
            toastSuccess("Test started successfully");
          } catch (submissionError) {
            toastError(submissionError, "Failed to start test");
            setError("Failed to start test. Please try again.");
            return;
          }
        }

        setSubmission(currentSubmission);

        // Load existing answers if submission has answers
        if (currentSubmission.status === "in_progress") {
          try {
            const existingAnswers = await loadSubmissionAnswers(
              currentSubmission.id
            );
            setAnswers(existingAnswers);

            // Load flagged questions from submission detail
            const submissionDetail = await getSubmissionDetail(
              currentSubmission.id
            );
            const flaggedQuestionIds = submissionDetail.answers
              .filter(answer => answer.is_flagged)
              .map(answer => answer.question);
            setFlaggedQuestions(new Set(flaggedQuestionIds));

            console.log("Loaded existing answers and flagged questions");
          } catch (answerError) {
            console.warn("Failed to load existing answers:", answerError);
            // Continue without answers - user can still take the test
          }
        }

        // Initialize time remaining if test has time limit
        if (testData.time_limit_minutes !== null) {
          // Calculate time remaining based on submission start time
          const startTime = new Date(currentSubmission.started_at);
          const now = new Date();
          const elapsedMinutes = Math.floor(
            (now.getTime() - startTime.getTime()) / (1000 * 60)
          );
          const remainingMinutes = Math.max(
            0,
            testData.time_limit_minutes - elapsedMinutes
          );
          setTimeRemaining(remainingMinutes * 60); // Convert to seconds
          setTimeSpent(elapsedMinutes);
        } else {
          setTimeRemaining(null); // No time limit
          // Still track time spent for analytics
          const startTime = new Date(currentSubmission.started_at);
          const now = new Date();
          const elapsedMinutes = Math.floor(
            (now.getTime() - startTime.getTime()) / (1000 * 60)
          );
          setTimeSpent(elapsedMinutes);
        }
      } catch (err) {
        toastError(err, "Failed to load test");
        setError("Failed to load test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (testId && !isNaN(testId)) {
      fetchTest();
    } else {
      setError("Invalid test ID");
      setLoading(false);
    }
  }, [
    testId,
    getTestDetailsForUI,
    createSubmission,
    getSubmissionDetail,
    loadSubmissionAnswers,
  ]);

  // Timer effect - only run if test has time limit
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto submit
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });

      // Update time spent every minute
      setTimeSpent(prev => prev + 1 / 60); // Add 1 second as fraction of minute
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-save effect - save answers every 30 seconds
  useEffect(() => {
    if (!submission || Object.keys(answers).length === 0) return;

    const autoSaveTimer = setInterval(() => {
      handleSaveTest();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [answers, submission]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: FrontendAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    if (!submission) throw new Error("No submission available");

    try {
      const updatedSubmission = await uploadFile(
        submission.id,
        questionId,
        file
      );
      setSubmission(updatedSubmission);
      toastSuccess("File uploaded successfully");
    } catch (error) {
      toastError(error, "Failed to upload file");
    }
  };

  const handleFileDelete = async (questionId: string) => {
    if (!submission) throw new Error("No submission available");

    try {
      const updatedSubmission = await deleteDocument(submission.id, questionId);
      setSubmission(updatedSubmission);

      // Also remove the file from local answers state
      setAnswers(prevAnswers => {
        const updatedAnswers = { ...prevAnswers };
        if (updatedAnswers[questionId]) {
          updatedAnswers[questionId] = {
            ...updatedAnswers[questionId],
            file_answer: undefined,
            file_url: undefined,
          };
        }
        return updatedAnswers;
      });

      toastSuccess("File deleted successfully");
    } catch (error) {
      toastError(error, "Failed to delete file");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleFlagQuestion = () => {
    if (!test) return;
    const questionId = test.questions[currentQuestionIndex].id;
    const newFlagged = new Set(flaggedQuestions);

    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }

    setFlaggedQuestions(newFlagged);
  };

  const handleSaveTest = async () => {
    if (!submission || saving) return;

    try {
      setSaving(true);
      await saveAnswers(submission.id, answers);
      toastSuccess("Test saved successfully");
    } catch (error) {
      toastError(error, "Failed to save test");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!submission) return;

    try {
      setSaving(true);
      await submitTest(submission.id, answers);
      toastSuccess("Test submitted successfully");
      router.push(`/tests/${testId}`);
    } catch (error) {
      toastError(error, "Failed to submit test");
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !test) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Test not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="container mx-auto p-4">
          {/* Mobile Layout */}
          <div className="space-y-3 md:hidden">
            <div className="flex items-center justify-between">
              <h1 className="mr-2 flex-1 truncate text-sm font-semibold">
                {test.title}
              </h1>
              {timeRemaining !== null && (
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span
                    className={`font-mono text-xs ${timeRemaining < 300 ? "text-red-600" : ""}`}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Q {currentQuestionIndex + 1}/{test.questions.length}
              </Badge>
              <div className="text-muted-foreground text-xs">
                {answeredQuestions}/{test.questions.length} answered
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden items-center justify-between md:flex">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold">{test.title}</h1>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span
                    className={`font-mono ${timeRemaining < 300 ? "text-red-600" : ""}`}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              <div className="text-muted-foreground text-sm">
                {answeredQuestions} / {test.questions.length} answered
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-muted mt-3 h-2 w-full rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-3 sm:p-4">
        <div className="grid gap-4 md:grid-cols-4 md:gap-6">
          {/* Question Navigation Sidebar */}
          <div className="order-2 md:order-1 md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-1">
                  {test.questions.map((q, index) => (
                    <Button
                      key={q.id}
                      variant={
                        index === currentQuestionIndex ? "default" : "outline"
                      }
                      size="sm"
                      className={`relative h-8 w-8 p-0 md:h-9 md:w-full md:px-3 ${answers[q.id] ? "ring-2 ring-green-200" : ""}`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      <span className="text-xs md:text-sm">{index + 1}</span>
                      {flaggedQuestions.has(q.id) && (
                        <Flag className="absolute -top-0.5 -right-0.5 h-2 w-2 text-red-500 md:-top-1 md:-right-1 md:h-3 md:w-3" />
                      )}
                      {answers[q.id] && (
                        <CheckCircle className="absolute -right-0.5 -bottom-0.5 h-2 w-2 text-green-600 md:-right-1 md:-bottom-1 md:h-3 md:w-3" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="order-1 space-y-4 md:order-2 md:col-span-3 md:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {questionTypeInfo[currentQuestion.question_type].label}
                      </Badge>
                      {currentQuestion.is_required && (
                        <Badge
                          variant="outline"
                          className="text-xs text-red-600"
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight md:text-xl">
                      {currentQuestion.title}
                    </CardTitle>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFlagQuestion}
                    className={`h-8 w-8 flex-shrink-0 p-0 ${flaggedQuestions.has(currentQuestion.id) ? "bg-red-50" : ""}`}
                  >
                    <Flag
                      className={`h-3 w-3 md:h-4 md:w-4 ${flaggedQuestions.has(currentQuestion.id) ? "text-red-500" : ""}`}
                    />
                  </Button>
                </div>

                {currentQuestion.description && (
                  <p className="text-muted-foreground mt-3 text-sm md:text-base">
                    {currentQuestion.description}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <QuestionComponent
                  question={currentQuestion}
                  answer={currentAnswer}
                  onAnswerChange={answer =>
                    handleAnswerChange(currentQuestion.id, answer)
                  }
                  onFileUpload={handleFileUpload}
                  onFileDelete={handleFileDelete}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <div className="order-1 flex flex-col items-stretch gap-2 sm:order-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  onClick={handleSaveTest}
                  disabled={saving}
                  className="text-xs sm:text-sm"
                >
                  <Save className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="">
                    {saving ? "Saving..." : "Save Progress"}
                  </span>
                </Button>

                {currentQuestionIndex === test.questions.length - 1 && (
                  <Button onClick={handleSubmitTest} disabled={saving}>
                    <Send className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="">
                      {saving ? "Submitting..." : "Submit Test"}
                    </span>
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={saving || currentQuestionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="">Prev</span>
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={
                    saving || currentQuestionIndex === test.questions.length - 1
                  }
                >
                  <span className="">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
