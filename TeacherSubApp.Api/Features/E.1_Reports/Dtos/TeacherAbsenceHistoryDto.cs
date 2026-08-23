namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record TeacherAbsenceHistoryDto(
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        DateOnly FromDate,
        DateOnly ToDate,
        int TotalAbsenceDays,
        int TotalSlotsFreed,
        int TotalSlotsCovered,
        int TotalUncoveredSlots,
        List<TeacherAbsenceHistoryEntryDto> Entries);

    public sealed record TeacherAbsenceHistoryEntryDto(
        int AbsenceId,
        DateOnly AbsenceDate,
        string? Reason,
        int SlotsFreed,
        int SlotsCovered,
        int UncoveredSlots,
        List<DailyCoverageSlotDto> Slots);
}
