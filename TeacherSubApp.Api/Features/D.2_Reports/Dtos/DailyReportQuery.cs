namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record DailyReportQuery
    {
        public DateOnly Date { get; init; }
    }
}