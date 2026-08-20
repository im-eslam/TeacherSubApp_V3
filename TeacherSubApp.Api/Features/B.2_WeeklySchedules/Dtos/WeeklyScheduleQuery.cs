namespace TeacherSubApp.Api.Features.WeeklySchedules.Dtos
{
    public sealed record WeeklyScheduleQuery
    {
        public int? TeacherId { get; init; }
        public int? ClassId { get; init; }
        public int? EventId { get; init; }
        public int? DayOfWeek { get; init; }
        public int? PeriodNumber { get; init; }
    }
}