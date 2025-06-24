from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.cohorts.models import Enrollment


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = user.role
        token["program_type"] = user.program_type
        # Get cohort from latest enrollment if student
        cohort = None
        if user.role == "student":
            enrollment = (
                Enrollment.objects.filter(student=user)
                .order_by("-enrolled_at")
                .first()
            )
            if enrollment:
                cohort = enrollment.cohort_id
        token["cohort"] = cohort
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data["role"] = user.role
        data["program_type"] = user.program_type
        cohort = None
        if user.role == "student":
            enrollment = (
                Enrollment.objects.filter(student=user)
                .order_by("-enrolled_at")
                .first()
            )
            if enrollment:
                cohort = enrollment.cohort_id
        data["cohort"] = cohort
        return data
