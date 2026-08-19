using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public interface IWeeklyScheduleService
    {
        Task<Result<List<WeeklyScheduleReadDto>>> GetAllAsync(WeeklyScheduleQuery query);
        Task<Result<WeeklyScheduleReadDto>> GetByIdAsync(int id);
        Task<Result<WeeklyScheduleReadDto>> CreateAsync(WeeklyScheduleWriteDto dto);
        Task<Result<WeeklyScheduleReadDto>> UpdateAsync(int id, WeeklyScheduleWriteDto dto);
        Task<Result> DeleteAsync(int id);
        Task<Result<List<WeeklyScheduleReadDto>>> CreateBulkAsync(IEnumerable<WeeklyScheduleWriteDto> dtos);
        Task<Result<List<WeeklyScheduleReadDto>>> UpdateBulkAsync(IEnumerable<WeeklyScheduleBulkUpdateItem> items);
    }
}
