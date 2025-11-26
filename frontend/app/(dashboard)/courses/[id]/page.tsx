"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourses } from "@/hooks/courses";
import { CourseCardData } from "@/types/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  AlertCircle,
  GraduationCap,
  Award,
  ArrowLeft,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toastError } from "@/lib/utils";
import { useClasses, useClassJoining } from "@/hooks/classes";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const { getCourseDetailsForUI } = useCourses();
  const { handleJoinClass, isJoining } = useClassJoining();
  const [course, setCourse] = useState<CourseCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        const courseData = await getCourseDetailsForUI(courseId);
        setCourse(courseData);
      } catch (err) {
        toastError(err, "Failed to load course details.");
        setError("Failed to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId && !isNaN(courseId)) {
      fetchCourse();
    } else {
      setError("Invalid course ID");
      setLoading(false);
    }
  }, [courseId, getCourseDetailsForUI]);

  const formatNextClassDate = (nextClass: any) => {
    if (!nextClass?.scheduled_at) return null;

    try {
      const date = new Date(nextClass.scheduled_at);
      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !course) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Course not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const nextClassDate = formatNextClassDate(course.nextClass);

  const handleJoinNextClass = async () => {
    if (!course?.nextClass?.id) return;

    try {
      await handleJoinClass(course.nextClass.id);
    } catch (error) {
      console.error("Failed to join class:", error);
      // You can add error handling here (e.g., toast notification)
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4 pt-8">
      {/* Course Hero Section */}
      <Card className="overflow-hidden pt-0">
        <div
          className={`h-40 ${course.color} relative flex items-center justify-center rounded-t-xl`}
        >
          <div className="absolute top-4 right-4">
            {course.programType === "diploma" ? (
              <GraduationCap className={`h-6 w-6 ${course.textColor}`} />
            ) : (
              <Award className={`h-6 w-6 ${course.textColor}`} />
            )}
          </div>
          <div className="px-6 text-center">
            <BookOpen
              className={`h-12 w-12 ${course.textColor} mx-auto mb-4`}
            />
            <h1
              className={`text-2xl font-bold ${course.textColor} text-center`}
            >
              {course.title}
            </h1>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">{course.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  course.programType === "diploma" ? "default" : "secondary"
                }
              >
                {course.programType === "diploma"
                  ? "Diploma Program"
                  : "Certificate Program"}
              </Badge>
              {!course.isActive && <Badge variant="outline">Completed</Badge>}
            </div>
          </div>

          <p className="text-muted-foreground">{course.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary h-4 w-4" />
              <span>{course.moduleCount} modules</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="text-primary h-4 w-4" />
              <span>{course.totalClasses} total classes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.hasClasses ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Classes:</span>
                  <span className="font-semibold">{course.totalClasses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Upcoming:</span>
                  <span className="text-primary font-semibold">
                    {course.upcomingClasses}
                  </span>
                </div>

                {nextClassDate && (
                  <div className="bg-primary/5 mt-4 rounded-lg p-4">
                    <h4 className="text-primary mb-2 font-semibold">
                      Next Class
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{nextClassDate.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{nextClassDate.time}</span>
                      </div>
                      {course.nextClass?.title && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.nextClass.title}</span>
                        </div>
                      )}
                    </div>

                    {course.nextClass?.meeting_link && (
                      <Button
                        className="mt-3 w-full"
                        onClick={handleJoinNextClass}
                        disabled={isJoining}
                      >
                        {isJoining ? "Joining..." : "Join Class"}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground">No classes scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Course Status</span>
                <span
                  className={
                    course.isActive ? "text-green-600" : "text-muted-foreground"
                  }
                >
                  {course.isActive ? "In Progress" : "Completed"}
                </span>
              </div>

              {/* Progress would be calculated from actual data */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Classes Attended</span>
                  <span>
                    {course.totalClasses - course.upcomingClasses} /{" "}
                    {course.totalClasses}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${course.totalClasses > 0 ? ((course.totalClasses - course.upcomingClasses) / course.totalClasses) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" className="w-full">
                View All Classes
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          <Users className="mr-2 h-4 w-4" />
          Contact Instructor
        </Button>
      </div>
    </div>
  );
}
