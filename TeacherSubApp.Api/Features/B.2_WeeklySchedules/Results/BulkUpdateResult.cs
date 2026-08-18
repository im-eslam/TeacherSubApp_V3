using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Results
{
    public record BulkUpdateResult : Result
    {
        public List<Error> Errors { get; init; } = new();

        public static new BulkUpdateResult Success()
        {
            return new() { IsSuccess = true };
        }

        public static BulkUpdateResult Failure(ErrorType errorType, Error generalError ,List<Error> errorsList)
        {
            if (errorsList is null || errorsList.Count == 0)
                throw new InvalidOperationException("Cannot create a failed BulkUpdateResult with an empty errors list.");

            return new()
            {
                IsSuccess = false,
                ErrorType = errorType,
                Error = generalError,
                Errors = errorsList
            };
        }
    }
}
