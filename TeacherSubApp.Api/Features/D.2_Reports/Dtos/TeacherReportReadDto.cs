
namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record TeacherReportReadDto(
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        bool IsSupervisor,
        DateOnly? FromDate,
        DateOnly? ToDate,
        List<TeacherAbsenceLedgerDto> Absences,
        List<TeacherSubstitutionLedgerDto> Substitutions,
        TeacherLoadAnalysisDto Analysis);

    public sealed record TeacherAbsenceLedgerDto(
        int AbsenceId,
        DateOnly AbsenceDate,
        string? Reason,
        int FreedSlotsCount,
        int CoveredSlotsCount);

    public sealed record TeacherSubstitutionLedgerDto(
        int SubstitutionId,
        DateOnly ServiceDate,
        int PeriodNumber,
        string ClassNameAtTimeOfService,
        string AbsentTeacherNameAtTimeOfService,
        bool IsAlgorithmMatch);

    public sealed record TeacherLoadAnalysisDto(
        int BaseWeeklyLoad,
        int ActualWeeklyLoad,
        int TotalFreedSlots,
        int TotalCoveredSlots,
        int AbsenceDaysCount);
}