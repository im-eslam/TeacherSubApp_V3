using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports
{
    public partial class ReportService
    {
        public async Task<Result<SystemAnalysisDto>> GetSystemAnalysisAsync(
            ReportDateRangeQuery query,
            int topCount = Dtos.ReportQueryLimits.DefaultTopCount)
        {
            Result dateValidation = await _ValidateDateRangeAsync(query.FromDate, query.ToDate);
            if (dateValidation.IsFailure)
            {
                return Result<SystemAnalysisDto>.Failure(dateValidation.ErrorType, dateValidation.Error);
            }

            Result topCountValidation = _ValidateTopCount(topCount);
            if (topCountValidation.IsFailure)
            {
                return Result<SystemAnalysisDto>.Failure(topCountValidation.ErrorType, topCountValidation.Error);
            }

            int totalActiveTeachers = await _db.Teachers
                .AsNoTracking()
                .CountAsync(t => t.DeletedAt == null);

            List<DailyAbsenceAggregate> absenceAggregates = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null
                         && a.AbsenceDate >= query.FromDate
                         && a.AbsenceDate <= query.ToDate)
                .GroupBy(a => new { a.AbsenceDate, a.TeacherId })
                .Select(group => new DailyAbsenceAggregate(
                    group.Key.AbsenceDate,
                    group.Key.TeacherId,
                    group.Count()))
                .ToListAsync();

            int[] teacherIds = absenceAggregates
                .Select(aggregate => aggregate.TeacherId)
                .Distinct()
                .ToArray();
            Dictionary<(int TeacherId, int StoredDay), int> slotsFreedByTeacherDay = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null
                         && ws.ClassId != null
                         && teacherIds.Contains(ws.TeacherId))
                .GroupBy(ws => new { ws.TeacherId, ws.DayOfWeek })
                .Select(group => new
                {
                    group.Key.TeacherId,
                    group.Key.DayOfWeek,
                    Count = group.Count()
                })
                .ToDictionaryAsync(
                    row => (row.TeacherId, row.DayOfWeek),
                    row => row.Count);

            List<DailySubstitutionAggregate> substitutionAggregates = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                         && s.ServiceDate >= query.FromDate
                         && s.ServiceDate <= query.ToDate)
                .GroupBy(s => s.ServiceDate)
                .Select(group => new DailySubstitutionAggregate(
                    group.Key,
                    group.Count(),
                    group.Count(s => s.IsAlgorithmMatch)))
                .ToListAsync();

            Dictionary<DateOnly, DailySubstitutionAggregate> substitutionByDate = substitutionAggregates
                .ToDictionary(aggregate => aggregate.ServiceDate);
            Dictionary<DateOnly, DailyAbsenceTrendAggregate> absenceByDate = absenceAggregates
                .GroupBy(aggregate => aggregate.AbsenceDate)
                .ToDictionary(
                    group => group.Key,
                    group => new DailyAbsenceTrendAggregate(
                        group.Sum(aggregate => aggregate.AbsenceCount),
                        group.Sum(aggregate => aggregate.AbsenceCount * slotsFreedByTeacherDay.GetValueOrDefault((aggregate.TeacherId, (int)aggregate.AbsenceDate.DayOfWeek + 1)))));

            List<DailyTrendPointDto> dailyTrend = _BuildDailyTrend(
                query.FromDate,
                query.ToDate,
                absenceByDate,
                substitutionByDate);

            int totalAbsenceDays = absenceAggregates.Sum(aggregate => aggregate.AbsenceCount);
            int totalSlotsFreed = dailyTrend.Sum(point => point.SlotsFreed);
            int totalSlotsCovered = substitutionAggregates.Sum(aggregate => aggregate.SubstitutionCount);
            int totalSubstitutions = totalSlotsCovered;
            int totalAlgorithmMatches = substitutionAggregates.Sum(aggregate => aggregate.AlgorithmMatchCount);

            List<TeacherRankingRow> absentRankingRows = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null
                         && a.AbsenceDate >= query.FromDate
                         && a.AbsenceDate <= query.ToDate)
                .GroupBy(a => a.TeacherId)
                .Select(group => new TeacherRankingRow(group.Key, group.Count()))
                .OrderByDescending(row => row.Count)
                .ThenBy(row => row.TeacherId)
                .Take(topCount)
                .ToListAsync();

            List<TeacherRankingRow> substitutingRankingRows = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                         && s.ServiceDate >= query.FromDate
                         && s.ServiceDate <= query.ToDate)
                .GroupBy(s => s.SubstituteTeacherId)
                .Select(group => new TeacherRankingRow(group.Key, group.Count()))
                .OrderByDescending(row => row.Count)
                .ThenBy(row => row.TeacherId)
                .Take(topCount)
                .ToListAsync();

            int[] rankedTeacherIds = absentRankingRows
                .Concat(substitutingRankingRows)
                .Select(row => row.TeacherId)
                .Distinct()
                .ToArray();
            Dictionary<int, string> teacherNames = await _db.Teachers
                .AsNoTracking()
                .Where(t => rankedTeacherIds.Contains(t.Id))
                .ToDictionaryAsync(t => t.Id, t => t.Name);

            return Result<SystemAnalysisDto>.Success(new SystemAnalysisDto(
                query.FromDate,
                query.ToDate,
                totalActiveTeachers,
                totalAbsenceDays,
                totalSlotsFreed,
                totalSlotsCovered,
                Math.Max(0, totalSlotsFreed - totalSlotsCovered),
                _Rate(totalSlotsCovered, totalSlotsFreed),
                totalSubstitutions,
                _Rate(totalAlgorithmMatches, totalSubstitutions),
                dailyTrend,
                _BuildRanking(absentRankingRows, teacherNames),
                _BuildRanking(substitutingRankingRows, teacherNames)));
        }

        private static List<DailyTrendPointDto> _BuildDailyTrend(
            DateOnly fromDate,
            DateOnly toDate,
            IReadOnlyDictionary<DateOnly, DailyAbsenceTrendAggregate> absenceByDate,
            IReadOnlyDictionary<DateOnly, DailySubstitutionAggregate> substitutionByDate)
        {
            List<DailyTrendPointDto> trend = new();
            for (DateOnly date = fromDate; date <= toDate; date = date.AddDays(1))
            {
                absenceByDate.TryGetValue(date, out DailyAbsenceTrendAggregate? absences);
                substitutionByDate.TryGetValue(date, out DailySubstitutionAggregate? substitutions);
                trend.Add(new DailyTrendPointDto(
                    date,
                    absences?.AbsenceCount ?? 0,
                    absences?.SlotsFreed ?? 0,
                    substitutions?.SubstitutionCount ?? 0));
            }

            return trend;
        }

        private static List<TeacherRankingEntryDto> _BuildRanking(
            IEnumerable<TeacherRankingRow> rows,
            IReadOnlyDictionary<int, string> teacherNames)
        {
            return rows
                .Select(row => new TeacherRankingEntryDto(
                    row.TeacherId,
                    teacherNames.GetValueOrDefault(row.TeacherId, "معلم غير نشط"),
                    row.Count))
                .ToList();
        }

        private static double _Rate(int numerator, int denominator)
        {
            return denominator == 0 ? 0 : (double)numerator / denominator;
        }

        private sealed record DailyAbsenceAggregate(
            DateOnly AbsenceDate,
            int TeacherId,
            int AbsenceCount);

        private sealed record DailyAbsenceTrendAggregate(
            int AbsenceCount,
            int SlotsFreed);

        private sealed record DailySubstitutionAggregate(
            DateOnly ServiceDate,
            int SubstitutionCount,
            int AlgorithmMatchCount);

        private sealed record TeacherRankingRow(int TeacherId, int Count);
    }
}
