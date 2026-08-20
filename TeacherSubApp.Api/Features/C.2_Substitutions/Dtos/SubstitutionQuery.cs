namespace TeacherSubApp.Api.Features.Substitutions.Dtos
{
    public sealed record SubstitutionQuery
    {
        public int? AbsenceId { get; init; }
        public int? WeeklyScheduleId { get; init; }
        public int? SubstituteTeacherId { get; init; }
        public DateOnly? FromDate { get; init; }
        public DateOnly? ToDate { get; init; }
        public bool? IsAlgorithmMatch { get; init; }
    }
}
