"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Enrollment } from "@/types/auth";
import { GraduationCap, Calendar, Award } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentsSectionProps {
  enrollments: Enrollment[];
}

export function EnrollmentsSection({ enrollments }: EnrollmentsSectionProps) {
  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No enrollments found</p>
            <p className="text-sm">Contact your administrator for enrollment information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          My Enrollments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{enrollment.cohort.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={enrollment.cohort.program_type === "diploma" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {enrollment.cohort.program_type}
                  </Badge>
                  <Badge 
                    variant={enrollment.cohort.is_active ? "default" : "outline"}
                  >
                    {enrollment.cohort.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Started: {format(new Date(enrollment.cohort.start_date), "MMM dd, yyyy")}
                </span>
              </div>
              
              {enrollment.cohort.end_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Ends: {format(new Date(enrollment.cohort.end_date), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>
                  Enrolled: {format(new Date(enrollment.enrolled_at), "MMM dd, yyyy")}
                </span>
              </div>
              
              {enrollment.end_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Completed: {format(new Date(enrollment.end_date), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
