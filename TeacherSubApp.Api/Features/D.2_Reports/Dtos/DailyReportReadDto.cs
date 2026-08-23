namespace TeacherSubApp.Api.Features.Reports.Dtos
{
    public sealed record DailyReportReadDto(
        DateOnly Date,
        int AbsentTeachersCount,
        List<AbsentTeacherDto> AbsentTeachers);

    public sealed record AbsentTeacherDto(
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        string? Reason,
        int FreedSlotsCount,
        int CoveredSlotsCount,
        List<FreedSlotDto> FreedSlots);

    public sealed record FreedSlotDto(
        int WeeklyScheduleId,
        int PeriodNumber,
        int? ClassId,
        string? ClassDisplayName,
        bool IsCovered,
        SubstituteInfoDto? Substitute);

    public sealed record SubstituteInfoDto(
        int SubstitutionId,
        int TeacherId,
        string TeacherName,
        string? SubjectName,
        bool IsAlgorithmMatch);
}