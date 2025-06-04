from django.templatetags.static import static

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
    "SITE_URL": "/",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    
    # Sidebar Configuration
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Dashboard",
                "separator": True,
                "items": [
                    {
                        "title": "Overview", 
                        "icon": "home", 
                        "link": "/admin/"
                    },
                ]
            },
            {
                "title": "User Management",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Users", 
                        "icon": "person", 
                        "link": "/admin/users/user/",
                        # "badge": "users.User|length"
                    },
                    {
                        "title": "Invitations", 
                        "icon": "mail", 
                        "link": "/admin/invitations/invitation/",
                        # "badge": "invitations.Invitation|length:unused"
                    },
                ]
            },
            {
                "title": "Academic Management", 
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Cohorts", 
                        "icon": "group", 
                        "link": "/admin/cohorts/cohort/"
                    },
                    {
                        "title": "Courses", 
                        "icon": "book_ribbon", 
                        "link": "/admin/courses/course/"
                    },
                    {
                        "title": "Course Assignments", 
                        "icon": "person_add", 
                        "link": "/admin/courses/courseassignment/"
                    },
                ]
            },
            {
                "title": "Classes & Sessions",
                "separator": True, 
                "collapsible": True,
                "items": [
                    {
                        "title": "Classes", 
                        "icon": "event", 
                        "link": "/admin/classes/class/"
                    },
                    {
                        "title": "Attendance", 
                        "icon": "person_check", 
                        "link": "/admin/classes/attendance/"
                    },
                ]
            },
            {
                "title": "Assessments",
                "separator": True,
                "collapsible": True, 
                "items": [
                    {
                        "title": "Tests", 
                        "icon": "assignment", 
                        "link": "/admin/assessments/test/"
                    },
                    {
                        "title": "Submissions", 
                        "icon": "assignment_returned", 
                        "link": "/admin/assessments/submission/"
                    },
                ]
            },
            {
                "title": "System",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Email Templates", 
                        "icon": "mail", 
                        "link": "/admin/communications/emailtemplate/"
                    },
                    {
                        "title": "System Logs", 
                        "icon": "browse_activity", 
                        "link": "/admin/logs/"
                    },
                ]
            }
        ]
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
                    "title": "Enrollments", 
                    "icon": "book",
                    "link": "/admin/cohorts/enrollment/?student__id__exact={id}",
                },
            ]
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
                    "link": "/admin/classes/class/?course__id__exact={id}",
                },
                {
                    "title": "Tests",
                    "icon": "clipboard-check",
                    "link": "/admin/assessments/test/?course__id__exact={id}",
                },
            ]
        }
    ]

}