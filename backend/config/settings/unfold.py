from django.templatetags.static import static
from decouple import config


def get_environment_display(request):
    """Return environment badge for admin header"""
    from django.conf import settings

    env = settings.DJANGO_ENV
    if env == "production":
        return ["PRODUCTION", "danger"]
    return ["DEVELOP", "success"]


UNFOLD = {
    "SITE_TITLE": "PLSOM Admin",
    "SITE_HEADER": "PLSOM",
    "SITE_SUBHEADER": "Perfect Love School Of Ministry",
    "SITE_ICON": lambda request: static("favicon.ico"),
    "SITE_LOGO": lambda request: static("logo.png"),
    "SITE_FAVICONS": [
        {
            "rel": "icon",
            "type": "image/x-icon",
            "href": lambda request: static("favicon.ico"),
        },
    ],
    "SITE_URL": "/",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "SITE_DROPDOWN": [
        {
            "icon": "diamond",
            "title": "APP",
            "link": config("FRONTEND_URL", default="https://plsom.com"),
        },
    ],
    # Sidebar Configuration
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Dashboard",
                "separator": True,
                "items": [
                    {"title": "Overview", "icon": "home", "link": "/"},
                ],
            },
            {
                "title": "User Management",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Users",
                        "icon": "person",
                        "link": "/users/user/",
                    },
                    {
                        "title": "Invitations",
                        "icon": "mail",
                        "link": "/invitations/invitation/",
                    },
                    {
                        "title": "Groups",
                        "icon": "group",
                        "link": "/auth/group/",
                    },
                    {
                        "title": "Permissions",
                        "icon": "lock",
                        "link": "/auth/permission/",
                    },
                ],
            },
            {
                "title": "Academic Management",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Cohorts",
                        "icon": "group",
                        "link": "/cohorts/cohort/",
                    },
                    {
                        "title": "Courses",
                        "icon": "book_ribbon",
                        "link": "/courses/course/",
                    },
                    {
                        "title": "Course Assignments",
                        "icon": "person_add",
                        "link": "/courses/courseassignment/",
                    },
                ],
            },
            {
                "title": "Classes & Sessions",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Classes",
                        "icon": "event",
                        "link": "/classes/class/",
                    },
                    {
                        "title": "Attendance",
                        "icon": "person_check",
                        "link": "/classes/attendance/",
                    },
                ],
            },
            {
                "title": "Assessments",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Tests",
                        "icon": "assignment",
                        "link": "/assessments/test/",
                    },
                    {
                        "title": "Submissions",
                        "icon": "assignment_returned",
                        "link": "/assessments/submission/",
                    },
                ],
            },
            {
                "title": "System",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Email Templates",
                        "icon": "mail",
                        "link": "/core/emailtemplate/",
                    },
                    {
                        "title": "System Logs",
                        "icon": "browse_activity",
                        "link": "/core/auditlog/",
                    },
                    {
                        "title": "Queue Tasks",
                        "icon": "queue",
                        "link": "/django_q/ormq/",
                    },
                    {
                        "title": "Scheduled Tasks",
                        "icon": "schedule",
                        "link": "/django_q/schedule/",
                    },
                ],
            },
        ],
    },
    # Custom actions
    # "DASHBOARD_CALLBACK": "utils.admin.dashboard_callback",
    # Environment badge
    "ENVIRONMENT": "config.settings.unfold.get_environment_display",
    # Custom tabs
    "TABS": [
        {
            "models": [
                "users.user",
            ],
            "items": [
                {
                    "title": "Profile",
                    "icon": "user",
                    "link": "{path}",
                },
                {
                    "title": "Groups",
                    "icon": "group",
                    "link": "/auth/group/",
                },
                {
                    "title": "Permissions",
                    "icon": "lock",
                    "link": "/auth/permission/",
                },
                {
                    "title": "Enrollments",
                    "icon": "book",
                    "link": "/cohorts/enrollment/?student__id__exact={id}",
                },
            ],
        },
        {
            "models": [
                "courses.course",
            ],
            "items": [
                {
                    "title": "Course Details",
                    "icon": "book-open",
                    "link": "{path}",
                },
                {
                    "title": "Classes",
                    "icon": "calendar",
                    "link": "/classes/class/?course__id__exact={id}",
                },
                {
                    "title": "Tests",
                    "icon": "clipboard-check",
                    "link": "/assessments/test/?course__id__exact={id}",
                },
            ],
        },
    ],
}
