using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Features.Reports.Dtos;

namespace TeacherSubApp.Api.Features.Reports.Internal
{
    public sealed class WeeklyLoadBucketBuilder
    {
        private readonly AppDbContext _db;

        public WeeklyLoadBucketBuilder(AppDbContext db)
        {
            _db = db;
        }

        public async Task<WeeklyLoadBuildResult> BuildAsync(
            int teacherId,
            DateOnly fromDate,
            DateOnly toDate)
        {
            int baseWeeklyLoad = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null
                          && ws.TeacherId == teacherId
                          && ws.ClassId != null)
                .CountAsync();

            Dictionary<int, int> slotsFreedByStoredDay = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null
                          && ws.TeacherId == teacherId
                          && ws.ClassId != null)
                .GroupBy(ws => ws.DayOfWeek)
                .Select(group => new { StoredDay = group.Key, Count = group.Count() })
                .ToDictionaryAsync(group => group.StoredDay, group => group.Count);

            List<DateOnly> absenceDates = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null
                          && a.TeacherId == teacherId
                          && a.AbsenceDate >= fromDate
                          && a.AbsenceDate <= toDate)
                .Select(a => a.AbsenceDate)
                .ToListAsync();

            List<DateOnly> substitutionDates = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                          && s.SubstituteTeacherId == teacherId
                          && s.ServiceDate >= fromDate
                          && s.ServiceDate <= toDate)
                .Select(s => s.ServiceDate)
                .ToListAsync();

            DateOnly firstWeekStart = _WeekStart(fromDate);
            DateOnly lastWeekStart = _WeekStart(toDate);
            List<WeeklyLoadBucketDto> buckets = new();

            for (DateOnly weekStart = firstWeekStart;
                 weekStart <= lastWeekStart;
                 weekStart = weekStart.AddDays(7))
            {
                DateOnly weekEnd = weekStart.AddDays(6);
                List<DateOnly> weekAbsences = absenceDates
                    .Where(date => date >= weekStart && date <= weekEnd)
                    .ToList();
                List<DateOnly> weekSubstitutions = substitutionDates
                    .Where(date => date >= weekStart && date <= weekEnd)
                    .ToList();

                int slotsLost = weekAbsences.Sum(date =>
                    slotsFreedByStoredDay.GetValueOrDefault((int)date.DayOfWeek + 1));
                int slotsGained = weekSubstitutions.Count;

                buckets.Add(new WeeklyLoadBucketDto(
                    weekStart,
                    weekEnd,
                    baseWeeklyLoad,
                    slotsLost,
                    slotsGained,
                    baseWeeklyLoad - slotsLost + slotsGained,
                    weekAbsences.Count,
                    weekSubstitutions.Count));
            }

            return new WeeklyLoadBuildResult(baseWeeklyLoad, buckets);
        }

        private static DateOnly _WeekStart(DateOnly date)
        {
            return date.AddDays(-(int)date.DayOfWeek);
        }
    }

    public sealed record WeeklyLoadBuildResult(
        int BaseWeeklyLoad,
        List<WeeklyLoadBucketDto> Buckets);
}
