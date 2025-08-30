from typing import TypedDict
from django.contrib.contenttypes.models import ContentType

def get_content_type(resource: str) -> ContentType:
    from apps.invitations.models import Invitation
    from apps.cohorts.models import Cohort
    from apps.users.models import User
    from apps.cohorts.models import Enrollment
    from apps.core.models import AuditLog
    from apps.courses.models import Course
    from apps.classes.models import Class
    from apps.assessments.models import Test, Submission
    from apps.classes.models import Attendance

    resource_map = {
        "users": User,
        "cohorts": Cohort,
        "students": User,
        "staff": User,
        "courses": Course,
        "classes": Class,
        "attendance": Attendance,
        "enrollments": Enrollment,
        "invitations": Invitation,
        "audit-logs": AuditLog,
        "tests": Test,
        "submissions": Submission,
    }
    if resource not in resource_map:
        raise ValueError(f"Invalid resource: {resource}")
    return ContentType.objects.get_for_model(resource_map[resource])


class ResourceMeta(TypedDict):
    name: str
    description: str


def get_resource_meta(resource: str, id: int) -> ResourceMeta:
    from apps.invitations.models import Invitation
    from apps.cohorts.models import Cohort
    from apps.users.models import User
    from apps.cohorts.models import Enrollment
    from apps.core.models import AuditLog
    from apps.courses.models import Course
    from apps.classes.models import Class
    from apps.assessments.models import Test, Submission
    from apps.classes.models import Attendance

    if resource == "invitations":
        invitation = Invitation.objects.get(id=id)
        return {
            "name": f"{invitation.role} #{id}",
            "description": (
                "Invitation for "
                + invitation.email
                + " to join PLSOM as a "
                + ("n" if invitation.role == "admin" else "")
                + invitation.role
            ),
        }
    elif resource == "cohorts":
        cohort = Cohort.objects.get(id=id)
        return {
            "name": cohort.name,
            "description": (cohort.name + " (" + cohort.program_type + ")"),
        }
    elif resource == "enrollments":
        enrollment = Enrollment.objects.get(id=id)
        return {
            "name": f"{enrollment.student.get_full_name()} - {enrollment.cohort.name}",
            "description": (
                "Enrollment for "
                + enrollment.student.get_full_name()
                + " in "
                + enrollment.cohort.name
            ),
        }
    elif resource == "students":
        student = User.objects.get(id=id)
        return {
            "name": student.get_full_name(),
            "description": (
                "Student "
                + student.get_full_name()
                + " ("
                + student.email
                + ")"
            ),
        }
    elif resource == "staff":
        staff = User.objects.get(id=id)
        return {
            "name": staff.get_full_name(),
            "description": (
                "Staff " + staff.get_full_name() + " (" + staff.email + ")"
            ),
        }
    elif resource == "courses":
        course = Course.objects.get(id=id)
        lecturer_name: str | None = None
        if course.lecturer:
            lecturer_name = course.lecturer.get_full_name()
        return {
            "name": course.name,
            "description": (
                course.name
                + " ("
                + course.program_type
                + ") "
                + ("taught by " + lecturer_name if lecturer_name else "")
            ),
        }
    elif resource == "classes":
        class_session = Class.objects.get(id=id)
        return {
            "name": class_session.title,
            "description": (class_session.title + " (" + class_session.course.name + ")"),
        }
    elif resource == "attendance":
        attendance = Attendance.objects.get(id=id)
        return {
            "name": attendance.student.get_full_name() + " - " + attendance.class_session.title,
            "description": (attendance.student.get_full_name() + " - " + attendance.class_session.title + " (" + attendance.class_session.course.name + ")"),
        }
    elif resource == "audit-logs":
        audit_log = AuditLog.objects.get(id=id)
        return {
            "name": audit_log.action.title() + " " + audit_log.resource.title(),
            "description": (
                "Audit log for "
                + audit_log.action.title()
                + " "
                + audit_log.resource.title()
            ),
        }
    elif resource == "tests":
        test = Test.objects.get(id=id)
        return {
            "name": test.title,
            "description": (test.title + " (" + test.course.name + ")"),
        }
    elif resource == "submissions":
        submission = Submission.objects.get(id=id)
        return {
            "name": submission.test.title,
            "description": (submission.test.title + " (" + submission.student.get_full_name() + ")"),
        }
    else:
        raise ValueError(f"Invalid resource: {resource}")
