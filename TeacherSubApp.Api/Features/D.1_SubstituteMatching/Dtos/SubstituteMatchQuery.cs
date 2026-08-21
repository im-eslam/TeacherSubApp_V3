namespace TeacherSubApp.Api.Features.SubstituteMatching.Dtos
{
    public sealed record SubstituteMatchQuery
    {
        public int AbsentTeacherId { get; init; }
        public DateOnly ServiceDate { get; init; }
        public int DayOfWeek { get; init; }
        public int PeriodNumber { get; init; }
    }
}
