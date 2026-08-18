namespace TeacherSubApp.Api.Features.WeeklySchedules.Models
{
    public class ProjectedSlot
    {
        public int? Id { get; init; }
        public required int TeacherId { get; init; }
        public required string TeacherName { get; init; }
        public required int DayOfWeek { get; init; }
        public required int PeriodNumber { get; init; }
        public int? ClassId { get; set; }
        public int? EventId { get; set; }
        public bool IsDeleted { get; set; }

        public string? ClassDisplayName { get; set; }
        public string? EventName { get; set; }
        public bool EventIsSupport { get; set; }
        public bool EventIsStandby { get; set; }
    }
}
