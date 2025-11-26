import { AuditLogResponse, AuditLog } from '@/types/auditLog';
import { UserResponse, UserIdentity } from '@/types/user';
import { StudentResponse, Student } from '@/types/student';
import { Staff, StaffResponse } from '@/types/staff';
import { Enrollment, EnrollmentResponse } from '@/types/enrollment';
import {
  CourseResponse,
  Course,
  StaffCourseResponse,
  StaffCourse,
} from '@/types/course';
import { ClassResponse, Class } from '@/types/class';
import {
  TestListResponse,
  TestDetailResponse,
  TestStatisticsResponse,
  TestListItem,
  TestDetail,
  TestStatistics,
  QuestionResponse,
  Question,
  QuestionOptionResponse,
  QuestionOption,
} from '@/types/test';
import {
  SubmissionListResponse,
  SubmissionAnswerResponse,
  Submission,
  SubmissionListItem,
  SubmissionAnswer,
} from '@/types/submission';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(n => n !== '')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function transformAuditLog(djangoLog: AuditLogResponse): AuditLog {
  return {
    id: djangoLog.id,
    name: djangoLog.name,
    resource: djangoLog.resource,
    action: djangoLog.action,
    timestamp: djangoLog.timestamp,
    author: djangoLog.author_info,
    author_name: djangoLog.author_info.name,
    data: djangoLog.data,
    previous_data: djangoLog.previous_data,
    meta: {
      ...djangoLog.meta,
      object_repr: djangoLog.meta?.object_repr,
      admin_action: djangoLog.meta?.admin_action,
    },
    ip_address: djangoLog.ip_address,
    user_agent: djangoLog.user_agent,
  };
}

export function transformUser(user: UserResponse): UserIdentity {
  const displayName = user.title
    ? `${user.title} ${user.first_name} ${user.last_name}`
    : `${user.first_name} ${user.last_name}`.trim();

  const initials = getInitials(displayName);

  return {
    id: user.id,
    name: displayName,
    initials,
    firstName: user.first_name,
    lastName: user.last_name,
    title: user.title,
    email: user.email,
    role: user.role,
    avatar: user.profile_picture?.replace('b2l/', 'b2/'),
    isActive: user.is_active,
    isSetupComplete: user.is_setup_complete,
    whatsappNumber: user.whatsapp_number,
  };
}

export function transformStudent(studentResponse: StudentResponse): Student {
  console.log('studentResponse', studentResponse);
  const fullName =
    `${studentResponse.first_name} ${studentResponse.last_name}`.trim();
  const displayName = studentResponse.title
    ? `${studentResponse.title} ${fullName}`
    : fullName;
  const initials = getInitials(displayName);

  // Transform enrollments
  const enrollments = studentResponse.enrollments.map(enrollment => ({
    id: enrollment.id,
    cohort: {
      id: enrollment.cohort.id,
      name: enrollment.cohort.name,
      programType: enrollment.cohort.program_type,
      isActive: enrollment.cohort.is_active,
      startDate: enrollment.cohort.start_date,
      endDate: enrollment.cohort.end_date,
    },
    enrolledAt: enrollment.enrolled_at,
  }));
  const activeEnrollments = enrollments.filter(e => e.cohort.isActive);
  const programTypes = Array.from(
    new Set(enrollments.map(e => e.cohort.programType))
  );

  // Determine status
  let status: 'active' | 'inactive' | 'pending';
  let statusText: string;

  if (!studentResponse.is_active) {
    status = 'inactive';
    statusText = 'Inactive';
  } else if (!studentResponse.is_setup_complete) {
    status = 'pending';
    statusText = 'Pending Setup';
  } else {
    status = 'active';
    statusText = 'Active';
  }

  return {
    id: studentResponse.id,
    email: studentResponse.email,
    firstName: studentResponse.first_name,
    lastName: studentResponse.last_name,
    fullName,
    displayName,
    title: studentResponse.title || undefined,
    initials,
    whatsappNumber: studentResponse.whatsapp_number,
    profilePicture: studentResponse.profile_picture?.replace('b2l/', 'b2/'),
    isSetupComplete: studentResponse.is_setup_complete,
    isActive: studentResponse.is_active,
    status,
    statusText,
    enrollments,
    enrollmentCount: enrollments.length,
    activeEnrollmentCount: activeEnrollments.length,
    programTypes,
  };
}

