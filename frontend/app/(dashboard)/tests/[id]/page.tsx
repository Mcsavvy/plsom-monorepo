"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/tests";
import {
  TestDetail,
  formatTimeLimit,
  getStatusColor,
  getStatusText,
  questionTypeInfo,
} from "@/types/tests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  FileText,
  Clock,
  Users,
  Calendar,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  BookOpen,
  Timer,
  Target,
  Trophy,
  ArrowLeft,
  Info,
  Type,
  Square,
  Circle,
  Upload,
  Book,
  Heart,
  MapPin,
  Compass,
  List,
  ToggleLeft,
} from "lucide-react";
import { toastError } from "@/lib/utils";

// Icon mapping for question types
const questionTypeIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Type,
  FileText,
  ToggleLeft,
  Circle,
  Square,
  Book,
  Upload,
  Heart,
  MapPin,
  Compass,
  Users,
  List,
};

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = parseInt(params.id as string);
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getTestDetailsForUI } = useTests();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const testData = await getTestDetailsForUI(testId);
        setTest(testData);
      } catch (err) {
        toastError(err, "Failed to load test details.");
        setError("Failed to load test details. Please try again.");
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
  }, [testId, getTestDetailsForUI]);

  const handleStartTest = () => {
    router.push(`/tests/${testId}/take`);
  };

  const handleContinueTest = () => {
    router.push(`/tests/${testId}/take`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !test) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Test not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isAvailable = test.is_available;
  const now = new Date();
  const availableFrom = test.available_from
    ? new Date(test.available_from)
    : null;
  const availableUntil = test.available_until
    ? new Date(test.available_until)
    : null;

  // Determine test status
  let status:
    | "not_started"
    | "in_progress"
    | "submitted"
    | "graded"
    | "returned"
    | "overdue" = "not_started";
  if (test.my_submission) {
    switch (test.my_submission.status) {
      case "in_progress":
        status = "in_progress";
        break;
      case "submitted":
        status = "submitted";
        break;
      case "graded":
        status = "graded";
        break;
      case "returned":
        status = "returned";
        break;
    }
  } else if (availableUntil && now > availableUntil) {
    status = "overdue";
  }

  const getActionButton = () => {
    if (!isAvailable && status !== "graded") {
      return (
        <Button variant="outline" disabled className="flex-1">
          <XCircle className="mr-2 h-4 w-4" />
          Not Available
        </Button>
      );
    }

    switch (status) {
      case "not_started":
        return test.can_attempt ? (
          <Button onClick={handleStartTest} className="flex-1">
            <PlayCircle className="mr-2 h-4 w-4" />
            Start Test
          </Button>
        ) : (
          <Button variant="outline" disabled className="flex-1">
            <XCircle className="mr-2 h-4 w-4" />
            No Attempts Left
          </Button>
        );
      case "in_progress":
        return (
          <Button onClick={handleContinueTest} className="flex-1">
            <Timer className="mr-2 h-4 w-4" />
            Continue Test
          </Button>
        );
      case "submitted":
        return (
          <>
            {test.my_submission && (
              <Button
                variant="default"
                className="w-full"
                onClick={() =>
                  router.push(`/submissions/${test.my_submission!.id}`)
                }
              >
                Submitted - Awaiting Grade
              </Button>
            )}
          </>
        );
      case "graded":
        return (
          <div className="flex flex-1 gap-2">
            <Button variant="outline" disabled className="flex-1">
              <Trophy className="mr-2 h-4 w-4" />
              Test Completed
            </Button>
            {test.my_submission && (
              <Button
                variant="default"
                onClick={() =>
                  router.push(`/submissions/${test.my_submission!.id}`)
                }
              >
                View Results
              </Button>
            )}
          </div>
        );
      case "returned":
        return (
          <div className="flex flex-1 gap-2">
            <Button variant="outline" disabled className="flex-1">
              <AlertCircle className="mr-2 h-4 w-4" />
              Test Returned
            </Button>
            {test.my_submission && (
              <Button
                variant="default"
                onClick={() =>
                  router.push(`/submissions/${test.my_submission!.id}`)
                }
              >
                View Returned Submission
              </Button>
            )}
          </div>
        );
      case "overdue":
        return (
          <Button variant="outline" disabled className="flex-1">
            <XCircle className="mr-2 h-4 w-4" />
            Overdue
          </Button>
        );
      default:
        return null;
    }
  };

  const formatAvailabilityDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto space-y-6 p-4 pt-8">
      {/* Test Header */}
      <Card className="overflow-hidden pt-0">
        <div className="relative flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="px-6 text-center">
            <h1 className="text-center text-2xl font-bold text-white">
              {test.title}
            </h1>
          </div>
          <div className="absolute top-4 right-4">
            <Badge
              variant="outline"
              className={`${getStatusColor(status)} border-white`}
            >
              {getStatusText(status)}
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">{test.course_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{test.created_by_name}</span>
            </div>
          </div>

          <p className="text-muted-foreground">{test.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Target className="text-primary h-4 w-4" />
              <span>{test.total_questions} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>{formatTimeLimit(test.time_limit_minutes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="text-primary h-4 w-4" />
              <span>
                {test.attempts_remaining}/{test.max_attempts} attempts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-primary h-4 w-4" />
              <span>
                {test.allow_review_after_submission
                  ? "Review allowed"
                  : "No review"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Instructions & Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Instructions & Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.instructions && (
              <div>
                <h4 className="mb-2 font-medium">Instructions</h4>
                <p className="text-muted-foreground text-sm">
                  {test.instructions}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Availability</h4>
              <div className="space-y-1 text-sm">
                {availableFrom && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Available from:
                    </span>
                    <span>{formatAvailabilityDate(availableFrom)}</span>
                  </div>
                )}
                {availableUntil && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Available until:
                    </span>
                    <span>{formatAvailabilityDate(availableUntil)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className={getStatusColor(status)}>
                    {getStatusText(status)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Submission Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.my_submission ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Attempt:</span>
                  <span className="font-medium">
                    {test.my_submission.attempt_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">
                    {test.my_submission.completion_percentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {new Date(
                      test.my_submission.started_at
                    ).toLocaleDateString()}
                  </span>
                </div>
                {test.my_submission.submitted_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">
                      {new Date(
                        test.my_submission.submitted_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {test.my_submission.score !== null &&
                  test.my_submission.max_score !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="font-medium text-green-600">
                        {test.my_submission.score}/
                        {test.my_submission.max_score}
                      </span>
                    </div>
                  )}
                {test.my_submission.time_spent_minutes && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time spent:</span>
                    <span className="font-medium">
                      {test.my_submission.time_spent_minutes} minutes
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <Clock className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground">No submission yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Questions Preview ({test.questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {test.questions.slice(0, 5).map((question, index) => {
              const typeInfo = questionTypeInfo[question.question_type];
              const IconComponent = questionTypeIcons[typeInfo.icon];

              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <span className="text-primary text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="text-muted-foreground h-4 w-4" />
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                        {question.is_required && (
                          <Badge
                            variant="outline"
                            className="text-xs text-red-600"
                          >
                            Required
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium">{question.title}</h4>
                      {question.description && (
                        <p className="text-muted-foreground text-sm">
                          {question.description}
                        </p>
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="text-muted-foreground text-sm">
                          {question.options.length} options available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {test.questions.length > 5 && (
              <div className="text-muted-foreground text-center text-sm">
                ... and {test.questions.length - 5} more questions
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex gap-4">{getActionButton()}</div>
    </div>
  );
}
