using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public interface IWeeklyScheduleService
    {
        // READ
        Task<Result<List<WeeklyScheduleReadDto>>> GetAllAsync(WeeklyScheduleQuery query);
        Task<Result<WeeklyScheduleReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<WeeklyScheduleReadDto>> CreateAsync(WeeklyScheduleWriteDto dto);
        Task<Result<WeeklyScheduleReadDto>> UpdateAsync(int id, WeeklyScheduleWriteDto dto);
        Task<Result> DeleteAsync(int id);

        // SWAP
        Task<Result> SwapAsync(SlotCoordinate slotA, SlotCoordinate slotB);

        // BULK EDIT
        Task<Result> BulkEditAsync(WeeklyScheduleBulkEditRequest request);
    }
}