export function transformStaff(staffResponse: StaffResponse): Staff {
  const fullName =
    `${staffResponse.first_name} ${staffResponse.last_name}`.trim();
  const displayName = staffResponse.title
    ? `${staffResponse.title} ${fullName}`
    : fullName;
  const initials = getInitials(displayName);

  return {
    id: staffResponse.id,
    email: staffResponse.email,
    firstName: staffResponse.first_name,
    lastName: staffResponse.last_name,
    title: staffResponse.title,
    role: staffResponse.role,
    whatsappNumber: staffResponse.whatsapp_number,
    profilePicture: staffResponse.profile_picture?.replace('b2l/', 'b2/'),
    isSetupComplete: staffResponse.is_setup_complete,
    isActive: staffResponse.is_active,
    coursesTaught: staffResponse.courses_taught.map(course =>
      transformStaffCourse(course)
    ),
    totalClasses: staffResponse.total_classes,
    // Computed properties
    fullName,
    displayName,
    initials,
  };
}

export function transformEnrollment(
  enrollment: EnrollmentResponse
): Enrollment {
  const studentDisplayName = enrollment.student.title
    ? `${enrollment.student.title} ${enrollment.student.first_name} ${enrollment.student.last_name}`
    : `${enrollment.student.first_name} ${enrollment.student.last_name}`;
  const studentInitials = getInitials(studentDisplayName);

  return {
    id: enrollment.id,
    cohort: {
      id: enrollment.cohort.id,
      name: enrollment.cohort.name,
      programType: enrollment.cohort.program_type,
      isActive: enrollment.cohort.is_active,
      startDate: enrollment.cohort.start_date,
      endDate: enrollment.cohort.end_date,
    },
    student: {
      id: enrollment.student.id,
      firstName: enrollment.student.first_name,
      lastName: enrollment.student.last_name,
      fullName: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
      displayName: studentDisplayName,
      initials: studentInitials,
      title: enrollment.student.title,
      email: enrollment.student.email,
      profilePicture:
        enrollment.student.profile_picture?.replace('b2l/', 'b2/') || '',
    },
    enrolledAt: enrollment.enrolled_at,
  };
}

export function transformCourse(courseResponse: CourseResponse): Course {
  let lecturer = null;

  if (courseResponse.lecturer) {
    const lecturerFullName =
      `${courseResponse.lecturer.first_name} ${courseResponse.lecturer.last_name}`.trim();
    const lecturerDisplayName = courseResponse.lecturer.title
      ? `${courseResponse.lecturer.title} ${lecturerFullName}`
      : lecturerFullName;
    const lecturerInitials = getInitials(lecturerDisplayName);

    lecturer = {
      id: courseResponse.lecturer.id,
      firstName: courseResponse.lecturer.first_name,
      lastName: courseResponse.lecturer.last_name,
      fullName: lecturerFullName,
      displayName: lecturerDisplayName,
      title: courseResponse.lecturer.title,
      email: courseResponse.lecturer.email,
      profilePicture: courseResponse.lecturer.profile_picture?.replace(
        'b2l/',
        'b2/'
      ),
      initials: lecturerInitials,
    };
  }

  return {
    id: courseResponse.id,
    name: courseResponse.name,
    description: courseResponse.description,
    programType: courseResponse.program_type,
    isActive: courseResponse.is_active,
    moduleCount: courseResponse.module_count,
    createdAt: courseResponse.created_at,
    updatedAt: courseResponse.updated_at,
    lecturer,
  };
}

export function transformStaffCourse(
  staffCourseResponse: StaffCourseResponse
): StaffCourse {
  return {
    id: staffCourseResponse.id,
    name: staffCourseResponse.name,
    description: staffCourseResponse.description,
    programType: staffCourseResponse.program_type,
    isActive: staffCourseResponse.is_active,
    moduleCount: staffCourseResponse.module_count,
  };
}

