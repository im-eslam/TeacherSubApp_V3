using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Models
{
    public class BulkValidationContext
    {
        public List<Error> Errors { get; } = new();
        public bool HasErrors => Errors.Count > 0;
        public void AddError(Error error)
        {
            Errors.Add(error);
        }
    }
}
