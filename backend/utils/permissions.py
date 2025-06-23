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
            if not permissions.IsAuthenticated.has_permission(
                self, request, *args, **kwargs
            ):
                return False
            return method(self, request, *args, **kwargs)

        return wrapper # type: ignore

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
class IsStudent(permissions.BasePermission):
    """Check if a user is a student"""

    def has_permission(self, request: Request, view):
        user = request.user
        return user.role.lower() == "student"