export function transformClass(classResponse: ClassResponse): Class {
  // Transform course lecturer
  let courseLecturer = null;
  if (classResponse.course.lecturer) {
    const lecturerFullName =
      `${classResponse.course.lecturer.first_name} ${classResponse.course.lecturer.last_name}`.trim();
    const lecturerDisplayName = classResponse.course.lecturer.title
      ? `${classResponse.course.lecturer.title} ${lecturerFullName}`
      : lecturerFullName;
    const lecturerInitials = getInitials(lecturerDisplayName);

    courseLecturer = {
      id: classResponse.course.lecturer.id,
      firstName: classResponse.course.lecturer.first_name,
      lastName: classResponse.course.lecturer.last_name,
      fullName: lecturerFullName,
      displayName: lecturerDisplayName,
      title: classResponse.course.lecturer.title,
      email: classResponse.course.lecturer.email,
      profilePicture: classResponse.course.lecturer.profile_picture?.replace(
        'b2l/',
        'b2/'
      ),
      initials: lecturerInitials,
      role: classResponse.course.lecturer.role,
      whatsappNumber: classResponse.course.lecturer.whatsapp_number,
      isSetupComplete: classResponse.course.lecturer.is_setup_complete,
      isActive: classResponse.course.lecturer.is_active,
    };
  }

  // Transform class lecturer
  const classLecturerFullName =
    `${classResponse.lecturer.first_name} ${classResponse.lecturer.last_name}`.trim();
  const classLecturerDisplayName = classResponse.lecturer.title
    ? `${classResponse.lecturer.title} ${classLecturerFullName}`
    : classLecturerFullName;
  const classLecturerInitials = getInitials(classLecturerDisplayName);

  const lecturer = {
    id: classResponse.lecturer.id,
    firstName: classResponse.lecturer.first_name,
    lastName: classResponse.lecturer.last_name,
    fullName: classLecturerFullName,
    displayName: classLecturerDisplayName,
    title: classResponse.lecturer.title,
    email: classResponse.lecturer.email,
    profilePicture: classResponse.lecturer.profile_picture?.replace(
      'b2l/',
      'b2/'
    ),
    initials: classLecturerInitials,
    role: classResponse.lecturer.role,
    whatsappNumber: classResponse.lecturer.whatsapp_number,
    isSetupComplete: classResponse.lecturer.is_setup_complete,
    isActive: classResponse.lecturer.is_active,
  };

  // Transform course
  const course = {
    id: classResponse.course.id,
    name: classResponse.course.name,
    description: classResponse.course.description,
    programType: classResponse.course.program_type,
    moduleCount: classResponse.course.module_count,
    isActive: classResponse.course.is_active,
    createdAt: classResponse.course.created_at,
    updatedAt: classResponse.course.updated_at,
    lecturer: courseLecturer,
    totalClasses: classResponse.course.total_classes,
    activeClassesCount: classResponse.course.active_classes_count,
  };

  // Transform cohort
  const cohort = {
    id: classResponse.cohort.id,
    name: classResponse.cohort.name,
    programType: classResponse.cohort.program_type,
    isActive: classResponse.cohort.is_active,
    startDate: classResponse.cohort.start_date,
    endDate: classResponse.cohort.end_date,
    enrolledStudentsCount: classResponse.cohort.enrolled_students_count,
  };

  // Determine status
  const now = new Date();
  const scheduledAt = new Date(classResponse.scheduled_at);
  const endTime = new Date(
    scheduledAt.getTime() + classResponse.duration_minutes * 60 * 1000
  );

  let status: 'upcoming' | 'ongoing' | 'completed';
  let statusText: string;

  if (classResponse.is_past) {
    status = 'completed';
    statusText = 'Completed';
  } else if (now >= scheduledAt && now <= endTime) {
    status = 'ongoing';
    statusText = 'Ongoing';
  } else {
    status = 'upcoming';
    statusText = 'Upcoming';
  }

  // Format datetime
  const formattedDateTime = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(scheduledAt);

  // Format duration
  const hours = Math.floor(classResponse.duration_minutes / 60);
  const minutes = classResponse.duration_minutes % 60;
  const formattedDuration =
    hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

  return {
    id: classResponse.id,
    course,
    lecturer,
    cohort,
    title: classResponse.title,
    description: classResponse.description,
    scheduledAt: classResponse.scheduled_at,
    durationMinutes: classResponse.duration_minutes,
    zoomJoinUrl: classResponse.zoom_join_url,
    recordingUrl: classResponse.recording_url,
    passwordForRecording: classResponse.password_for_recording,
    attendanceCount: classResponse.attendance_count,
    isPast: classResponse.is_past,
    canJoin: classResponse.can_join,
    status,
    statusText,
    formattedDateTime,
    formattedDuration,
  };
}

