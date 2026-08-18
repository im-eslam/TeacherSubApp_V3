using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Results
{
    public record BulkErrorResponse(
        string ErrorCode,
        string ErrorMessageEn,
        string ErrorMessageAr,
        string? TraceId,
        List<ErrorResponse> DetailedErrors
    );
}
