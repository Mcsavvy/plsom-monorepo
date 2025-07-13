from django.db import models
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.users.models import User


class Cohort(models.Model):
    name = models.CharField(max_length=100)
    program_type = models.CharField(max_length=20, choices=User.PROGRAM_TYPES)
    is_active = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True)

    class Meta:
        ordering = ['-start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['name'],
                name='unique_cohort_name'
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.program_type}"
    
    @property
    def is_started(self):
        """Check if cohort has started"""
        return self.start_date <= timezone.now().date()
    
    @property
    def is_ended(self):
        """Check if cohort has ended"""
        return self.end_date and self.end_date < timezone.now().date()
    
    @property
    def is_current(self):
        """Check if cohort is currently running"""
        today = timezone.now().date()
        return (self.start_date <= today and 
                (not self.end_date or self.end_date >= today))
    
    @property
    def duration_days(self):
        """Get cohort duration in days"""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return None
    
    @property
    def enrolled_students_count(self):
        """Get count of enrolled students"""
        return self.enrollment_set.count()
    
    def clean(self):
        """Model-level validation"""
        super().clean()
        
        # End date must be after start date
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': 'End date must be after start date.'
            })
        
        # Validate cohort duration
        if self.start_date and self.end_date:
            duration = self.end_date - self.start_date
            if duration.days < 30:
                raise ValidationError({
                    'end_date': 'Cohort duration must be at least 30 days.'
                })
            if duration.days > 730:
                raise ValidationError({
                    'end_date': 'Cohort duration cannot exceed 2 years.'
                })
        
        # Cannot activate ended cohort
        if self.is_active and self.is_ended:
            raise ValidationError({
                'is_active': 'Cannot activate a cohort that has already ended.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to ensure business rules"""
        self.clean()
        super().save(*args, **kwargs)
    
    def can_be_deleted(self):
        """Check if cohort can be safely deleted"""
        # Cannot delete if has enrolled students
        if self.enrollment_set.exists():
            return False, "Cannot delete cohort with enrolled students"
        
        # Cannot delete if active
        if self.is_active:
            return False, "Cannot delete active cohort"
        
        # Cannot delete if has started
        if self.is_started:
            return False, "Cannot delete cohort that has already started"
        
        # Check for associated classes
        try:
            from apps.classes.models import Class
            if Class.objects.filter(cohort=self).exists():
                return False, "Cannot delete cohort with associated classes"
        except ImportError:
            pass
        
        # Check for associated assessments
        try:
            from apps.assessments.models import Test
            if Test.objects.filter(cohort=self).exists():
                return False, "Cannot delete cohort with associated assessments"
        except (ImportError, AttributeError):
            pass
        
        return True, "Cohort can be deleted"
    
    def can_be_archived(self):
        """Check if cohort can be archived"""
        if not self.is_active:
            return False, "Cannot archive inactive cohort"
        
        if not self.is_started:
            return False, "Cannot archive cohort that hasn't started yet"
        
        if self.is_ended:
            return False, "Cohort has already ended"
        
        return True, "Cohort can be archived"
    
    def archive(self):
        """Archive the cohort"""
        can_archive, message = self.can_be_archived()
        if not can_archive:
            raise ValidationError(message)
        
        self.end_date = timezone.now().date()
        self.is_active = False
        self.save()
        
        return self


class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'cohort'],
                name='unique_student_cohort_enrollment'
            )
        ]

    def __str__(self):
        return f"{self.student.email} - {self.cohort.name}"
    
    def clean(self):
        """Model-level validation"""
        super().clean()
        
        if self.student and self.cohort:
            # Student program type should match cohort program type
            if self.student.program_type != self.cohort.program_type:
                raise ValidationError(
                    f"Student's program type ({self.student.program_type}) "
                    f"does not match cohort's program type ({self.cohort.program_type})"
                )

    def save(self, *args, **kwargs):
        """Override save to ensure business rules"""
        self.clean()
        super().save(*args, **kwargs)
