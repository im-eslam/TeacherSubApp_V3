namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record TeacherReportQuery
    {
        public int TeacherId { get; init; }
        public DateOnly? FromDate { get; init; }
        public DateOnly? ToDate { get; init; }
    }
}