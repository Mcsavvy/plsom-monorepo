from functools import wraps
from types import MethodType
from typing import Type, TypeVar
from rest_framework import permissions
from django.http import HttpRequest

from apps.users.models import User

PermissionT = TypeVar("PermissionT", bound=Type[permissions.BasePermission])


class Request(HttpRequest):
    """A request that has a user"""

    user: User


def only_authenticated(cls: PermissionT) -> PermissionT:
    """wrap a permission class to only allow authenticated users"""

    def method_wrapper(method: MethodType) -> MethodType:
        @wraps(method)
        def wrapper(self, request: Request, *args, **kwargs):
            view = kwargs.get("view")
            if not view and len(args) > 0:
                view = args[0]
            if not view:
                raise ValueError("View is required")
            if not permissions.IsAuthenticated.has_permission(
                self, request, view
            ):
                return False
            return method(self, request, *args, **kwargs)

        return wrapper  # type: ignore

    cls.has_permission = method_wrapper(cls.has_permission)
    cls.has_object_permission = method_wrapper(cls.has_object_permission)
    return cls


@only_authenticated
class IsAdmin(permissions.BasePermission):
    """Check if a user is an admin"""

    def has_permission(self, request: Request, view):
        user = request.user
        return any(
            (
                user.is_superuser,
                user.is_staff,
                user.role.lower() == "admin",
            )
        )


@only_authenticated
class IsLecturer(permissions.BasePermission):
    """Check if a user is a lecturer"""

    def has_permission(self, request: Request, view):
        user = request.user
        return any(
            (
                IsAdmin.has_permission(self, request, view),
                user.role.lower() == "lecturer",
            )
        )


@only_authenticated
class IsStaff(permissions.BasePermission):
    """Check if a user is a staff"""

    def has_permission(self, request: Request, view):
        user = request.user
        return any(
            (
                user.is_superuser,
                user.is_staff,
                user.role.lower() in ["lecturer", "admin"],
            )
        )


@only_authenticated
class IsStudent(permissions.BasePermission):
    """Check if a user is a student"""

    def has_permission(self, request: Request, view):
        user = request.user
        return user.role.lower() == "student"


@only_authenticated
class IsLecturerOrAdmin(permissions.BasePermission):
    """Check if a user is a lecturer or admin"""

    def has_permission(self, request: Request, view):
        user = request.user
        return any(
            (
                user.is_superuser,
                user.is_staff,
                user.role.lower() in ["lecturer", "admin"],
            )
        )


@only_authenticated
class IsStudentOrReadOnly(permissions.BasePermission):
    """Allow students to read only, lecturers/admins full access"""

    def has_permission(self, request: Request, view):
        user = request.user

        # Read-only access for students
        if user.role.lower() == "student":
            return request.method in permissions.SAFE_METHODS

        # Full access for lecturers and admins
        return user.role.lower() in ["lecturer", "admin"] or user.is_superuser


@only_authenticated
class IsOwnerOrLecturer(permissions.BasePermission):
    """Allow object access to owners (students for their own submissions) or lecturers/admins"""

    def has_object_permission(self, request: Request, view, obj):
        user = request.user

        # Lecturers and admins have full access
        if user.role.lower() in ["lecturer", "admin"] or user.is_superuser:
            return True

        # Students can only access their own objects
        if user.role.lower() == "student":
            # Check if object has a student field or is related to the user
            if hasattr(obj, "student"):
                return obj.student == user
            elif hasattr(obj, "user"):
                return obj.user == user

        return False
