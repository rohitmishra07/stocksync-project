"""Custom exception handling for DRF."""

from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Wrap DRF exceptions in a consistent error format."""
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "error": True,
            "status_code": response.status_code,
            "message": _get_error_message(response),
            "details": response.data,
        }
        response.data = error_payload

    return response


def _get_error_message(response):
    """Extract a human-readable message from the response."""
    status_messages = {
        400: "Bad request",
        401: "Authentication required",
        403: "Permission denied",
        404: "Not found",
        405: "Method not allowed",
        429: "Too many requests",
        500: "Internal server error",
    }
    return status_messages.get(response.status_code, "An error occurred")
