"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTests } from "@/hooks/tests";
import { TestCardData, formatTimeLimit, getStatusColor, getStatusText } from "@/types/tests";
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
  FileText,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  XCircle,
  BookOpen,
  Timer,
  Target,
  Trophy,
} from "lucide-react";

interface TestCardProps {
  test: TestCardData;
  onViewDetails: (testId: number) => void;
  onStartTest: (testId: number) => void;
  onContinueTest: (testId: number) => void;
  onViewSubmission: (submissionId: number) => void;
}

function TestCard({ test, onViewDetails, onStartTest, onContinueTest, onViewSubmission }: TestCardProps) {
  const getStatusIcon = () => {
    switch (test.status) {
      case "not_started":
        return <PlayCircle className="h-4 w-4 text-gray-600" />;
      case "in_progress":
        return <Timer className="h-4 w-4 text-yellow-600" />;
      case "submitted":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "graded":
        return <Trophy className="h-4 w-4 text-green-600" />;
      case "overdue":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionButton = () => {
    if (!test.isAvailable && test.status !== "graded") {
      return (
        <Button variant="outline" disabled className="flex-1">
          <XCircle className="h-4 w-4 mr-2" />
          Not Available
        </Button>
      );
    }

    switch (test.status) {
      case "not_started":
        return test.canAttempt ? (
          <Button onClick={() => onStartTest(test.id)} className="flex-1">
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Test
          </Button>
        ) : (
          <Button variant="outline" disabled className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            No Attempts Left
          </Button>
        );
      case "in_progress":
        return (
          <Button onClick={() => onContinueTest(test.id)} className="flex-1">
            <Timer className="h-4 w-4 mr-2" />
            Continue Test
          </Button>
        );
      case "submitted":
        return test.mySubmission ? (
          <Button variant="outline" onClick={() => onViewSubmission(test.mySubmission!.id)} className="flex-1">
            <Clock className="h-4 w-4 mr-2" />
            View Submission
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onViewDetails(test.id)} className="flex-1">
            <Clock className="h-4 w-4 mr-2" />
            View Details
          </Button>
        );
      case "graded":
        return test.mySubmission ? (
          <Button variant="outline" onClick={() => onViewSubmission(test.mySubmission!.id)} className="flex-1">
            <Trophy className="h-4 w-4 mr-2" />
            View Results
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onViewDetails(test.id)} className="flex-1">
            <Trophy className="h-4 w-4 mr-2" />
            View Details
          </Button>
        );
      case "overdue":
        return (
          <Button variant="outline" disabled className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            Overdue
          </Button>
        );
      default:
        return (
          <Button variant="outline" onClick={() => onViewDetails(test.id)} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        );
    }
  };

  const formatAvailabilityDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1">{test.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {test.courseName}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {getStatusIcon()}
            <Badge variant="outline" className={getStatusColor(test.status)}>
              {getStatusText(test.status)}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {test.description}
        </p>

        {/* Test Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>{test.totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTimeLimit(test.timeLimit)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{test.createdByName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span>{test.attemptsRemaining}/{test.maxAttempts} attempts</span>
          </div>
        </div>

        {/* Availability */}
        {(test.availableFrom || test.availableUntil) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {test.availableFrom && (
              <div>Available from: {formatAvailabilityDate(test.availableFrom)}</div>
            )}
            {test.availableUntil && (
              <div>Available until: {formatAvailabilityDate(test.availableUntil)}</div>
            )}
          </div>
        )}

        {/* Submission Info */}
        {test.mySubmission && (
          <div className="bg-muted/30 p-3 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{test.mySubmission.completion_percentage}</span>
            </div>
            {test.mySubmission.score !== null && test.mySubmission.max_score !== null && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-medium">
                  {test.mySubmission.score}/{test.mySubmission.max_score}
                </span>
              </div>
            )}
            {test.mySubmission.time_spent_minutes && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Time spent:</span>
                <span className="font-medium">{test.mySubmission.time_spent_minutes} minutes</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {getActionButton()}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(test.id)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "in_progress" | "completed">("all");
  const { getMyTestsForUI } = useTests();
  const router = useRouter();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        setError(null);
        const testsData = await getMyTestsForUI();
        setTests(testsData);
      } catch (err) {
        console.error("Failed to fetch tests:", err);
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [getMyTestsForUI]);

  const handleViewDetails = (testId: number) => {
    router.push(`/tests/${testId}`);
  };

  const handleStartTest = (testId: number) => {
    router.push(`/tests/${testId}/take`);
  };

  const handleContinueTest = (testId: number) => {
    router.push(`/tests/${testId}/take`);
  };

  const handleViewSubmission = (submissionId: number) => {
    router.push(`/submissions/${submissionId}`);
  };

  const filteredTests = useMemo(() => {
    if (statusFilter === "all") return tests;
    
    return tests.filter(test => {
      switch (statusFilter) {
        case "available":
          return test.isAvailable && test.status === "not_started" && test.canAttempt;
        case "in_progress":
          return test.status === "in_progress";
        case "completed":
          return test.status === "submitted" || test.status === "graded";
        default:
          return true;
      }
    });
  }, [tests, statusFilter]);

  const availableTests = tests.filter(t => t.isAvailable && t.status === "not_started" && t.canAttempt);
  const inProgressTests = tests.filter(t => t.status === "in_progress");
  const completedTests = tests.filter(t => t.status === "submitted" || t.status === "graded");

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Tests</h1>
        <p className="text-muted-foreground">
          View and take your assigned tests and assessments
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <PlayCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{availableTests.length}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{inProgressTests.length}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{completedTests.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{tests.length}</div>
            <div className="text-xs text-muted-foreground">Total Tests</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All Tests
        </Button>
        <Button
          variant={statusFilter === "available" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("available")}
        >
          Available
        </Button>
        <Button
          variant={statusFilter === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("in_progress")}
        >
          In Progress
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.length > 0 ? (
          <div className="grid gap-4">
            {filteredTests.map(test => (
              <TestCard
                key={test.id}
                test={test}
                onViewDetails={handleViewDetails}
                onStartTest={handleStartTest}
                onContinueTest={handleContinueTest}
                onViewSubmission={handleViewSubmission}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Tests Found</h3>
            <p className="text-muted-foreground">
              {statusFilter === "available" 
                ? "You have no available tests at the moment."
                : statusFilter === "in_progress"
                ? "You have no tests in progress."
                : statusFilter === "completed"
                ? "You haven't completed any tests yet."
                : "You have no tests assigned yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
