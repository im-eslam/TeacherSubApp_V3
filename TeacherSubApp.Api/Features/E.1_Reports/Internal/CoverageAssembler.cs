using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports.Internal
{
    public sealed class CoverageAssembler
    {
        private readonly AppDbContext _db;

        public CoverageAssembler(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CoverageAssemblyResult> BuildAsync(IReadOnlyCollection<TeacherAbsence> absences)
        {
            if (absences.Count == 0)
                return new CoverageAssemblyResult(new Dictionary<int, List<DailyCoverageSlotDto>>(), new Dictionary<int, int>());

            int[] teacherIds = absences.Select(a => a.TeacherId).Distinct().ToArray();
            int[] storedDays = absences
                .Select(a => (int)a.AbsenceDate.DayOfWeek + 1)
                .Distinct()
                .ToArray();
            int[] absenceIds = absences.Select(a => a.Id).ToArray();

            List<CoverageScheduleRow> schedules = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null
                          && ws.ClassId != null
                          && teacherIds.Contains(ws.TeacherId)
                          && storedDays.Contains(ws.DayOfWeek))
                .Select(ws => new CoverageScheduleRow(
                    ws.Id,
                    ws.TeacherId,
                    ws.DayOfWeek,
                    ws.PeriodNumber,
                    ws.ClassId,
                    ws.SchoolClass == null ? null : ws.SchoolClass.DisplayName))
                .ToListAsync();

            List<CoverageSubstitutionRow> substitutions = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null && absenceIds.Contains(s.AbsenceId))
                .Select(s => new CoverageSubstitutionRow(
                    s.Id,
                    s.AbsenceId,
                    s.WeeklyScheduleId,
                    s.SubstituteTeacherId,
                    s.SubstituteTeacherNameAtTimeOfService,
                    s.IsAlgorithmMatch))
                .ToListAsync();

            Dictionary<(int AbsenceId, int ScheduleId), CoverageSubstitutionRow> substitutionBySlot = substitutions
                .GroupBy(s => (s.AbsenceId, s.WeeklyScheduleId))
                .ToDictionary(g => g.Key, g => g.First());

            Dictionary<int, int> coveredByAbsenceId = substitutions
                .GroupBy(s => s.AbsenceId)
                .ToDictionary(g => g.Key, g => g.Count());

            Dictionary<(int TeacherId, int StoredDay), List<CoverageScheduleRow>> schedulesByTeacherDay = schedules
                .GroupBy(ws => (ws.TeacherId, ws.DayOfWeek))
                .ToDictionary(g => g.Key, g => g.OrderBy(ws => ws.PeriodNumber).ToList());

            Dictionary<int, List<DailyCoverageSlotDto>> slotsByAbsenceId = new();
            foreach (TeacherAbsence absence in absences)
            {
                int storedDay = (int)absence.AbsenceDate.DayOfWeek + 1;
                schedulesByTeacherDay.TryGetValue((absence.TeacherId, storedDay), out List<CoverageScheduleRow>? teacherSchedules);

                List<DailyCoverageSlotDto> slots = (teacherSchedules ?? [])
                    .Select(schedule =>
                    {
                        substitutionBySlot.TryGetValue((absence.Id, schedule.Id), out CoverageSubstitutionRow? substitution);
                        return new DailyCoverageSlotDto(
                            schedule.PeriodNumber,
                            schedule.ClassId,
                            schedule.ClassDisplayName,
                            substitution is not null,
                            substitution?.SubstitutionId,
                            substitution?.SubstituteTeacherId,
                            string.IsNullOrWhiteSpace(substitution?.SubstituteTeacherName)
                                ? null
                                : substitution!.SubstituteTeacherName,
                            substitution?.IsAlgorithmMatch);
                    })
                    .ToList();

                slotsByAbsenceId[absence.Id] = slots;
            }

            return new CoverageAssemblyResult(slotsByAbsenceId, coveredByAbsenceId);
        }

        private sealed record CoverageScheduleRow(
            int Id,
            int TeacherId,
            int DayOfWeek,
            int PeriodNumber,
            int? ClassId,
            string? ClassDisplayName);

        private sealed record CoverageSubstitutionRow(
            int SubstitutionId,
            int AbsenceId,
            int WeeklyScheduleId,
            int SubstituteTeacherId,
            string SubstituteTeacherName,
            bool IsAlgorithmMatch);
    }

    public sealed record CoverageAssemblyResult(
        IReadOnlyDictionary<int, List<DailyCoverageSlotDto>> SlotsByAbsenceId,
        IReadOnlyDictionary<int, int> CoveredByAbsenceId);
}
