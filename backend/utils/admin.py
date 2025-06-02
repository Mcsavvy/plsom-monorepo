from django.conf import settings
from django.utils import timezone

def dashboard_callback(request, context):
    """Custom dashboard context for PLSOM admin"""
    from django.contrib.auth import get_user_model
    from apps.cohorts.models import Cohort
    from apps.courses.models import Course
    from apps.classes.models import Class
    from apps.assessments.models import Test
    
    User = get_user_model()
    
    # Get counts for dashboard
    stats = {
        'total_students': User.objects.filter(role='student').count(),
        'total_lecturers': User.objects.filter(role='lecturer').count(), 
        'active_cohorts': Cohort.objects.filter(is_active=True).count(),
        'total_courses': Course.objects.filter(is_active=True).count(),
        'upcoming_classes': Class.objects.filter(
            scheduled_at__gte=timezone.now()
        ).count(),
        'pending_tests': Test.objects.filter(
            is_published=True,
            due_date__gte=timezone.now()
        ).count(),
    }
    
    # Recent activity
    recent_classes = Class.objects.select_related(
        'course', 'lecturer', 'cohort'
    ).order_by('-scheduled_at')[:5]
    
    recent_submissions = Test.objects.filter(
        submission__isnull=False
    ).distinct().order_by('-created_at')[:5]
    
    context.update({
        'plsom_stats': stats,
        'recent_classes': recent_classes, 
        'recent_submissions': recent_submissions,
        'environment': getattr(settings, 'DJANGO_ENV', 'development'),
    })
    
    return context
