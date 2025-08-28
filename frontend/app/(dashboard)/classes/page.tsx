"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClasses } from "@/hooks/classes";
import { ClassCardData, CalendarDay, formatTime, formatDate, getDurationText } from "@/types/classes";
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
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Video,
  BookOpen,
  List,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ClassCardProps {
  classData: ClassCardData;
  onViewDetails: (classId: number) => void;
}

function ClassCard({ classData, onViewDetails }: ClassCardProps) {
  const getStatusIcon = () => {
    switch (classData.status) {
      case "ongoing":
        return <Play className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "missed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusText = () => {
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

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1">{classData.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {classData.courseName}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getStatusIcon()}
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Time and Duration */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatTime(classData.scheduledAt)}</span>
          </div>
          <span className="text-muted-foreground">{getDurationText(classData.durationMinutes)}</span>
        </div>

        {/* Lecturer */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{classData.lecturerName}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {classData.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {classData.status === "ongoing" && classData.zoomJoinUrl && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => window.open(classData.zoomJoinUrl!, '_blank')}
            >
              <Play className="h-4 w-4 mr-2" />
              Join Live
            </Button>
          )}
          
          {classData.status === "completed" && classData.recordingUrl && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.open(classData.recordingUrl!, '_blank')}
            >
              <Video className="h-4 w-4 mr-2" />
              Watch Recording
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(classData.id)}
          >
            <ExternalLink className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarView({ classes, onViewDetails }: { classes: ClassCardData[]; onViewDetails: (classId: number) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayClasses = classes.filter(classData => {
        const classDate = new Date(classData.scheduledAt);
        return classDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        classes: dayClasses,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: date.getMonth() === month,
      });
    }
    
    return days;
  }, [currentDate, classes]);

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          {monthName}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border rounded-lg ${
              day.isToday
                ? "bg-primary/10 border-primary"
                : day.isCurrentMonth
                ? "bg-background border-border"
                : "bg-muted/30 border-muted"
            }`}
          >
            <div className="text-sm font-medium mb-1">
              {day.date.getDate()}
            </div>
            
            {/* Classes for this day */}
            <div className="space-y-1">
              {day.classes.slice(0, 2).map(classData => (
                <div
                  key={classData.id}
                  className={`text-xs p-1 rounded cursor-pointer transition-colors ${
                    classData.status === "ongoing"
                      ? "bg-green-100 text-green-800"
                      : classData.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : classData.status === "missed"
                      ? "bg-red-100 text-red-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                  onClick={() => onViewDetails(classData.id)}
                >
                  <div className="font-medium truncate">{formatTime(classData.scheduledAt)}</div>
                  <div className="truncate">{classData.title}</div>
                </div>
              ))}
              
              {day.classes.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{day.classes.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");
  const { getMyClassesForUI } = useClasses();
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const classesData = await getMyClassesForUI();
        setClasses(classesData);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setError("Failed to load classes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [getMyClassesForUI]);

  const handleViewDetails = (classId: number) => {
    router.push(`/classes/${classId}`);
  };

  const filteredClasses = useMemo(() => {
    if (timeFilter === "all") return classes;
    return classes.filter(classData => {
      if (timeFilter === "upcoming") return classData.isUpcoming;
      if (timeFilter === "past") return classData.isPast;
      return true;
    });
  }, [classes, timeFilter]);

  const upcomingClasses = classes.filter(c => c.isUpcoming);
  const ongoingClasses = classes.filter(c => c.status === "ongoing");
  const completedClasses = classes.filter(c => c.status === "completed");

  if (loading) {
    return (
      <LoadingSpinner/>
    );
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
        <h1 className="text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground">
          View your class schedule and access recordings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{upcomingClasses.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{ongoingClasses.length}</div>
            <div className="text-xs text-muted-foreground">Live Now</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{completedClasses.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{classes.length}</div>
            <div className="text-xs text-muted-foreground">Total Classes</div>
          </CardContent>
        </Card>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={timeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("all")}
          >
            All
          </Button>
          <Button
            variant={timeFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={timeFilter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("past")}
          >
            Past
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "calendar" ? (
        <CalendarView classes={filteredClasses} onViewDetails={handleViewDetails} />
      ) : (
        <div className="space-y-4">
          {filteredClasses.length > 0 ? (
            <div className="grid gap-4">
              {filteredClasses.map(classData => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Classes Found</h3>
              <p className="text-muted-foreground">
                {timeFilter === "upcoming" 
                  ? "You have no upcoming classes scheduled."
                  : timeFilter === "past"
                  ? "You have no past classes."
                  : "You have no classes scheduled yet."
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
