"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClasses, useClassJoining } from "@/hooks/classes";
import { ClassCardData } from "@/types/classes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const { handleJoinClass: handleJoinClassForUI, isJoining } = useClassJoining();

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
    return (
      <LoadingSpinner/>
    );
  }

  if (error || !classData) {
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
          <AlertDescription>{error || "Class not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const endTime = new Date(classData.scheduledAt.getTime() + classData.durationMinutes * 60000);

  const handleJoinClass = async () => {
    if (!classData) return;
    
    try {
      await handleJoinClassForUI(classData.id);
    } catch (error) {
      toastError(error, "Failed to join class");
    }
  };

  return (
    <div className="container mx-auto p-4 pt-8 space-y-6">
      {/* Class Hero Section */}
      <Card className="overflow-hidden pt-0">
        <div className={`h-40 ${classData.color} flex items-center justify-center relative rounded-t-xl`}>
          <div className="absolute top-4 right-4">
            {getStatusIcon()}
          </div>
          <div className="text-center px-6">
            <Calendar className={`h-12 w-12 ${classData.textColor} mx-auto mb-4`} />
            <h1 className={`text-2xl font-bold ${classData.textColor} text-center`}>
              {classData.title}
            </h1>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{classData.courseName}</span>
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
              <Users className="h-4 w-4 text-primary" />
              <span>{classData.lecturerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{formatDate(classData.scheduledAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Start Time:</span>
                <span className="font-medium">{formatTime(classData.scheduledAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">End Time:</span>
                <span className="font-medium">{formatTime(endTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{getDurationText(classData.durationMinutes)}</span>
              </div>
            </div>

                          {classData.status === "ongoing" && classData.zoomJoinUrl && (
                <Button
                  className="w-full"
                  onClick={handleJoinClass}
                  disabled={isJoining}
                >
                  <Play className="h-4 w-4 mr-2" />
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
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Attended
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Join Time:</span>
                  <span className="font-medium">
                    {formatTime(new Date(classData.myAttendance.join_time))}
                  </span>
                </div>
                {classData.myAttendance.leave_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Leave Time:</span>
                    <span className="font-medium">
                      {formatTime(new Date(classData.myAttendance.leave_time))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duration Attended:</span>
                  <span className="font-medium">
                    {getDurationText(classData.myAttendance.duration_minutes)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Via Recording:</span>
                  <span className="font-medium">
                    {classData.myAttendance.via_recording ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            ) : classData.status === "missed" ? (
              <div className="text-center py-4">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-red-600 font-medium">Class Missed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You did not attend this class
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="text-orange-600 font-medium">Not Started</p>
                <p className="text-sm text-muted-foreground mt-1">
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
                <Video className="h-4 w-4 mr-2" />
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Recording URL:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJoinClass}
                  disabled={isJoining}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Recording
                </Button>
              </div>
              {classData.passwordForRecording && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
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
            <Play className="h-4 w-4 mr-2" />
            {isJoining ? "Joining..." : "Join Live Class"}
          </Button>
        )}
        
        {classData.status === "completed" && classData.recordingUrl && (
          <Button 
            className="flex-1"
            onClick={handleJoinClass}
            disabled={isJoining}
          >
            <Video className="h-4 w-4 mr-2" />
            Watch Recording
          </Button>
        )}

        <Button variant="outline" className="flex-1">
          <Users className="h-4 w-4 mr-2" />
          Contact Lecturer
        </Button>
      </div>
    </div>
  );
}
