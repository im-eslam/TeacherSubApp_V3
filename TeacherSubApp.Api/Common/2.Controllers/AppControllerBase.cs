using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Common.Controllers
{
    [ApiController]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesErrorResponseType(typeof(ErrorResponse))]
    public abstract class AppControllerBase : ControllerBase
    {
        protected readonly ILogger Logger;

        protected AppControllerBase(ILogger logger)
        {
            Logger = logger;
        }

        protected IActionResult HandleResult<T>(Result<T> result)
        {
            if (result.IsSuccess)
                return Ok(result.Value);

            return _ProcessFailure(result);
        }

        protected IActionResult HandleResult(Result result)
        {
            if (result.IsSuccess)
                return NoContent();

            return _ProcessFailure(result);
        }

        private IActionResult _ProcessFailure(Result result)
        {
            ErrorResponse errorPayload = ErrorResponse.From(result.Error);

            _LogFailure(result);

            return _MapErrorToActionResult(result.ErrorType, errorPayload);
        }

        #region ==== Helper Methods ====

        private void _LogFailure(Result result)
        {
            var path = HttpContext.Request.Path;

            switch (result.ErrorType)
            {
                case ErrorType.Validation:
                    Logger.LogInformation("Validation failure [{Code}]: {Message} | Path: {Path}",
                        result.ErrorCode, result.ErrorMessageEn, path);
                    break;

                case ErrorType.NotFound:
                    Logger.LogInformation("Resource not found [{Code}]: {Message} | Path: {Path}",
                        result.ErrorCode, result.ErrorMessageEn, path);
                    break;

                case ErrorType.Conflict:
                    Logger.LogWarning("Conflict [{Code}]: {Message} | Path: {Path}",
                        result.ErrorCode, result.ErrorMessageEn, path);
                    break;

                case ErrorType.Unauthorized:
                case ErrorType.Forbidden:
                    Logger.LogWarning("Auth failure [{Code}]: {Message} | Path: {Path}", result.ErrorCode, result.ErrorMessageEn, path);
                    break;

                case ErrorType.Failure:
                    Logger.LogError("Business logic failure [{Code}]: {Message} | Path: {Path}", result.ErrorCode, result.ErrorMessageEn, path);
                    break;

                default:
                    Logger.LogError("Unhandled ResultType in HandleResult | Path: {Path}", path);
                    break;
            }
        }

        private IActionResult _MapErrorToActionResult(ErrorType errorType, ErrorResponse payload)
        {
            return errorType switch
            {
                ErrorType.Validation => BadRequest(payload),
                ErrorType.NotFound => NotFound(payload),
                ErrorType.Conflict => Conflict(payload),
                ErrorType.Unauthorized => Unauthorized(payload), 
                ErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, payload), 

                ErrorType.Failure => StatusCode(StatusCodes.Status500InternalServerError, payload),
                _ => StatusCode(StatusCodes.Status500InternalServerError, payload)
            };
        }

        #endregion
    }
}