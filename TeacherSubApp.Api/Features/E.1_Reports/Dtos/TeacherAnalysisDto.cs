namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    /// <summary>
    /// AverageActualWeeklyLoad uses the current weekly schedule for every bucket, so historical values can shift after schedule edits.
    /// </summary>
    public sealed record TeacherAnalysisDto(
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        bool IsSupervisor,
        DateOnly FromDate,
        DateOnly ToDate,
        int TotalAbsenceDays,
        int TotalSlotsFreedByAbsence,
        int TotalSlotsCoveredForThisTeacher,
        int TotalUncoveredSlots,
        double AbsenceCoverageRate,
        int TotalTimesSubstituted,
        int TotalDaysSubstituted,
        double AlgorithmMatchRate,
        int BaseWeeklyLoad,
        double AverageActualWeeklyLoad,
        int? AbsenceDaysRankAmongAllTeachers,
        int? SubstitutionsRankAmongAllTeachers);
}
