"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/tests";
import { SubmissionDetail, questionTypeInfo } from "@/types/tests";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="container mx-auto p-4 space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
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
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusInfo = () => {
    switch (submission.status) {
      case "in_progress":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          text: "In Progress"
        };
      case "submitted":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: CheckCircle,
          text: "Submitted"
        };
      case "graded":
        return {
          color: "bg-green-100 text-green-800",
          icon: Trophy,
          text: "Graded"
        };
      case "returned":
        return {
          color: "bg-orange-100 text-orange-800",
          icon: AlertCircle,
          text: "Returned for Revision"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          text: "Unknown"
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const answeredQuestions = submission.answers.filter(answer => answer.has_answer);

  return (
    <div className="container mx-auto p-4 pt-8 space-y-6">
      {/* Submission Overview */}
      <Card className="overflow-hidden pt-0">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center relative rounded-t-xl">
          <div className="text-center px-6">
            <h1 className="text-xl md:text-2xl font-bold text-white text-center">
              {submission.test_title}
            </h1>
            <p className="text-blue-100 mt-2 text-sm md:text-base">
              Submission #{submission.id} - Attempt {submission.attempt_number}
            </p>
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className={`${statusInfo.color} border-white text-xs md:text-sm`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{submission.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{answeredQuestions.length} / {submission.answers.length} answered</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{formatDuration(submission.time_spent_minutes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{submission.completion_percentage.toFixed(0)}% complete</span>
            </div>
          </div>

          {submission.score !== null && submission.max_score !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-800">Score</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {submission.score} / {submission.max_score}
                </div>
              </div>
              {submission.graded_by_name && (
                <p className="text-sm text-green-700 mt-2">
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
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
              <div className="min-w-0 flex-1">
                <span className="font-medium">Started:</span>
                <span className="ml-2 text-muted-foreground break-words">
                  {formatDateTime(submission.started_at)}
                </span>
              </div>
            </div>
            
            {submission.submitted_at && (
              <div className="flex items-start gap-4 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Submitted:</span>
                  <span className="ml-2 text-muted-foreground break-words">
                    {formatDateTime(submission.submitted_at)}
                  </span>
                </div>
              </div>
            )}
            
            {submission.graded_at && (
              <div className="flex items-start gap-4 text-sm">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Graded:</span>
                  <span className="ml-2 text-muted-foreground break-words">
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
            <CardTitle className="text-lg md:text-xl">General Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-blue-800 break-words">{submission.feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Answers */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-5 w-5" />
            Your Answers ({answeredQuestions.length} of {submission.answers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            {submission.answers.map((answer, index) => {
              const typeInfo = questionTypeInfo[answer.question_type as keyof typeof questionTypeInfo];
              
              return (
                <div key={answer.id} className="border rounded-lg p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    {/* Question Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">{index + 1}</span>
                        </div>
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {typeInfo?.label || answer.question_type}
                            </Badge>
                            {answer.is_flagged && (
                              <Badge variant="outline" className="text-xs text-orange-600">
                                <Flag className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm md:text-base break-words">{answer.question_title}</h4>
                        </div>
                      </div>
                      
                      {/* Score */}
                      {answer.points_earned !== null && answer.max_points !== null && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg md:text-xl font-semibold text-green-600">
                            {answer.points_earned} / {answer.max_points}
                          </div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="ml-0 sm:ml-11 space-y-3">
                      {answer.has_answer ? (
                        <div className="space-y-3">
                          {/* Display Answer */}
                          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                            {answer.file_answer ? (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                <a
                                  href={answer.file_answer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 break-all"
                                >
                                  View uploaded file
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              </div>
                            ) : answer.question_type === 'single_choice' || answer.question_type === 'multiple_choice' ? (
                              <div className="space-y-3">
                                {/* Available Options */}
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Available Options:</p>
                                  <div className="space-y-1">
                                    {answer.question_options?.map((option) => (
                                      <div
                                        key={option.id}
                                        className={`flex items-center space-x-2 p-2 rounded-md border ${
                                          answer.selected_options?.includes(option.id)
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          answer.selected_options?.includes(option.id)
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300'
                                        }`}>
                                          {answer.selected_options?.includes(option.id) && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                          )}
                                        </div>
                                        <span className={`text-sm ${
                                          answer.selected_options?.includes(option.id)
                                            ? 'text-blue-900 font-medium'
                                            : 'text-gray-600'
                                        }`}>
                                          {option.text}
                                        </span>
                                        {option.is_correct && (
                                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            Correct
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Selected Options Summary */}
                                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                                  <p className="text-sm font-medium text-blue-900">
                                    You Selected:{' '}
                                    {answer.selected_options && answer.selected_options.length > 0
                                      ? answer.question_options
                                          ?.filter(opt => answer.selected_options?.includes(opt.id))
                                          .map(opt => opt.text)
                                          .join(', ') || 'None'
                                      : 'None'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words text-sm md:text-base">{answer.display_answer}</p>
                            )}
                          </div>
                          
                          {/* Individual Feedback */}
                          {answer.feedback && (
                            <div className="bg-primary/10 border-l-4 border-primary p-3 md:p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-blue-800">Feedback:</span>
                              </div>
                              <p className="text-sm md:text-base text-blue-700 break-words">{answer.feedback}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic bg-gray-50 rounded-lg p-3 md:p-4">
                          No answer provided
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {answer.answered_at ? (
                          `Answered: ${formatDateTime(answer.answered_at)}`
                        ) : (
                          "Not answered"
                        )}
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
