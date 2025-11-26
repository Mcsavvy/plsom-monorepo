"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/tests";
import { SubmissionDetail, questionTypeInfo } from "@/types/tests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Flag,
  Trophy,
  User,
  Calendar,
  Timer,
  Target,
  BookOpen,
  AlertCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import { toastError } from "@/lib/utils";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = parseInt(params.id as string);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSubmissionDetail } = useTests();

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError(null);
        const submissionData = await getSubmissionDetail(submissionId);
        setSubmission(submissionData);
      } catch (err) {
        toastError(err, "Failed to load submission");
        setError("Failed to load submission details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (submissionId && !isNaN(submissionId)) {
      fetchSubmission();
    } else {
      setError("Invalid submission ID");
      setLoading(false);
    }
  }, [submissionId, getSubmissionDetail]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !submission) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Submission not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Not recorded";

    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusInfo = () => {
    switch (submission.status) {
      case "in_progress":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          text: "In Progress",
        };
      case "submitted":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: CheckCircle,
          text: "Submitted",
        };
      case "graded":
        return {
          color: "bg-green-100 text-green-800",
          icon: Trophy,
          text: "Graded",
        };
      case "returned":
        return {
          color: "bg-orange-100 text-orange-800",
          icon: AlertCircle,
          text: "Returned for Revision",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          text: "Unknown",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const answeredQuestions = submission.answers.filter(
    answer => answer.has_answer
  );

  return (
    <div className="container mx-auto space-y-6 p-4 pt-8">
      {/* Submission Overview */}
      <Card className="overflow-hidden pt-0">
        <div className="relative flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="px-6 text-center">
            <h1 className="text-center text-xl font-bold text-white md:text-2xl">
              {submission.test_title}
            </h1>
            <p className="mt-2 text-sm text-blue-100 md:text-base">
              Submission #{submission.id} - Attempt {submission.attempt_number}
            </p>
          </div>
          <div className="absolute top-4 right-4">
            <Badge
              variant="outline"
              className={`${statusInfo.color} border-white text-xs md:text-sm`}
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <User className="text-primary h-4 w-4 flex-shrink-0" />
              <span className="truncate">{submission.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="text-primary h-4 w-4 flex-shrink-0" />
              <span>
                {answeredQuestions.length} / {submission.answers.length}{" "}
                answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="text-primary h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {formatDuration(submission.time_spent_minutes)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary h-4 w-4 flex-shrink-0" />
              <span>
                {submission.completion_percentage.toFixed(0)}% complete
              </span>
            </div>
          </div>

          {submission.score !== null && submission.max_score !== null && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="font-medium text-green-800">Score</span>
                </div>
                <div className="text-xl font-bold text-green-600 md:text-2xl">
                  {submission.score} / {submission.max_score}
                </div>
              </div>
              {submission.graded_by_name && (
                <p className="mt-2 text-sm text-green-700">
                  Graded by {submission.graded_by_name}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 text-sm">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-blue-500"></div>
              <div className="min-w-0 flex-1">
                <span className="font-medium">Started:</span>
                <span className="text-muted-foreground ml-2 break-words">
                  {formatDateTime(submission.started_at)}
                </span>
              </div>
            </div>

            {submission.submitted_at && (
              <div className="flex items-start gap-4 text-sm">
                <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Submitted:</span>
                  <span className="text-muted-foreground ml-2 break-words">
                    {formatDateTime(submission.submitted_at)}
                  </span>
                </div>
              </div>
            )}

            {submission.graded_at && (
              <div className="flex items-start gap-4 text-sm">
                <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-purple-500"></div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Graded:</span>
                  <span className="text-muted-foreground ml-2 break-words">
                    {formatDateTime(submission.graded_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* General Feedback */}
      {submission.feedback && (
        <Card>
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-lg md:text-xl">
              General Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
              <p className="break-words text-blue-800">{submission.feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Answers */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-5 w-5" />
            Your Answers ({answeredQuestions.length} of{" "}
            {submission.answers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            {submission.answers.map((answer, index) => {
              const typeInfo =
                questionTypeInfo[
                  answer.question_type as keyof typeof questionTypeInfo
                ];

              return (
                <div key={answer.id} className="rounded-lg border p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    {/* Question Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                          <span className="text-primary text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {typeInfo?.label || answer.question_type}
                            </Badge>
                            {answer.is_flagged && (
                              <Badge
                                variant="outline"
                                className="text-xs text-orange-600"
                              >
                                <Flag className="mr-1 h-3 w-3" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-medium break-words md:text-base">
                            {answer.question_title}
                          </h4>
                        </div>
                      </div>

                      {/* Score */}
                      {answer.points_earned !== null &&
                        answer.max_points !== null && (
                          <div className="flex-shrink-0 text-right">
                            <div className="text-lg font-semibold text-green-600 md:text-xl">
                              {answer.points_earned} / {answer.max_points}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              points
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Answer Content */}
                    <div className="ml-0 space-y-3 sm:ml-11">
                      {answer.has_answer ? (
                        <div className="space-y-3">
                          {/* Display Answer */}
                          <div className="rounded-lg bg-gray-50 p-3 md:p-4">
                            {answer.file_answer ? (
                              <div className="flex items-center gap-2">
                                <FileText className="text-primary h-4 w-4 flex-shrink-0" />
                                <a
                                  href={answer.file_answer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary flex items-center gap-1 break-all hover:underline"
                                >
                                  View uploaded file
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              </div>
                            ) : answer.question_type === "single_choice" ||
                              answer.question_type === "multiple_choice" ? (
                              <div className="space-y-3">
                                {/* Available Options */}
                                <div>
                                  <p className="mb-2 text-sm font-medium text-gray-700">
                                    Available Options:
                                  </p>
                                  <div className="space-y-1">
                                    {answer.question_options?.map(option => (
                                      <div
                                        key={option.id}
                                        className={`flex items-center space-x-2 rounded-md border p-2 ${
                                          answer.selected_options?.includes(
                                            option.id
                                          )
                                            ? "border-blue-200 bg-blue-50"
                                            : "border-gray-200 bg-gray-50"
                                        }`}
                                      >
                                        <div
                                          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                            answer.selected_options?.includes(
                                              option.id
                                            )
                                              ? "border-blue-500 bg-blue-500"
                                              : "border-gray-300"
                                          }`}
                                        >
                                          {answer.selected_options?.includes(
                                            option.id
                                          ) && (
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                          )}
                                        </div>
                                        <span
                                          className={`text-sm ${
                                            answer.selected_options?.includes(
                                              option.id
                                            )
                                              ? "font-medium text-blue-900"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {option.text}
                                        </span>
                                        {option.is_correct && (
                                          <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                                            Correct
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm break-words whitespace-pre-wrap md:text-base">
                                {answer.display_answer}
                              </p>
                            )}
                          </div>

                          {/* Individual Feedback */}
                          {answer.feedback && (
                            <div className="bg-primary/10 border-primary border-l-4 p-3 md:p-4">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-800">
                                  Feedback:
                                </span>
                              </div>
                              <p className="text-sm break-words text-blue-700 md:text-base">
                                {answer.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground rounded-lg bg-gray-50 p-3 italic md:p-4">
                          No answer provided
                        </div>
                      )}

                      <div className="text-muted-foreground text-xs">
                        {answer.answered_at
                          ? `Answered: ${formatDateTime(answer.answered_at)}`
                          : "Not answered"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
