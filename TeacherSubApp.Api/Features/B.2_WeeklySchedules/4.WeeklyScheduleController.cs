using Microsoft.AspNetCore.Mvc;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Controllers;
using TeacherSubApp.Api.Common.Results;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;
using TeacherSubApp.Api.Features.WeeklySchedules.Results;
using static TeacherSubApp.Api.Features.WeeklySchedules.Dtos.WeeklyScheduleWriteDtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    [Route("api/schedules")]
    public class WeeklyScheduleController : AppControllerBase
    {
        private readonly IWeeklyScheduleService _service;

        public WeeklyScheduleController(IWeeklyScheduleService service,ILogger<WeeklyScheduleController> logger) : base(logger)
        {
            _service = service;
        }

        [HttpGet("grid")]
        [ProducesResponseType(typeof(WeeklyScheduleGridDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetGrid([FromQuery] WeeklyScheduleQuery query)
        {
            var result = await _service.GetGridAsync(query);
            return HandleResult(result);
        }

        [HttpPut("bulk")]
        public async Task<IActionResult> BulkUpdate([FromBody] WeeklyScheduleBulkUpdateDto dto)
        {
            var result = await _service.BulkUpdateAsync(dto);

            if (result.IsSuccess)
                return NoContent();

            var errorPayload = new BulkErrorResponse(
                result.ErrorCode,
                result.ErrorMessageEn,
                result.ErrorMessageAr,
                HttpContext.TraceIdentifier,
                result.Errors.Select(e => ErrorResponse.FromError(e)).ToList()
            );

            Logger.LogWarning("Bulk Update Validation Failed. Errors: {Count} | Path: {Path}",
                result.Errors.Count, HttpContext.Request.Path);

            return result.ErrorType switch
            {
                ErrorType.Validation => BadRequest(errorPayload),
                ErrorType.NotFound => NotFound(errorPayload),
                ErrorType.Conflict => Conflict(errorPayload),
                _ => StatusCode(StatusCodes.Status500InternalServerError, errorPayload)
            };
        }
    }
}
