namespace TeacherSubApp.Api.Common.Results
{
    public sealed record ErrorResponse
    {
        public string ErrorCode { get; }
        public string ErrorMessageEn { get; }
        public string ErrorMessageAr { get; }
        public string? TraceId { get; }

        private ErrorResponse (string errorCode, string errorMessageEn, string errorMessageAr, string? traceId)
        {
            ErrorCode = errorCode;
            ErrorMessageEn = errorMessageEn;
            ErrorMessageAr = errorMessageAr;
            TraceId = traceId;
        }

        public static ErrorResponse FromError (Error error, string? traceId = null)
        {
            ArgumentNullException.ThrowIfNull(error, nameof(error));

            return new ErrorResponse(
                error.Code,
                error.MessageEn,
                error.MessageAr,
                string.IsNullOrWhiteSpace(traceId) ? null : traceId.Trim()
            );
        }
    }
}