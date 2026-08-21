using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;

namespace TeacherSubApp.Api.Features.SubstituteMatching.Internal
{
    public sealed class TeacherContextAssembler
    {
        private readonly AppDbContext _db;
        private readonly SubstituteMatchQuery _query;

        public TeacherContextAssembler(AppDbContext db, SubstituteMatchQuery query)
        {
            _db = db;
            _query = query;
        }

        // ==== Assemble ====
        public async Task<List<TeacherContext>> BuildContexts()
        {
            // Define
            List<Teacher> _teachers = new();
            List<WeeklySchedule> _daySchedules = new();
            Dictionary<int, TeacherAbsence> _absenceTodayByTeacherId = new();
            List<Substitution> _relevantSubstitutions = new();
            Dictionary<int, int> _weeklyLoadByTeacherId = new();

            // Fetch
            await FetchActiveTeachersAsync(ref _teachers);
            await FetchDaySchedulesAsync();
            ValidateNoImpossibleSlotStates();
            await FetchAbsencesTodayAsync();
            await FetchRelevantSubstitutionsAsync();
            await FetchWeeklyLoadAsync();

            // Stich 
            List<TeacherContext> contexts = new();

            foreach (Teacher teacher in _teachers)
            {
                List<WeeklySchedule> teacherDaySchedules = _daySchedules
                    .Where(ws => ws.TeacherId == teacher.Id)
                    .ToList();

                _absenceTodayByTeacherId.TryGetValue(teacher.Id, out TeacherAbsence? absenceToday);

                List<Substitution> teacherSubstitutions = _relevantSubstitutions
                    .Where(s => s.SubstituteTeacherId == teacher.Id)
                    .ToList();

                int weeklyLoad = _weeklyLoadByTeacherId.GetValueOrDefault(teacher.Id, 0);

                contexts.Add(new TeacherContext(
                    teacher,
                    teacherDaySchedules,
                    absenceToday,
                    teacherSubstitutions,
                    weeklyLoad));
            }

            return contexts;
        }

        // ==== Fetch data ====
        private async Task FetchActiveTeachersAsync(ref List<Teacher> teachers)
        {
            teachers = await _db.Teachers
                .AsNoTracking()
                .Include(t => t.Subject)
                .Where(t => t.DeletedAt == null)
                .ToListAsync();
        }

        private async Task FetchDaySchedulesAsync()
        {
            _daySchedules = await _db.WeeklySchedules
                .AsNoTracking()
                .Include(ws => ws.EventKey)
                .Where(ws => ws.DeletedAt == null && ws.DayOfWeek == _query.DayOfWeek)
                .ToListAsync();
        }

        private async Task FetchAbsencesTodayAsync()
        {
            DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

            _absenceTodayByTeacherId = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null && a.AbsenceDate == today)
                .ToDictionaryAsync(a => a.TeacherId);
        }

        private async Task FetchRelevantSubstitutionsAsync()
        {
            DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
            DateOnly yesterday = today.AddDays(-1);

            _relevantSubstitutions = await _db.Substitutions
                .AsNoTracking()
                .Include(s => s.WeeklySchedule)
                .Where(s => s.DeletedAt == null && (s.ServiceDate == today || s.ServiceDate == yesterday))
                .ToListAsync();
        }

        private async Task FetchWeeklyLoadAsync()
        {
            DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
            DateOnly weekStart = _StartOfWeek(today);
            DateOnly weekEnd = weekStart.AddDays(6);

            Dictionary<int, int> baseLoadByTeacherId = await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null && ws.ClassId != null)
                .GroupBy(ws => ws.TeacherId)
                .Select(g => new { TeacherId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.TeacherId, g => g.Count);

            Dictionary<int, int> substitutionLoadByTeacherId = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null && s.ServiceDate >= weekStart && s.ServiceDate <= weekEnd)
                .GroupBy(s => s.SubstituteTeacherId)
                .Select(g => new { TeacherId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.TeacherId, g => g.Count);

            Dictionary<int, int> combined = new(baseLoadByTeacherId);
            foreach ((int teacherId, int count) in substitutionLoadByTeacherId)
            {
                combined[teacherId] = combined.GetValueOrDefault(teacherId, 0) + count;
            }

            _weeklyLoadByTeacherId = combined;
        }

        private static DateOnly _StartOfWeek(DateOnly reference)
        {
            int daysSinceSunday = ((int)reference.DayOfWeek + 1) % 7;
            return reference.AddDays(-daysSinceSunday);
        }


        // ==== Validate ====
        private void ValidateNoImpossibleSlotStates()
        {
            foreach (WeeklySchedule slot in _daySchedules)
            {
                bool hasClass = slot.ClassId is not null;
                bool isSupportEvent = slot.EventKey?.IsSupport ?? false;
                bool isStandbyEvent = slot.EventKey?.IsStandby ?? false;

                bool isCase1 = !hasClass && isSupportEvent;
                bool isCase5 = hasClass && isStandbyEvent;

                if (isCase1 || isCase5)
                {
                    throw new InvalidOperationException(
                        $"WeeklySchedule Id={slot.Id} (TeacherId={slot.TeacherId}, " +
                        $"Day={slot.DayOfWeek}, Period={slot.PeriodNumber}) is in an " +
                        $"impossible slot state: ClassId={(hasClass ? "set" : "null")}, " +
                        $"Support={isSupportEvent}, Standby={isStandbyEvent}. " +
                        "This combination should never occur - check upstream data entry.");
                }
            }
        }
    }
}