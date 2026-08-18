using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Common.Exceptions
{
    public sealed class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            if (exception is DbUpdateException)
            {
                return await _HandleDatabaseErrorAsync(httpContext, exception);
            }

            return await _HandleSystemCrashAsync(httpContext, exception);
        }

        #region === Helper Methods ===

        private async ValueTask<bool> _HandleDatabaseErrorAsync(HttpContext httpContext, Exception exception)
        {
            _logger.LogWarning(exception, "Database error occurred. Path: {Path} | TraceId: {TraceId}",
                httpContext.Request.Path, httpContext.TraceIdentifier);

            ErrorResponse dbError = ErrorResponse.From(GlobalErrors.DatabaseError, httpContext.TraceIdentifier);

            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await _SafeWriteResponseAsync(httpContext, dbError);
            return true;
        }

        private async ValueTask<bool> _HandleSystemCrashAsync(HttpContext httpContext, Exception exception)
        {
            _logger.LogError(exception, "System crash. Path: {Path} | TraceId: {TraceId}",
                httpContext.Request.Path, httpContext.TraceIdentifier);

            ErrorResponse crashError = ErrorResponse.From(GlobalErrors.InternalServerError, httpContext.TraceIdentifier);

            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await _SafeWriteResponseAsync(httpContext, crashError);
            return true;
        }

        private async Task _SafeWriteResponseAsync(HttpContext httpContext, ErrorResponse errorPayload)
        {
            try
            {
                await httpContext.Response.WriteAsJsonAsync(errorPayload, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to write error response. Client likely disconnected. {Message}", ex.Message);
            }
        }

        #endregion
    }
}