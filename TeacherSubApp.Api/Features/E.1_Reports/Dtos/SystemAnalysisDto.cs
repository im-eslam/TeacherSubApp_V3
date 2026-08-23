namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record SystemAnalysisDto(
        DateOnly FromDate,
        DateOnly ToDate,
        int TotalActiveTeachers,
        int TotalAbsenceDays,
        int TotalSlotsFreed,
        int TotalSlotsCovered,
        int TotalUncoveredSlots,
        double OverallCoverageRate,
        int TotalSubstitutionsMade,
        double OverallAlgorithmMatchRate,
        List<DailyTrendPointDto> DailyTrend,
        List<TeacherRankingEntryDto> TopAbsentTeachers,
        List<TeacherRankingEntryDto> TopSubstitutingTeachers);

    public sealed record DailyTrendPointDto(
        DateOnly Date,
        int AbsenceCount,
        int SlotsFreed,
        int SlotsCovered);

    public sealed record TeacherRankingEntryDto(
        int TeacherId,
        string TeacherName,
        int Count);
}
