from utils.permissions import only_authenticated, IsAdmin, IsLecturer
from rest_framework.permissions import BasePermission, SAFE_METHODS


@only_authenticated
class IsMeOrStaffCanRead(BasePermission):
    """
    Custom permission to:
    - Allow admin/lecturer to read any user.
    - Allow user to read their own details.
    - Allow user to update their own details.
    - Prevent admin/lecturer from updating other user's details.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return (
                IsAdmin.has_permission(self, request, view)
                or IsLecturer.has_permission(self, request, view)
                or obj == request.user
            )
        return obj == request.user
