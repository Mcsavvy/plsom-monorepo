"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCourses } from "@/hooks/courses";
import { CourseCardData } from "@/types/courses";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toastError } from "@/lib/utils";

interface CourseCardProps {
  course: CourseCardData;
  onViewDetails: (courseId: number) => void;
}

function CourseCard({ course, onViewDetails }: CourseCardProps) {
  const formatNextClassDate = (nextClass: any) => {
    if (!nextClass?.scheduled_at) return null;
    
    try {
      const date = new Date(nextClass.scheduled_at);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const nextClassDate = formatNextClassDate(course.nextClass);

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 pt-0">
      <CardContent className="p-0">
        {/* Course Header with Color */}
        <div className={`h-32 ${course.color} flex items-center justify-center rounded-t-xl relative overflow-hidden`}>
          <div className="absolute top-2 right-2">
            {course.programType === "diploma" ? (
              <GraduationCap className={`h-5 w-5 ${course.textColor}`} />
            ) : (
              <Award className={`h-5 w-5 ${course.textColor}`} />
            )}
          </div>
          <div className="text-center px-4">
            <BookOpen className={`h-8 w-8 ${course.textColor} mx-auto mb-2`} />
            <h3 className={`text-sm font-semibold ${course.textColor} line-clamp-2`}>
              {course.title}
            </h3>
          </div>
        </div>

        {/* Course Details */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-lg line-clamp-1">{course.title}</h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.instructor}
            </p>
          </div>

          {/* Program Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={course.programType === "diploma" ? "default" : "secondary"}>
              {course.programType === "diploma" ? "Diploma" : "Certificate"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {course.moduleCount} modules
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          {/* Class Information */}
          <div className="space-y-2">
            {course.hasClasses ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Classes:</span>
                <span className="font-medium">
                  {course.totalClasses} total
                  {course.upcomingClasses > 0 && (
                    <span className="text-primary ml-1">
                      • {course.upcomingClasses} upcoming
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>No classes scheduled</span>
              </div>
            )}

            {/* Next Class */}
            {nextClassDate && (
              <div className="flex items-center gap-2 text-sm bg-primary/5 p-2 rounded">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-primary">Next Class</p>
                  <p className="text-xs text-muted-foreground">{nextClassDate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onViewDetails(course.id)}
            className="w-full"
            variant="outline"
          >
            View Details
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getMyCoursesForUI } = useCourses();
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const coursesData = await getMyCoursesForUI();
        setCourses(coursesData);
      } catch (err) {
        toastError(err, "Failed to load courses.");
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [getMyCoursesForUI]);

  const handleViewDetails = (courseId: number) => {
    router.push(`/courses/${courseId}`);
  };

  const activeCourses = courses.filter(course => course.isActive);
  const inactiveCourses = courses.filter(course => !course.isActive);

  if (loading) {
    return ( <LoadingSpinner />);
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
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">
          Access your enrolled courses and track your progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{activeCourses.length}</div>
            <div className="text-xs text-muted-foreground">Active Courses</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">
              {activeCourses.reduce((sum, course) => sum + course.upcomingClasses, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Upcoming Classes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">
              {courses.filter(c => c.programType === "diploma").length}
            </div>
            <div className="text-xs text-muted-foreground">Diploma Programs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {courses.filter(c => c.programType === "certificate").length}
            </div>
            <div className="text-xs text-muted-foreground">Certificates</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Courses */}
      {activeCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Active Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Courses */}
      {inactiveCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-6 w-6" />
            Inactive Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactiveCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t been enrolled in any courses yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator for course enrollment.
          </p>
        </div>
      )}
    </div>
  );
}
