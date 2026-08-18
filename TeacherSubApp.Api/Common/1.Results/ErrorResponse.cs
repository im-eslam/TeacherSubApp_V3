namespace TeacherSubApp.Api.Common.Results
{
    public record ErrorResponse(
        string ErrorCode,
        string ErrorMessageEn,
        string ErrorMessageAr,
        string? TraceId = null
    )
    {
        public static ErrorResponse From(Error error, string? traceId = null)
        {
            return new ErrorResponse(error.Code, error.MessageEn, error.MessageAr, traceId);
        }
    }
}
