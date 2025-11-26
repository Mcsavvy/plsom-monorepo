"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useCourses } from "@/hooks/courses";
import { useClasses, useClassJoining } from "@/hooks/classes";
import { useTests } from "@/hooks/tests";
import { CourseCardData } from "@/types/courses";
import { ClassCardData } from "@/types/classes";
import { TestCardData } from "@/types/tests";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  Clock,
  Play,
  AlertCircle,
  Timer,
  Calendar,
  Users,
  FileText,
  GraduationCap,
  Award,
  ChevronRight,
} from "lucide-react";
import { toastError } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { getMyCoursesForUI } = useCourses();
  const { getMyClassesForUI } = useClasses();
  const { getMyTestsForUI } = useTests();
  const { handleJoinClass, isJoining } = useClassJoining();

  // State for data
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [classes, setClasses] = useState<ClassCardData[]>([]);
  const [tests, setTests] = useState<TestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesData, classesData, testsData] = await Promise.all([
          getMyCoursesForUI().catch(err => {
            console.error("Error fetching courses:", err);
            return [];
          }),
          getMyClassesForUI().catch(err => {
            console.error("Error fetching classes:", err);
            return [];
          }),
          getMyTestsForUI().catch(err => {
            console.error("Error fetching tests:", err);
            return [];
          }),
        ]);

        setCourses(coursesData);
        setClasses(classesData);
        setTests(testsData);
      } catch (err) {
        // Handle undefined errors and provide proper error handling
        if (err === undefined || err === null) {
          console.warn(
            "Received undefined error, likely due to authentication redirect"
          );
          setError("Session expired. Please log in again.");
          return;
        }

        // Check if it's an authentication error
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          err.statusCode === 401
        ) {
          console.log("401 error, logging out");
          setError("Session expired. Please log in again.");
          return;
        }

        toastError(err, "Failed to load dashboard data. Please try again.");
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getMyCoursesForUI, getMyClassesForUI, getMyTestsForUI]);

  // Computed values
  const activeCourses = courses.filter(course => course.isActive);
  const upcomingClasses = classes.filter(c => c.isUpcoming).slice(0, 3);
  const ongoingClasses = classes.filter(c => c.status === "ongoing");
  const todayClasses = classes.filter(c => c.isToday);
  const availableTests = tests.filter(
    t => t.isAvailable && t.status === "not_started" && t.canAttempt
  );
  const inProgressTests = tests.filter(
    t => t.status === "in_progress" || t.status === "returned"
  );
  const urgentTests = tests
    .filter(
      t =>
        (t.isAvailable && t.status === "not_started" && t.canAttempt) ||
        t.status === "in_progress"
    )
    .slice(0, 2);

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

  const handleJoinLiveClass = async (classId: number) => {
    try {
      await handleJoinClass(classId);
    } catch (error) {
      console.error("Failed to join class:", error);
      // You can add error handling here (e.g., toast notification)
    }
  };

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-gradient-to-br">
      <div className="container mx-auto space-y-6 p-4">
        {/* Header with User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="size-26">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center text-4xl font-semibold">
                  {user?.initials}
                </div>
              )}
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">
                Welcome back, {user?.firstName || user?.lastName || "User"}!
              </h1>
              <p className="text-muted-foreground text-sm">Student Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </div>

        {/* Live Class Banner - Priority 1 */}
        {ongoingClasses.length > 0 && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                    <div className="absolute -top-1 -left-1 h-5 w-5 animate-ping rounded-full bg-green-500/30"></div>
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      🔴 Live Class in Progress
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {ongoingClasses[0].title} • {ongoingClasses[0].courseName}
                    </p>
                  </div>
                </div>
                {ongoingClasses[0].zoomJoinUrl && (
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => handleJoinLiveClass(ongoingClasses[0].id)}
                    disabled={isJoining}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isJoining ? "Joining..." : "Join"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <BookOpen className="text-primary mx-auto mb-2 h-6 w-6" />
              <div className="text-primary text-2xl font-bold">
                {activeCourses.length}
              </div>
              <div className="text-muted-foreground text-xs">
                Active Courses
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">
                {upcomingClasses.length}
              </div>
              <div className="text-muted-foreground text-xs">
                Upcoming Classes
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="p-4 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {availableTests.length}
              </div>
              <div className="text-muted-foreground text-xs">
                Available Tests
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardContent className="p-4 text-center">
              <Timer className="mx-auto mb-2 h-6 w-6 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {inProgressTests.length}
              </div>
              <div className="text-muted-foreground text-xs">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Classes - Priority 2 */}
        {todayClasses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                Today's Classes
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/classes")}
                className="text-primary"
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {todayClasses.slice(0, 2).map(classItem => (
                <Card
                  key={classItem.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            classItem.status === "ongoing"
                              ? "bg-green-500"
                              : classItem.status === "completed"
                                ? "bg-blue-500"
                                : classItem.status === "missed"
                                  ? "bg-red-500"
                                  : "bg-orange-500"
                          }`}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium">
                            {classItem.title}
                          </h3>
                          <p className="text-muted-foreground text-xs">
                            {classItem.courseName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {classItem.scheduledAt.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {classItem.status === "ongoing"
                            ? "Live"
                            : classItem.status === "completed"
                              ? "Done"
                              : classItem.status === "missed"
                                ? "Missed"
                                : "Upcoming"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Tests - Priority 3 */}
        {urgentTests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Urgent Tests
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/tests")}
                className="text-primary"
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {urgentTests.map(test => (
                <Card
                  key={test.id}
                  className="border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {test.title}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          {test.courseName}
                        </p>
                        {test.timeLimit && (
                          <p className="mt-1 text-xs text-orange-600">
                            <Timer className="mr-1 inline h-3 w-3" />
                            {test.timeLimit} min limit
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 text-white hover:bg-orange-700"
                        onClick={() => router.push(`/tests/${test.id}/take`)}
                      >
                        {test.status === "in_progress" ? "Continue" : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Courses - Priority 4 */}
        {activeCourses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-5 w-5" />
                My Courses
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/courses")}
                className="text-primary"
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activeCourses.slice(0, 3).map(course => (
                <Card
                  key={course.id}
                  className="cursor-pointer pt-0 transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  <CardContent className="p-0">
                    <div
                      className={`h-20 ${course.color} relative flex items-center justify-center rounded-t-xl`}
                    >
                      <div className="absolute z-10 top-2 right-2">
                        {course.programType === "diploma" ? (
                          <GraduationCap
                            className={`h-4 w-4 ${course.textColor}`}
                          />
                        ) : (
                          <Award className={`h-4 w-4 ${course.textColor}`} />
                        )}
                      </div>
                      <div className="px-4 text-center">
                        <BookOpen
                          className={`h-6 w-6 ${course.textColor} mx-auto mb-1`}
                        />
                        <p
                          className={`text-xs font-medium ${course.textColor} line-clamp-1`}
                        >
                          {course.title}
                        </p>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-medium">
                        {course.title}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {course.instructor}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {course.programType === "diploma"
                            ? "Diploma"
                            : "Certificate"}
                        </Badge>
                        {course.upcomingClasses > 0 && (
                          <span className="text-primary text-xs font-medium">
                            {course.upcomingClasses} upcoming classes
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-16 flex-col space-y-1"
              onClick={() => router.push("/classes")}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">View Schedule</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col space-y-1"
              onClick={() => router.push("/tests")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Take Tests</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col space-y-1"
              onClick={() => router.push("/courses")}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">My Courses</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col space-y-1"
              onClick={() => router.push("/profile")}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {activeCourses.length === 0 &&
          classes.length === 0 &&
          tests.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h3 className="mb-2 text-xl font-semibold">Welcome to PLSOM!</h3>
              <p className="text-muted-foreground mb-4">
                You haven't been enrolled in any courses yet.
              </p>
              <p className="text-muted-foreground text-sm">
                Contact your administrator for course enrollment.
              </p>
            </div>
          )}

        {/* Setup Notice */}
        {!user?.isActive && (
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Complete your profile setup
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    Finish setting up your profile to access all features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
