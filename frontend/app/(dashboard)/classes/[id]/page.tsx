"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClasses, useClassJoining } from "@/hooks/classes";
import { ClassCardData } from "@/types/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  Users,
  Play,
  Video,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  BookOpen,
  MapPin,
  Loader2,
} from "lucide-react";
import { formatTime, formatDate, getDurationText } from "@/types/classes";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toastError } from "@/lib/utils";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = parseInt(params.id as string);
  const [classData, setClassData] = useState<ClassCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getClassDetailsForUI } = useClasses();
  const { handleJoinClass: handleJoinClassForUI, isJoining } =
    useClassJoining();

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);
        setError(null);
        const classDetails = await getClassDetailsForUI(classId);
        setClassData(classDetails);
      } catch (err) {
        toastError(err, "Failed to load class details");
        setError("Failed to load class details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (classId && !isNaN(classId)) {
      fetchClass();
    } else {
      setError("Invalid class ID");
      setLoading(false);
    }
  }, [classId, getClassDetailsForUI]);

  const getStatusIcon = () => {
    if (!classData) return null;

    switch (classData.status) {
      case "ongoing":
        return <Play className="h-6 w-6 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-blue-600" />;
      case "missed":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-orange-600" />;
    }
  };

  const getStatusText = () => {
    if (!classData) return "";

    switch (classData.status) {
      case "ongoing":
        return "Live Now";
      case "completed":
        return "Completed";
      case "missed":
        return "Missed";
      default:
        return "Upcoming";
    }
  };

  const getStatusColor = () => {
    if (!classData) return "";

    switch (classData.status) {
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "missed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !classData) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Class not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const endTime = new Date(
    classData.scheduledAt.getTime() + classData.durationMinutes * 60000
  );

  const handleJoinClass = async () => {
    if (!classData) return;

    try {
      await handleJoinClassForUI(classData.id);
    } catch (error) {
      toastError(error, "Failed to join class");
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4 pt-8">
      {/* Class Hero Section */}
      <Card className="overflow-hidden pt-0">
        <div
          className={`h-40 ${classData.color} relative flex items-center justify-center rounded-t-xl`}
        >
          <div className="absolute top-4 right-4">{getStatusIcon()}</div>
          <div className="px-6 text-center">
            <Calendar
              className={`h-12 w-12 ${classData.textColor} mx-auto mb-4`}
            />
            <h1
              className={`text-2xl font-bold ${classData.textColor} text-center`}
            >
              {classData.title}
            </h1>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">
                {classData.courseName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
          </div>

          <p className="text-muted-foreground">{classData.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="text-primary h-4 w-4" />
              <span>{classData.lecturerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>{getDurationText(classData.durationMinutes)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {formatDate(classData.scheduledAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Start Time:</span>
                <span className="font-medium">
                  {formatTime(classData.scheduledAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">End Time:</span>
                <span className="font-medium">{formatTime(endTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {getDurationText(classData.durationMinutes)}
                </span>
              </div>
            </div>

            {classData.canJoin && classData.zoomJoinUrl && (
              <Button
                className="w-full"
                onClick={handleJoinClass}
                disabled={isJoining}
              >
                <Play className="mr-2 h-4 w-4" />
                {isJoining ? "Joining..." : "Join Live Class"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Attendance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classData.myAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    Attended
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Join Time:</span>
                  <span className="font-medium">
                    {formatTime(new Date(classData.myAttendance.join_time))}
                  </span>
                </div>
                {classData.myAttendance.leave_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Leave Time:</span>
                    <span className="font-medium">
                      {formatTime(new Date(classData.myAttendance.leave_time))}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Duration Attended:
                  </span>
                  <span className="font-medium">
                    {getDurationText(classData.myAttendance.duration_minutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Via Recording:</span>
                  <span className="font-medium">
                    {classData.myAttendance.via_recording ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            ) : classData.status === "missed" ? (
              <div className="py-4 text-center">
                <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
                <p className="font-medium text-red-600">Class Missed</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  You did not attend this class
                </p>
              </div>
            ) : (
              <div className="py-4 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-orange-500" />
                <p className="font-medium text-orange-600">Not Started</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Class hasn't started yet
                </p>
              </div>
            )}

            {classData.status === "completed" && classData.recordingUrl && (
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={handleJoinClass}
                disabled={isJoining}
              >
                <Video className="mr-2 h-4 w-4" />
                Watch Recording
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recording Information */}
      {classData.recordingUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recording URL:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJoinClass}
                  disabled={isJoining}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Recording
                </Button>
              </div>
              {classData.passwordForRecording && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="bg-muted rounded px-2 py-1 font-mono text-sm">
                    {classData.passwordForRecording}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {classData.status === "ongoing" && classData.zoomJoinUrl && (
          <Button
            className="flex-1"
            onClick={handleJoinClass}
            disabled={isJoining}
          >
            <Play className="mr-2 h-4 w-4" />
            {isJoining ? "Joining..." : "Join Live Class"}
          </Button>
        )}

        {classData.status === "completed" && classData.recordingUrl && (
          <Button
            className="flex-1"
            onClick={handleJoinClass}
            disabled={isJoining}
          >
            <Video className="mr-2 h-4 w-4" />
            Watch Recording
          </Button>
        )}

        <Button variant="outline" className="flex-1">
          <Users className="mr-2 h-4 w-4" />
          Contact Lecturer
        </Button>
      </div>
    </div>
  );
}
