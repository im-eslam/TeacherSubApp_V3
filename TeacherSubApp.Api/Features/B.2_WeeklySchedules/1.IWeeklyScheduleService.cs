using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;
using TeacherSubApp.Api.Features.WeeklySchedules.Results;
using static TeacherSubApp.Api.Features.WeeklySchedules.Dtos.WeeklyScheduleWriteDtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public interface IWeeklyScheduleService
    {
        Task<Result<WeeklyScheduleGridDto>> GetGridAsync(WeeklyScheduleQuery query);

        Task<BulkUpdateResult> BulkUpdateAsync(WeeklyScheduleBulkUpdateDto dto);
    }
}
