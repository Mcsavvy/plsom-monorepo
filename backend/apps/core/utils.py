from typing import TypedDict
from django.contrib.contenttypes.models import ContentType


def get_content_type(resource: str) -> ContentType:
    from apps.invitations.models import Invitation
    from apps.cohorts.models import Cohort
    from apps.users.models import User
    from apps.cohorts.models import Enrollment
    from apps.core.models import AuditLog
    from apps.courses.models import Course

    resource_map = {
        "users": User,
        "cohorts": Cohort,
        "students": User,
        "staff": User,
        "courses": Course,
        "enrollments": Enrollment,
        "invitations": Invitation,
        "audit-logs": AuditLog,
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
    else:
        raise ValueError(f"Invalid resource: {resource}")