export function transformQuestionOption(
  optionResponse: QuestionOptionResponse
): QuestionOption {
  return {
    id: optionResponse.id,
    text: optionResponse.text,
    order: optionResponse.order,
    isCorrect: optionResponse.is_correct,
  };
}

export function transformQuestion(
  questionResponse: QuestionResponse
): Question {
  return {
    id: questionResponse.id,
    questionType: questionResponse.question_type,
    title: questionResponse.title,
    description: questionResponse.description,
    isRequired: questionResponse.is_required,
    order: questionResponse.order,
    maxFileSizeMb: questionResponse.max_file_size_mb,
    allowedFileTypes: questionResponse.allowed_file_types,
    requiredTranslation: questionResponse.required_translation,
    allowMultipleVerses: questionResponse.allow_multiple_verses,
    minWordCount: questionResponse.min_word_count,
    maxWordCount: questionResponse.max_word_count,
    textMaxLength: questionResponse.text_max_length,
    textPlaceholder: questionResponse.text_placeholder,
    options: questionResponse.options.map(transformQuestionOption),
  };
}

export function transformTestListItem(
  testResponse: TestListResponse
): TestListItem {
  // Status formatting
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  // Time limit formatting
  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return 'No time limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Availability formatting
  const formatAvailability = (from: string | null, until: string | null) => {
    if (!from && !until) return 'Always available';
    if (from && !until)
      return `Available from ${new Date(from).toLocaleDateString()}`;
    if (!from && until)
      return `Available until ${new Date(until).toLocaleDateString()}`;
    return `${new Date(from!).toLocaleDateString()} - ${new Date(until!).toLocaleDateString()}`;
  };

  return {
    id: testResponse.id,
    title: testResponse.title,
    description: testResponse.description,
    status: testResponse.status,
    statusText: getStatusText(testResponse.status),
    statusColor: getStatusColor(testResponse.status),
    availableFrom: testResponse.available_from,
    availableUntil: testResponse.available_until,
    createdAt: testResponse.created_at,
    updatedAt: testResponse.updated_at,
    totalQuestions: testResponse.total_questions,
    totalSubmissions: testResponse.total_submissions,
    isAvailable: testResponse.is_available,
    courseName: testResponse.course_name,
    cohortName: testResponse.cohort_name,
    createdByName: testResponse.created_by_name,
    timeLimitMinutes: testResponse.time_limit_minutes,
    maxAttempts: testResponse.max_attempts,
    formattedTimeLimit: formatTimeLimit(testResponse.time_limit_minutes),
    formattedAvailability: formatAvailability(
      testResponse.available_from,
      testResponse.available_until
    ),
  };
}

export function transformTestDetail(
  testResponse: TestDetailResponse
): TestDetail {
  // Status formatting
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  // Time limit formatting
  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return 'No time limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Availability formatting
  const formatAvailability = (from: string | null, until: string | null) => {
    if (!from && !until) return 'Always available';
    if (from && !until)
      return `Available from ${new Date(from).toLocaleDateString()}`;
    if (!from && until)
      return `Available until ${new Date(until).toLocaleDateString()}`;
    return `${new Date(from!).toLocaleDateString()} - ${new Date(until!).toLocaleDateString()}`;
  };

  return {
    id: testResponse.id,
    title: testResponse.title,
    description: testResponse.description,
    instructions: testResponse.instructions,
    course: testResponse.course,
    courseName: testResponse.course_name,
    cohort: testResponse.cohort,
    cohortName: testResponse.cohort_name,
    createdBy: testResponse.created_by,
    timeLimitMinutes: testResponse.time_limit_minutes,
    maxAttempts: testResponse.max_attempts,
    allowReviewAfterSubmission: testResponse.allow_review_after_submission,
    randomizeQuestions: testResponse.randomize_questions,
    status: testResponse.status,
    statusText: getStatusText(testResponse.status),
    statusColor: getStatusColor(testResponse.status),
    availableFrom: testResponse.available_from,
    availableUntil: testResponse.available_until,
    createdAt: testResponse.created_at,
    updatedAt: testResponse.updated_at,
    questions: testResponse.questions.map(transformQuestion),
    totalQuestions: testResponse.total_questions,
    totalSubmissions: testResponse.total_submissions,
    isAvailable: testResponse.is_available,
    formattedTimeLimit: formatTimeLimit(testResponse.time_limit_minutes),
    formattedAvailability: formatAvailability(
      testResponse.available_from,
      testResponse.available_until
    ),
    hasSubmissions: testResponse.total_submissions > 0,
  };
}

