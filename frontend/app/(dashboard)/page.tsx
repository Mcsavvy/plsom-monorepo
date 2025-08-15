"use client";

import { useAuth } from "@/hooks/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

import {
  BookOpen,
  Clock,
  Play,
  AlertCircle,
  ExternalLink,
  Timer,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  // Mock data - replace with real data from API calls
  const coursesInProgress = 3;
  const upcomingTests = 2;
  const courses = [
    {
      id: 1,
      title: "Biblical Interpretation",
      instructor: "Dr. Caleb Stone",
      color: "bg-green-100",
      textColor: "text-green-800",
    },
    {
      id: 2,
      title: "Systematic Theology",
      instructor: "Prof. Miriam Hayes",
      color: "bg-blue-100",
      textColor: "text-blue-800",
    },
    {
      id: 3,
      title: "Ministry Leadership",
      instructor: "Dr. Elizabeth Carter",
      color: "bg-purple-100",
      textColor: "text-purple-800",
    },
  ];

  const upcomingClasses = [
    {
      id: 1,
      title: "Biblical Interpretation",
      time: "10:00 AM - 11:00 AM",
    },
    {
      id: 2,
      title: "Systematic Theology",
      time: "11:30 AM - 12:30 PM",
    },
  ];

  const ongoingTests = [
    {
      id: 1,
      title: "Ministry Ethics Final Exam",
      subject: "Ministry Ethics",
      timeRemaining: "2h 45m",
      totalQuestions: 50,
      isSubmitted: false,
      canContinue: true,
    },
    {
      id: 2,
      title: "Biblical Hermeneutics Quiz",
      subject: "Biblical Interpretation",
      timeRemaining: "15m",
      totalQuestions: 20,
      isSubmitted: false,
      canContinue: true,
    },
    {
      id: 3,
      title: "Church History Midterm",
      subject: "Church History",
      timeRemaining: "Completed",
      totalQuestions: 30,
      isSubmitted: true,
      canContinue: false,
    },
  ];

  // Mock live class - set to null when no live class
  const liveClass = {
    id: 1,
    title: "Systematic Theology",
    instructor: "Prof. Miriam Hayes",
    startTime: "11:30 AM",
    joinUrl: "#",
    isLive: true,
  };
  // For testing without live class, uncomment this:
  // const liveClass = null;

  return (
    <div className="from-background to-secondary/20 bg-gradient-to-br p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
            <div className="text-left">
              <h1 className="text-foreground text-2xl font-bold">
                {user?.displayName}
              </h1>
              <p className="text-muted-foreground text-sm">Student</p>
            </div>
          </div>
        </div>

        {/* Live Class Banner */}
        {liveClass && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      {liveClass.title} with {liveClass.instructor} • Started at{" "}
                      {liveClass.startTime}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                  onClick={() => window.open(liveClass.joinUrl, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Join Class
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold">
                  Courses in Progress
                </h3>
                <div className="text-primary text-4xl font-bold">
                  {coursesInProgress}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold">Upcoming Tests</h3>
                <div className="text-primary text-4xl font-bold">
                  {upcomingTests}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {courses.map(course => (
              <Card
                key={course.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-0">
                  <div
                    className={`h-32 ${course.color} flex items-center justify-center rounded-t-lg`}
                  >
                    <div className="text-center">
                      <BookOpen
                        className={`h-8 w-8 ${course.textColor} mx-auto mb-2`}
                      />
                      <p className={`text-sm font-medium ${course.textColor}`}>
                        {course.title}
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-lg font-semibold">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {course.instructor}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Classes</h2>
          <div className="space-y-3">
            {upcomingClasses.map(classItem => (
              <Card
                key={classItem.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                        <Play className="text-primary h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{classItem.title}</h3>
                      <p className="text-muted-foreground flex items-center text-sm">
                        <Clock className="mr-1 h-4 w-4" />
                        {classItem.time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ongoing Tests */}
        {ongoingTests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ongoing Tests</h2>
            <div className="space-y-3">
              {ongoingTests.map(test => (
                <Card
                  key={test.id}
                  className={`${
                    test.isSubmitted
                      ? "border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20"
                      : "border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Test Header */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {test.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {test.subject}
                          </p>
                        </div>
                        {!test.isSubmitted && (
                          <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                            <Timer className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {test.timeRemaining} remaining
                            </span>
                          </div>
                        )}
                        {test.isSubmitted && (
                          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {test.timeRemaining}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Test Info */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <span>{test.totalQuestions} questions</span>
                          <span
                            className={`font-medium ${test.isSubmitted ? "text-green-600" : "text-orange-600"}`}
                          >
                            {test.isSubmitted ? "Submitted" : "Not Submitted"}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {!test.isSubmitted && test.canContinue && (
                          <Button
                            size="default"
                            className="flex-1 sm:flex-none"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Continue Test
                          </Button>
                        )}
                        {test.isSubmitted && (
                          <Button
                            variant="outline"
                            size="default"
                            className="flex-1 sm:flex-none"
                          >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Review Answers
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    Finish setting up your profile to access all features of the
                    platform.
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
