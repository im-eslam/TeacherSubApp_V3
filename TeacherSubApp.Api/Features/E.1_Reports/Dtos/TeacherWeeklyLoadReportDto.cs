namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    /// <summary>
    /// BaseWeeklyLoad reflects the teacher's current weekly schedule and can therefore change retroactively for past weeks.
    /// </summary>
    public sealed record TeacherWeeklyLoadReportDto(
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        int BaseWeeklyLoad,
        DateOnly FromDate,
        DateOnly ToDate,
        List<WeeklyLoadBucketDto> Weeks);

    public sealed record WeeklyLoadBucketDto(
        DateOnly WeekStart,
        DateOnly WeekEnd,
        int BaseWeeklyLoad,
        int SlotsLostToAbsence,
        int SlotsGainedSubstituting,
        int NetActualLoad,
        int AbsenceDaysInWeek,
        int SubstitutionsInWeek);
}
