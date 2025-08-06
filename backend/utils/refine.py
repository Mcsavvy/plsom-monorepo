# pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.core.paginator import InvalidPage
from rest_framework.exceptions import NotFound
from django.db.models import Q
from rest_framework import filters

# DRF-Spectacular imports
try:
    from drf_spectacular.utils import OpenApiParameter
    from drf_spectacular.types import OpenApiTypes
    from drf_spectacular.openapi import AutoSchema

    HAS_SPECTACULAR = True
except ImportError:
    HAS_SPECTACULAR = False


class RefineDataProviderPagination(PageNumberPagination):
    """
    Custom pagination class for Refine data provider compatibility.

    Handles:
    - _start/_end pagination parameters
    - _sort/_order sorting parameters
    - x-total-count header
    - Custom filtering with operators (_like, _gte, _lte, _ne)
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        """
        Return a paginated response with the x-total-count header.
        """
        return Response(
            {
                "results": data,
                "count": self.page.paginator.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
            },
            headers={
                "x-total-count": str(self.page.paginator.count),
                "Access-Control-Expose-Headers": "x-total-count",
            },
        )

    def paginate_queryset(self, queryset, request, view=None):
        """
        Paginate a queryset using _start/_end parameters.
        """
        # Set request instance for get_next_link and get_previous_link methods
        self.request = request

        # Get _start and _end parameters from the request
        start = request.query_params.get("_start")
        end = request.query_params.get("_end")

        if start is not None and end is not None:
            try:
                start = int(start)
                end = int(end)

                # Calculate page number and page size from _start/_end
                page_size = end - start
                page_number = (start // page_size) + 1 if page_size > 0 else 1

                # Set the page size for this request
                self.page_size = min(page_size, self.max_page_size)

                # Get the page
                paginator = self.django_paginator_class(
                    queryset, self.page_size
                )
                page_number = self.get_page_number(request, paginator)

                try:
                    self.page = paginator.page(page_number)
                except InvalidPage as exc:
                    msg = self.invalid_page_message.format(
                        page_number=page_number, message=str(exc)
                    )
                    raise NotFound(msg)

                if (
                    paginator.count > 0
                    and self.page.start_index() > paginator.count
                ):
                    raise NotFound(
                        self.invalid_page_message.format(
                            page_number=page_number, message="Invalid page"
                        )
                    )

                return list(self.page)
            except ValueError:
                # If _start/_end are not valid integers, fall back to regular pagination
                pass

        # Fall back to regular pagination if _start/_end not provided
        return super().paginate_queryset(queryset, request, view)

    def get_page_number(self, request, paginator):
        """
        Calculate page number from _start/_end parameters.
        """
        start = request.query_params.get("_start")
        end = request.query_params.get("_end")

        if start is not None and end is not None:
            try:
                start = int(start)
                end = int(end)
                page_size = end - start
                return (start // page_size) + 1 if page_size > 0 else 1
            except ValueError:
                pass

        return super().get_page_number(request, paginator)


class RefineDataProviderFilter(filters.BaseFilterBackend):
    """
    Custom filter backend for Refine data provider compatibility.

    Handles:
    - _sort/_order parameters for sorting
    - Custom filter operators (_like, _gte, _lte, _ne)
    - 'q' parameter for search
    """

    def filter_queryset(self, request, queryset, view):
        """
        Apply filtering based on query parameters.
        """
        # Handle sorting
        queryset = self.apply_sorting(request, queryset, view)

        # Handle filtering
        queryset = self.apply_filtering(request, queryset, view)

        return queryset

    def apply_sorting(self, request, queryset, view):
        """
        Apply sorting based on _sort and _order parameters.
        """
        sort_fields = request.query_params.get("_sort")
        sort_orders = request.query_params.get("_order")

        if sort_fields and sort_orders:
            fields = sort_fields.split(",")
            orders = sort_orders.split(",")

            ordering = []
            for field, order in zip(fields, orders):
                if order.lower() == "desc":
                    ordering.append(f"-{field}")
                else:
                    ordering.append(field)

            if ordering:
                queryset = queryset.order_by(*ordering)

        return queryset

    def apply_filtering(self, request, queryset, view):
        """
        Apply filtering based on various operators, with support for a 'filterable_fields' whitelist.
        """
        search_fields = getattr(view, "search_fields", [])
        filterable_fields = getattr(view, "filterable_fields", None)

        # Handle 'q' parameter for global search
        q = request.query_params.get("q")
        if q and search_fields:
            search_query = Q()
            for field in search_fields:
                search_query |= Q(**{f"{field}__icontains": q})
            queryset = queryset.filter(search_query)

        filter_kwargs = {}
        exclude_kwargs = {}

        # Handle other filter parameters
        for param, value in request.query_params.items():
            if param in [
                "_start",
                "_end",
                "_sort",
                "_order",
                "q",
                "page",
                "page_size",
            ]:
                continue

            field, operator = self.parse_filter_param(param)

            if not (field and value):
                continue

            # If a whitelist is defined on the view, only allow filtering on those fields.
            if filterable_fields is not None and field not in filterable_fields:
                continue

            # Handle 'not equal' operator by adding to exclude_kwargs
            if operator == "ne":
                exclude_kwargs[field] = self.convert_value_for_field(
                    queryset.model, field, value
                )
            else:
                # For all other operators, build a filter dictionary
                kwargs = self.build_filter_kwargs(
                    queryset.model, field, operator, value
                )
                if kwargs:
                    filter_kwargs.update(kwargs)

        # Apply collected filters and excludes
        if filter_kwargs:
            queryset = queryset.filter(**filter_kwargs)
        if exclude_kwargs:
            queryset = queryset.exclude(**exclude_kwargs)

        return queryset

    def parse_filter_param(self, param):
        """
        Parse filter parameter to extract field and operator.
        Supports: _like, _gte, _lte, _ne, _in, _isnull
        """
        if param.endswith("_like"):
            return param[:-5], "like"
        elif param.endswith("_gte"):
            return param[:-4], "gte"
        elif param.endswith("_lte"):
            return param[:-4], "lte"
        elif param.endswith("_ne"):
            return param[:-3], "ne"
        elif param.endswith("_in"):
            return param[:-3], "in"
        elif param.endswith("_isnull"):
            return param[:-7], "isnull"
        else:
            return param, "eq"

    def convert_value_for_field(self, model, field_name, value):
        """
        Convert string values to appropriate Python types based on field type.
        """
        try:
            field = model._meta.get_field(field_name)
            from django.db import models

            # Handle BooleanField
            if isinstance(field, models.BooleanField):
                if str(value).lower() in ["true", "1", "yes", "on"]:
                    return True
                elif str(value).lower() in ["false", "0", "no", "off"]:
                    return False
                else:
                    # If it's not a recognized boolean string, return original value
                    return value

            # Add more field type conversions here if needed in the future
            # elif isinstance(field, models.IntegerField):
            #     return int(value)
            # elif isinstance(field, models.FloatField):
            #     return float(value)

        except (models.FieldDoesNotExist, ValueError, TypeError):
            # If field doesn't exist or conversion fails, return original value
            pass

        return value

    def build_filter_kwargs(self, model, field, operator, value):
        """
        Build Django filter kwargs based on operator.
        'ne' is handled separately using .exclude()
        """
        # Convert value based on field type
        converted_value = self.convert_value_for_field(model, field, value)

        if operator == "like":
            return {f"{field}__icontains": converted_value}
        elif operator == "gte":
            return {f"{field}__gte": converted_value}
        elif operator == "lte":
            return {f"{field}__lte": converted_value}
        elif operator == "eq":
            return {field: converted_value}
        elif operator == "in":
            # Assumes value is a comma-separated string
            values = [v.strip() for v in value.split(",") if v.strip()]
            # Convert each value in the list
            converted_values = [
                self.convert_value_for_field(model, field, v) for v in values
            ]
            if converted_values:
                return {f"{field}__in": converted_values}
            return {}
        elif operator == "isnull":
            if str(value).lower() in ["true", "1"]:
                return {f"{field}__isnull": True}
            elif str(value).lower() in ["false", "0"]:
                return {f"{field}__isnull": False}
            return {}
        else:
            return {}

    def validate_field(self, model, field_name):
        """Validate that field exists and is filterable"""
        try:
            model._meta.get_field(field_name)
            return True
        except Exception:
            return False


# DRF-Spectacular Schema Extension
if HAS_SPECTACULAR:

    class RefineDataProviderAutoSchema(AutoSchema):
        """
        Custom AutoSchema for drf-spectacular to document Refine data provider parameters.
        """

        def get_operation_parameters(self, path, method):
            """
            Add custom parameters to the OpenAPI schema.
            """
            parameters = super().get_operation_parameters(path, method)

            if method.upper() == "GET":
                # Add pagination parameters
                parameters.extend(
                    [
                        OpenApiParameter(
                            name="_start",
                            type=OpenApiTypes.INT,
                            location=OpenApiParameter.QUERY,
                            description="Start index for pagination (used with _end)",
                            required=False,
                        ),
                        OpenApiParameter(
                            name="_end",
                            type=OpenApiTypes.INT,
                            location=OpenApiParameter.QUERY,
                            description="End index for pagination (used with _start)",
                            required=False,
                        ),
                        OpenApiParameter(
                            name="_sort",
                            type=OpenApiTypes.STR,
                            location=OpenApiParameter.QUERY,
                            description="Comma-separated list of fields to sort by",
                            required=False,
                        ),
                        OpenApiParameter(
                            name="_order",
                            type=OpenApiTypes.STR,
                            location=OpenApiParameter.QUERY,
                            description="Comma-separated list of sort orders (asc/desc)",
                            required=False,
                        ),
                        OpenApiParameter(
                            name="q",
                            type=OpenApiTypes.STR,
                            location=OpenApiParameter.QUERY,
                            description="Search query across searchable fields",
                            required=False,
                        ),
                    ]
                )

                # Add dynamic filter parameters based on model fields
                if (
                    hasattr(self.target, "queryset")
                    and self.target.queryset is not None
                ):
                    model = self.target.queryset.model
                    for field in model._meta.fields:
                        field_name = field.name

                        # Add basic field filter
                        parameters.append(
                            OpenApiParameter(
                                name=field_name,
                                type=self._get_openapi_type_for_field(field),
                                location=OpenApiParameter.QUERY,
                                description=f"Filter by {field_name}",
                                required=False,
                            )
                        )

                        # Add operator-based filters
                        if field.get_internal_type() in [
                            "CharField",
                            "TextField",
                        ]:
                            parameters.append(
                                OpenApiParameter(
                                    name=f"{field_name}_like",
                                    type=OpenApiTypes.STR,
                                    location=OpenApiParameter.QUERY,
                                    description=f"Filter {field_name} containing text",
                                    required=False,
                                )
                            )

                        if field.get_internal_type() in [
                            "IntegerField",
                            "FloatField",
                            "DecimalField",
                            "DateField",
                            "DateTimeField",
                        ]:
                            parameters.extend(
                                [
                                    OpenApiParameter(
                                        name=f"{field_name}_gte",
                                        type=self._get_openapi_type_for_field(
                                            field
                                        ),
                                        location=OpenApiParameter.QUERY,
                                        description=f"Filter {field_name} greater than or equal to",
                                        required=False,
                                    ),
                                    OpenApiParameter(
                                        name=f"{field_name}_lte",
                                        type=self._get_openapi_type_for_field(
                                            field
                                        ),
                                        location=OpenApiParameter.QUERY,
                                        description=f"Filter {field_name} less than or equal to",
                                        required=False,
                                    ),
                                ]
                            )

                        # Add not equal filter for all fields
                        parameters.append(
                            OpenApiParameter(
                                name=f"{field_name}_ne",
                                type=self._get_openapi_type_for_field(field),
                                location=OpenApiParameter.QUERY,
                                description=f"Filter {field_name} not equal to",
                                required=False,
                            )
                        )

            return parameters

        def _get_openapi_type_for_field(self, field):
            """
            Get the appropriate OpenAPI type for a Django model field.
            """
            field_type = field.get_internal_type()

            type_mapping = {
                "CharField": OpenApiTypes.STR,
                "TextField": OpenApiTypes.STR,
                "EmailField": OpenApiTypes.STR,
                "URLField": OpenApiTypes.STR,
                "SlugField": OpenApiTypes.STR,
                "IntegerField": OpenApiTypes.INT,
                "BigIntegerField": OpenApiTypes.INT,
                "SmallIntegerField": OpenApiTypes.INT,
                "PositiveIntegerField": OpenApiTypes.INT,
                "FloatField": OpenApiTypes.FLOAT,
                "DecimalField": OpenApiTypes.FLOAT,
                "BooleanField": OpenApiTypes.BOOL,
                "DateField": OpenApiTypes.DATE,
                "DateTimeField": OpenApiTypes.DATETIME,
                "TimeField": OpenApiTypes.TIME,
                "UUIDField": OpenApiTypes.UUID,
            }

            return type_mapping.get(field_type, OpenApiTypes.STR)

        def get_response_headers(self, path, method):
            """
            Add custom response headers to the schema.
            """
            headers = super().get_response_headers(path, method)

            if method.upper() == "GET":
                headers["x-total-count"] = {
                    "description": "Total number of items in the collection",
                    "schema": {"type": "integer"},
                }

            return headers


class RefineDataProviderMixin:
    """
    Mixin to add Refine data provider support to DRF views.
    """

    pagination_class = RefineDataProviderPagination
    filter_backends = [RefineDataProviderFilter]

    if HAS_SPECTACULAR:
        schema = RefineDataProviderAutoSchema()

    def get_queryset(self):
        """
        Override to ensure we have a base queryset.
        """
        queryset = super().get_queryset()  # type: ignore
        return queryset
