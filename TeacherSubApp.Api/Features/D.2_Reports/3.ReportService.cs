using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Reports.Dtos;
using TeacherSubApp.Api.Features.Reports.Internal;

namespace TeacherSubApp.Api.Features.Reports
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _db;
        private readonly TeacherLoadCalculator _loadCalculator;

        public ReportService(AppDbContext db)
        {
            _db = db;
            _loadCalculator = new TeacherLoadCalculator(db);
        }

        public async Task<Result<DailyReportReadDto>> GetDailyReportAsync(DailyReportQuery query)
        {
            List<TeacherAbsence> absencesToday = await _FetchAbsencesOnDateAsync(query.Date);

            if (absencesToday.Count == 0)
            {
                return Result<DailyReportReadDto>.Success(new DailyReportReadDto(query.Date, 0, []));
            }

            int targetDayOfWeek = (int)query.Date.DayOfWeek + 1;
            List<int> absentTeacherIds = absencesToday.Select(a => a.TeacherId).ToList();

            List<WeeklySchedule> freedSlots = await _FetchFreedSlotsAsync(absentTeacherIds, targetDayOfWeek);
            List<Substitution> coveringSubstitutions = await _FetchCoveringSubstitutionsAsync(absentTeacherIds, query.Date);

            List<AbsentTeacherDto> absentTeachers = absencesToday
                .Select(absence => _BuildAbsentTeacherDto(absence, freedSlots, coveringSubstitutions))
                .OrderBy(a => a.TeacherName)
                .ToList();

            DailyReportReadDto report = new(query.Date, absentTeachers.Count, absentTeachers);
            return Result<DailyReportReadDto>.Success(report);
        }

        public async Task<Result<TeacherReportReadDto>> GetTeacherReportAsync(TeacherReportQuery query)
        {
            Teacher? teacher = await _FindActiveTeacherAsync(query.TeacherId);
            if (teacher is null)
            {
                return Result<TeacherReportReadDto>.Failure(ErrorType.NotFound, ReportErrors.TeacherNotFound);
            }

            List<TeacherAbsenceLedgerDto> absenceLedger = await _BuildAbsenceLedgerAsync(query);
            List<TeacherSubstitutionLedgerDto> substitutionLedger = await _BuildSubstitutionLedgerAsync(query);
            TeacherLoadAnalysisDto analysis = await _BuildAnalysisAsync(query, absenceLedger, substitutionLedger);

            TeacherReportReadDto report = new(
                teacher.Id,
                teacher.Name,
                teacher.Subject?.Name,
                teacher.IsSupervisor,
                query.FromDate,
                query.ToDate,
                absenceLedger,
                substitutionLedger,
                analysis);

            return Result<TeacherReportReadDto>.Success(report);
        }

        #region === Helpers - Daily Report ===

        private async Task<List<TeacherAbsence>> _FetchAbsencesOnDateAsync(DateOnly date)
        {
            return await _db.TeacherAbsences
                .AsNoTracking()
                .Include(a => a.Teacher)
                    .ThenInclude(t => t.Subject)
                .Where(a => a.DeletedAt == null && a.AbsenceDate == date && a.Teacher.DeletedAt == null)
                .ToListAsync();
        }

        private async Task<List<WeeklySchedule>> _FetchFreedSlotsAsync(List<int> teacherIds, int dayOfWeek)
        {
            return await _db.WeeklySchedules
                .AsNoTracking()
                .Include(ws => ws.SchoolClass)
                .Where(ws => ws.DeletedAt == null
                          && ws.DayOfWeek == dayOfWeek
                          && ws.ClassId != null
                          && teacherIds.Contains(ws.TeacherId))
                .ToListAsync();
        }

        private async Task<List<Substitution>> _FetchCoveringSubstitutionsAsync(List<int> absentTeacherIds, DateOnly date)
        {
            return await _db.Substitutions
                .AsNoTracking()
                .Include(s => s.SubstituteTeacher)
                    .ThenInclude(t => t.Subject)
                .Where(s => s.DeletedAt == null
                          && s.ServiceDate == date
                          && absentTeacherIds.Contains(s.TeacherAbsence.TeacherId))
                .ToListAsync();
        }

        private AbsentTeacherDto _BuildAbsentTeacherDto(TeacherAbsence absence, List<WeeklySchedule> allFreedSlots, List<Substitution> allCoveringSubstitutions)
        {
            List<WeeklySchedule> teacherFreedSlots = allFreedSlots
                .Where(ws => ws.TeacherId == absence.TeacherId)
                .OrderBy(ws => ws.PeriodNumber)
                .ToList();

            List<FreedSlotDto> freedSlotDtos = teacherFreedSlots
                .Select(slot =>
                {
                    Substitution? covering = allCoveringSubstitutions
                        .FirstOrDefault(s => s.WeeklyScheduleId == slot.Id && s.AbsenceId == absence.Id);

                    SubstituteInfoDto? substituteInfo = covering is null
                        ? null
                        : new SubstituteInfoDto(
                            covering.Id,
                            covering.SubstituteTeacherId,
                            covering.SubstituteTeacher.Name,
                            covering.SubstituteTeacher.Subject?.Name,
                            covering.IsAlgorithmMatch);

                    return new FreedSlotDto(
                        slot.Id,
                        slot.PeriodNumber,
                        slot.ClassId,
                        slot.SchoolClass?.DisplayName,
                        covering is not null,
                        substituteInfo);
                })
                .ToList();

            return new AbsentTeacherDto(
                absence.TeacherId,
                absence.Teacher.Name,
                absence.Teacher.Subject?.Name,
                absence.Reason,
                freedSlotDtos.Count,
                freedSlotDtos.Count(f => f.IsCovered),
                freedSlotDtos);
        }

        #endregion

        #region === Helpers - Teacher Report ===

        private Task<Teacher?> _FindActiveTeacherAsync(int teacherId)
        {
            return _db.Teachers
                .AsNoTracking()
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(t => t.Id == teacherId && t.DeletedAt == null);
        }

        private async Task<List<TeacherAbsenceLedgerDto>> _BuildAbsenceLedgerAsync(TeacherReportQuery query)
        {
            List<TeacherAbsence> absences = await _db.TeacherAbsences
                .AsNoTracking()
                .Include(a => a.Substitutions.Where(s => s.DeletedAt == null))
                .Where(a => a.DeletedAt == null
                          && a.TeacherId == query.TeacherId
                          && (!query.FromDate.HasValue || a.AbsenceDate >= query.FromDate.Value)
                          && (!query.ToDate.HasValue || a.AbsenceDate <= query.ToDate.Value))
                .OrderByDescending(a => a.AbsenceDate)
                .ToListAsync();

            if (absences.Count == 0)
            {
                return [];
            }

            List<int> dayOfWeeksNeeded = absences
                .Select(a => (int)a.AbsenceDate.DayOfWeek + 1)
                .Distinct()
                .ToList();

            Dictionary<int, int> freedSlotsByDayOfWeek = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null
                          && ws.TeacherId == query.TeacherId
                          && ws.ClassId != null
                          && dayOfWeeksNeeded.Contains(ws.DayOfWeek))
                .GroupBy(ws => ws.DayOfWeek)
                .Select(g => new { DayOfWeek = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.DayOfWeek, g => g.Count);

            return absences
                .Select(a =>
                {
                    int dayOfWeek = (int)a.AbsenceDate.DayOfWeek + 1;
                    int freedCount = freedSlotsByDayOfWeek.GetValueOrDefault(dayOfWeek, 0);
                    int coveredCount = a.Substitutions.Count;

                    return new TeacherAbsenceLedgerDto(a.Id, a.AbsenceDate, a.Reason, freedCount, coveredCount);
                })
                .ToList();
        }

        private async Task<List<TeacherSubstitutionLedgerDto>> _BuildSubstitutionLedgerAsync(TeacherReportQuery query)
        {
            return await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                          && s.SubstituteTeacherId == query.TeacherId
                          && (!query.FromDate.HasValue || s.ServiceDate >= query.FromDate.Value)
                          && (!query.ToDate.HasValue || s.ServiceDate <= query.ToDate.Value))
                .OrderByDescending(s => s.ServiceDate)
                .Select(s => new TeacherSubstitutionLedgerDto(
                    s.Id,
                    s.ServiceDate,
                    s.PeriodNumberAtTimeOfService,
                    s.ClassNameAtTimeOfService,
                    s.AbsentTeacherNameAtTimeOfService,
                    s.IsAlgorithmMatch))
                .ToListAsync();
        }

        private async Task<TeacherLoadAnalysisDto> _BuildAnalysisAsync(
            TeacherReportQuery query,
            List<TeacherAbsenceLedgerDto> absenceLedger,
            List<TeacherSubstitutionLedgerDto> substitutionLedger)
        {
            int baseWeeklyLoad = await _loadCalculator.GetBaseWeeklyLoadAsync(query.TeacherId);

            DateOnly referenceDate = query.ToDate ?? query.FromDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            int actualWeeklyLoad = await _loadCalculator.GetActualWeeklyLoadAsync(query.TeacherId, referenceDate);

            int totalFreedSlots = absenceLedger.Sum(a => a.FreedSlotsCount);
            int totalCoveredSlots = substitutionLedger.Count;

            return new TeacherLoadAnalysisDto(
                baseWeeklyLoad,
                actualWeeklyLoad,
                totalFreedSlots,
                totalCoveredSlots,
                absenceLedger.Count);
        }

        #endregion
    }
}