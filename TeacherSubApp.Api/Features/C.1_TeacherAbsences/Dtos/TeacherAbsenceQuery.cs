namespace TeacherSubApp.Api.Features.TeacherAbsences.Dtos
{
    public sealed record TeacherAbsenceQuery
    {
        public int? TeacherId { get; init; }
        public DateOnly? FromDate { get; init; }
        public DateOnly? ToDate { get; init; }
    }
}
