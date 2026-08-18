using static TeacherSubApp.Api.Features.WeeklySchedules.Dtos.WeeklyScheduleWriteDtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Models
{
    public class ValidatedRequestState
    {
        public HashSet<int> EditIds { get; } = new();
        public HashSet<int> DeleteIds { get; } = new();
        public HashSet<int> SwapIds { get; } = new();

        public List<WeeklyScheduleAddDto> ValidAdds { get; } = new();
        public List<WeeklyScheduleEditDto> ValidEdits { get; } = new();
        public List<int> ValidDeletes { get; } = new();
        public List<WeeklyScheduleSwapDto> ValidSwaps { get; } = new();

        public HashSet<int> TouchedSlotIds { get; } = new();
    }
}
