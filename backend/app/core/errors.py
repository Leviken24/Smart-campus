"""Consistent error-handling definitions and exception handlers for EcoTwin AI.

Strictly adheres to docs/api-contracts.md standard error envelope.
"""

import logging
from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("ecotwin.errors")


class AppException(Exception):
    """Base application exception with standardized code and status."""

    def __init__(
        self,
        message: str,
        code: str = "APPLICATION_ERROR",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class EntityNotFoundException(AppException):
    """Raised when an entity (building, sensor, observation, scenario) is not found."""

    def __init__(self, message: str, entity_type: str = "RESOURCE"):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"entity_type": entity_type},
        )


class ProviderUnavailableException(AppException):
    """Raised when an external AI provider (Grok or Vision) fails or is unreachable."""

    def __init__(self, message: str, provider: str):
        super().__init__(
            message=message,
            code="PROVIDER_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"provider": provider},
        )


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Any] = None,
) -> JSONResponse:
    """Builds a standardized error envelope matching docs/api-contracts.md."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Registers standard exception handlers with the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
        return create_error_response(
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            details=exc.details,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code_mapping = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            413: "PAYLOAD_TOO_LARGE",
            422: "VALIDATION_ERROR",
            502: "BAD_GATEWAY",
            503: "SERVICE_UNAVAILABLE",
        }
        code = code_mapping.get(exc.status_code, "HTTP_ERROR")
        message = str(exc.detail) if exc.detail else "An HTTP error occurred."
        return create_error_response(status_code=exc.status_code, code=code, message=message)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Simplify validation errors into clear field messages
        formatted_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(item) for item in err.get("loc", []))
            formatted_errors.append({"field": loc, "message": err.get("msg", "Invalid value")})
        return create_error_response(
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            code="VALIDATION_ERROR",
            message="Request payload validation failed.",
            details=formatted_errors,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        # Log internally for operations while keeping response envelope safe
        logger.error("Unhandled server exception: %s", exc, exc_info=True)
        # Never expose stack traces or internal secrets to client
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred. Please contact the administrator.",
            details=None,
        )
