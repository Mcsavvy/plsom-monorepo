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
    
    # Theme Colors based on PLSOM Style Guide
    "COLORS": {
        "primary": {
            "50": "183 233 255",   # Primary 300 - Light blue
            "100": "78 136 202",   # Primary 200 - Medium blue  
            "200": "78 136 202",
            "300": "78 136 202",
            "400": "78 136 202",
            "500": "0 91 153",     # Primary 100 - Deep blue
            "600": "0 72 122",     # Darker variant
            "700": "0 61 102",
            "800": "0 46 77",
            "900": "0 31 51",
            "950": "0 20 33"
        },
        "gray": {
            "50": "245 245 245",   # BG 100
            "100": "235 235 235",  # BG 200
            "200": "194 194 194",  # BG 300
            "300": "155 155 155",
            "400": "92 92 92",     # Text 200
            "500": "51 51 51",     # Text 100
            "600": "51 51 51",
            "700": "38 38 38",
            "800": "26 26 26",
            "900": "15 22 38",     # Dark BG 100
            "950": "30 36 54"      # Dark BG 200
        }
    },
    
    # Custom styling
    "STYLES": [
        # lambda request: "/static/admin/css/plsom-admin.css",
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
                        "icon": "user", 
                        "link": "/admin/users/user/",
                        "badge": "users.User|length"
                    },
                    {
                        "title": "Invitations", 
                        "icon": "mail", 
                        "link": "/admin/invitations/invitation/",
                        "badge": "invitations.Invitation|length:unused"
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
                        "icon": "users", 
                        "link": "/admin/cohorts/cohort/"
                    },
                    {
                        "title": "Courses", 
                        "icon": "book-open", 
                        "link": "/admin/courses/course/"
                    },
                    {
                        "title": "Course Assignments", 
                        "icon": "user-plus", 
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
                        "icon": "calendar", 
                        "link": "/admin/classes/class/"
                    },
                    {
                        "title": "Attendance", 
                        "icon": "check-circle", 
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
                        "icon": "clipboard-check", 
                        "link": "/admin/assessments/test/"
                    },
                    {
                        "title": "Submissions", 
                        "icon": "file-text", 
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
                        "icon": "activity", 
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