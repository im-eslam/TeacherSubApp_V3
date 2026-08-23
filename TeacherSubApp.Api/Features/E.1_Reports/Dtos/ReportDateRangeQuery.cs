namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public record ReportDateRangeQuery
    {
        public DateOnly FromDate { get; init; }
        public DateOnly ToDate { get; init; }
    }

    public sealed record DailyReportQuery
    {
        public DateOnly Date { get; init; }
    }

    public sealed record TeacherAbsenceHistoryQuery : ReportDateRangeQuery
    {
    }

    public sealed record TeacherWeeklyLoadQuery : ReportDateRangeQuery
    {
    }

    public static class ReportQueryLimits
    {
        public const int MaxDateRangeDays = 366;
        public const int DefaultTopCount = 10;
        public const int MaxTopCount = 50;
    }
}
