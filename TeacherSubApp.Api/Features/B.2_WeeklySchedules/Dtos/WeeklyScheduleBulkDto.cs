using System.ComponentModel.DataAnnotations;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    // Update
    public sealed record WeeklyScheduleUpdateEntry
    {
        [Required]
        public int Id { get; init; }

        [Required]
        public WeeklyScheduleWriteDto Payload { get; init; } = null!;
    }

    // Swap
    public sealed record SlotCoordinate
    {
        [Required]
        public int TeacherId { get; init; }

        [Range(1, 5, ErrorMessage = WeeklyScheduleErrors.Validation.DayOfWeekInvalid)]
        public int DayOfWeek { get; init; }

        [Range(1, 7, ErrorMessage = WeeklyScheduleErrors.Validation.PeriodNumberInvalid)]
        public int PeriodNumber { get; init; }
    }

    public sealed record WeeklyScheduleSwapEntry
    {
        [Required]
        public SlotCoordinate SlotA { get; init; } = null!;

        [Required]
        public SlotCoordinate SlotB { get; init; } = null!;
    }

    // Grouping
    public sealed record WeeklyScheduleBulkEditRequest
    {
        public List<WeeklyScheduleWriteDto> Creates { get; init; } = new();
        public List<WeeklyScheduleUpdateEntry> Updates { get; init; } = new();
        public List<int> Deletes { get; init; } = new();
        public List<WeeklyScheduleSwapEntry> Swaps { get; init; } = new();

        public bool HasAnyOperations => Creates.Count > 0 || Updates.Count > 0 || Deletes.Count > 0 || Swaps.Count > 0;
    }
}