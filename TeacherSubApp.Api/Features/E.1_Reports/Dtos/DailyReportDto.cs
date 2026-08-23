namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record DailyReportDto(
        DateOnly Date,
        int TotalAbsences,
        int TotalSlotsFreed,
        int TotalSlotsCovered,
        int TotalUncoveredSlots,
        List<DailyAbsenceEntryDto> Absences);

    public sealed record DailyAbsenceEntryDto(
        int AbsenceId,
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        string? Reason,
        int SlotsFreed,
        int SlotsCovered,
        int UncoveredSlots,
        List<DailyCoverageSlotDto> Slots);

    public sealed record DailyCoverageSlotDto(
        int PeriodNumber,
        int? ClassId,
        string? ClassDisplayName,
        bool IsCovered,
        int? SubstitutionId,
        int? SubstituteTeacherId,
        string? SubstituteTeacherName,
        bool? IsAlgorithmMatch);
}