export function transformTestStatistics(
  statsResponse: TestStatisticsResponse
): TestStatistics {
  const completionRate =
    statsResponse.total_submissions > 0
      ? (statsResponse.completed_submissions /
          statsResponse.total_submissions) *
        100
      : 0;

  const formatAverageTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return {
    totalQuestions: statsResponse.total_questions,
    totalSubmissions: statsResponse.total_submissions,
    completedSubmissions: statsResponse.completed_submissions,
    averageCompletionTime: statsResponse.average_completion_time,
    averageScore: statsResponse.average_score,
    isAvailable: statsResponse.is_available,
    completionRate,
    formattedAverageTime: formatAverageTime(
      statsResponse.average_completion_time
    ),
  };
}

export function transformSubmissionAnswer(
  answerResponse: SubmissionAnswerResponse
): SubmissionAnswer {
  return {
    id: answerResponse.id,
    question: answerResponse.question,
    textAnswer: answerResponse.text_answer,
    booleanAnswer: answerResponse.boolean_answer,
    dateAnswer: answerResponse.date_answer,
    fileAnswer: answerResponse.file_answer,
    selectedOptions: answerResponse.selected_options,
    answeredAt: answerResponse.answered_at,
    isFlagged: answerResponse.is_flagged,
    pointsEarned: answerResponse.points_earned,
    maxPoints: answerResponse.max_points,
    feedback: answerResponse.feedback,
    displayAnswer: answerResponse.display_answer,
    hasAnswer: answerResponse.has_answer,
    questionTitle: answerResponse.question_title,
    questionType: answerResponse.question_type,
    questionDescription: answerResponse.question_description,
    questionOptions: answerResponse.question_options.map(option => ({
      id: option.id,
      text: option.text,
      order: option.order,
      isCorrect: option.is_correct,
    })),
  };
}

export function transformSubmission(
  submissionResponse: SubmissionListResponse
): Submission {
  return {
    id: submissionResponse.id,
    test: submissionResponse.test,
    student: submissionResponse.student,
    attemptNumber: submissionResponse.attempt_number,
    status: submissionResponse.status,
    startedAt: submissionResponse.started_at,
    submittedAt: submissionResponse.submitted_at,
    timeSpentMinutes: submissionResponse.time_spent_minutes,
    score: submissionResponse.score,
    maxScore: submissionResponse.max_score,
    gradedBy: submissionResponse.graded_by,
    gradedAt: submissionResponse.graded_at,
    feedback: submissionResponse.feedback,
    createdAt: submissionResponse.created_at,
    updatedAt: submissionResponse.updated_at,
    answers: submissionResponse.answers.map(transformSubmissionAnswer),
    isSubmitted: submissionResponse.is_submitted,
    completionPercentage: submissionResponse.completion_percentage,
    studentName: submissionResponse.student_name,
    studentEmail: submissionResponse.student_email,
    testTitle: submissionResponse.test_title,
    testTotalPoints: submissionResponse.test_total_points,
    gradedByName: submissionResponse.graded_by_name,
  };
}

export function transformSubmissionListItem(
  submissionResponse: SubmissionListResponse
): SubmissionListItem {
  return {
    id: submissionResponse.id,
    test: submissionResponse.test,
    student: submissionResponse.student,
    attemptNumber: submissionResponse.attempt_number,
    status: submissionResponse.status,
    startedAt: submissionResponse.started_at,
    submittedAt: submissionResponse.submitted_at,
    timeSpentMinutes: submissionResponse.time_spent_minutes,
    score: submissionResponse.score,
    maxScore: submissionResponse.max_score,
    gradedBy: submissionResponse.graded_by,
    gradedAt: submissionResponse.graded_at,
    feedback: submissionResponse.feedback,
    createdAt: submissionResponse.created_at,
    updatedAt: submissionResponse.updated_at,
    isSubmitted: submissionResponse.is_submitted,
    completionPercentage: submissionResponse.completion_percentage,
    studentName: submissionResponse.student_name,
    studentEmail: submissionResponse.student_email,
    testTitle: submissionResponse.test_title,
    testTotalPoints: submissionResponse.test_total_points,
    gradedByName: submissionResponse.graded_by_name,
  };
}
