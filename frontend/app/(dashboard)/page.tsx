"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useCourses } from "@/hooks/courses";
import { useClasses } from "@/hooks/classes";
import { useTests } from "@/hooks/tests";
import { CourseCardData } from "@/types/courses";
import { ClassCardData } from "@/types/classes";
import { TestCardData } from "@/types/tests";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  ExternalLink,
  Timer,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Video,
  FileText,
  GraduationCap,
  Award,
  ChevronRight,
  Bell,
  TrendingUp,
} from "lucide-react";
import { toastError } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { getMyCoursesForUI } = useCourses();
  const { getMyClassesForUI } = useClasses();
  const { getMyTestsForUI } = useTests();

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
          getMyCoursesForUI(),
          getMyClassesForUI(),
          getMyTestsForUI(),
        ]);
        
        setCourses(coursesData);
        setClasses(classesData);
        setTests(testsData);
      } catch (err) {
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
  const availableTests = tests.filter(t => t.isAvailable && t.status === "not_started" && t.canAttempt);
  const inProgressTests = tests.filter(t => t.status === "in_progress");
  const urgentTests = tests.filter(t => 
    (t.isAvailable && t.status === "not_started" && t.canAttempt) || 
    t.status === "in_progress"
  ).slice(0, 2);

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-4 space-y-6">
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
              <h1 className="text-xl font-bold">Welcome back, {user?.firstName || user?.lastName || "User"}!</h1>
              <p className="text-sm text-muted-foreground">Student Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {urgentTests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            )}
          </Button>
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
                    onClick={() => window.open(ongoingClasses[0].zoomJoinUrl!, "_blank")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Join
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
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{activeCourses.length}</div>
              <div className="text-xs text-muted-foreground">Active Courses</div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">{upcomingClasses.length}</div>
              <div className="text-xs text-muted-foreground">Upcoming Classes</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{availableTests.length}</div>
              <div className="text-xs text-muted-foreground">Available Tests</div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="p-4 text-center">
              <Timer className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">{inProgressTests.length}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Classes - Priority 2 */}
        {todayClasses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Classes
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/classes')}
                className="text-primary"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {todayClasses.slice(0, 2).map(classItem => (
                <Card key={classItem.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          classItem.status === "ongoing" ? "bg-green-500" :
                          classItem.status === "completed" ? "bg-blue-500" :
                          classItem.status === "missed" ? "bg-red-500" :
                          "bg-orange-500"
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{classItem.title}</h3>
                          <p className="text-xs text-muted-foreground">{classItem.courseName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {classItem.scheduledAt.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {classItem.status === "ongoing" ? "Live" :
                           classItem.status === "completed" ? "Done" :
                           classItem.status === "missed" ? "Missed" :
                           "Upcoming"}
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
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Urgent Tests
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/tests')}
                className="text-primary"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {urgentTests.map(test => (
                <Card key={test.id} className="border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{test.title}</h3>
                        <p className="text-xs text-muted-foreground">{test.courseName}</p>
                        {test.timeLimit && (
                          <p className="text-xs text-orange-600 mt-1">
                            <Timer className="h-3 w-3 inline mr-1" />
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
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/courses')}
                className="text-primary"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {activeCourses.slice(0, 3).map(course => (
                <Card 
                  key={course.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow pt-0"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  <CardContent className="p-0">
                    <div className={`h-20 ${course.color} flex items-center justify-center rounded-t-xl relative`}>
                      <div className="absolute top-2 right-2">
                        {course.programType === "diploma" ? (
                          <GraduationCap className={`h-4 w-4 ${course.textColor}`} />
                        ) : (
                          <Award className={`h-4 w-4 ${course.textColor}`} />
                        )}
                      </div>
                      <div className="text-center px-4">
                        <BookOpen className={`h-6 w-6 ${course.textColor} mx-auto mb-1`} />
                        <p className={`text-xs font-medium ${course.textColor} line-clamp-1`}>
                          {course.title}
                        </p>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-muted-foreground">{course.instructor}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {course.programType === "diploma" ? "Diploma" : "Certificate"}
                        </Badge>
                        {course.upcomingClasses > 0 && (
                          <span className="text-xs text-primary font-medium">
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
              onClick={() => router.push('/classes')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">View Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              onClick={() => router.push('/tests')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Take Tests</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              onClick={() => router.push('/courses')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">My Courses</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-1"
              onClick={() => router.push('/profile')}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {activeCourses.length === 0 && classes.length === 0 && tests.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Welcome to PLSOM!</h3>
            <p className="text-muted-foreground mb-4">
              You haven't been enrolled in any courses yet.
            </p>
            <p className="text-sm text-muted-foreground">
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
