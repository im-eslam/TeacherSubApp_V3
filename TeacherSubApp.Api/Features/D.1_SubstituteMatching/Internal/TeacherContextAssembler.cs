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
            // Fetch
            List<Teacher> teachers = await FetchActiveTeachersAsync();
            List<WeeklySchedule> daySchedules = await FetchDaySchedulesAsync();
            ValidateNoImpossibleSlotStates(daySchedules);
            Dictionary<int, TeacherAbsence> absenceByTeacherId = await FetchAbsencesForServiceDateAsync();
            List<Substitution> relevantSubstitutions = await FetchRelevantSubstitutionsAsync();
            Dictionary<int, int> weeklyLoadByTeacherId = await FetchWeeklyLoadAsync();


            // Stich 
            List<TeacherContext> contexts = new();

            foreach (Teacher teacher in teachers)
            {
                List<WeeklySchedule> teacherDaySchedules = daySchedules.Where(ws => ws.TeacherId == teacher.Id).ToList();
                absenceByTeacherId.TryGetValue(teacher.Id, out TeacherAbsence? absenceOnServiceDate);
                List<Substitution> teacherSubstitutions = relevantSubstitutions.Where(s => s.SubstituteTeacherId == teacher.Id).ToList();
                int weeklyLoad = weeklyLoadByTeacherId.GetValueOrDefault(teacher.Id, 0);

                contexts.Add(new TeacherContext(teacher, teacherDaySchedules, absenceOnServiceDate, teacherSubstitutions, weeklyLoad, _query.ServiceDate));
            }

            return contexts;
        }

        // ==== Fetch data ====
        private async Task<List<Teacher>> FetchActiveTeachersAsync()
        {
            return await _db.Teachers
                .AsNoTracking()
                .Include(t => t.Subject)
                .Where(t => t.DeletedAt == null)
                .ToListAsync();
        }

        private async Task<List<WeeklySchedule>> FetchDaySchedulesAsync()
        {
            return await _db.WeeklySchedules
                .AsNoTracking()
                .Include(ws => ws.EventKey)
                .Where(ws => ws.DeletedAt == null && ws.DayOfWeek == _query.DayOfWeek)
                .ToListAsync();
        }

        private async Task<Dictionary<int, TeacherAbsence>> FetchAbsencesForServiceDateAsync()
        {
            return await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null && a.AbsenceDate == _query.ServiceDate)
                .ToDictionaryAsync(a => a.TeacherId);
        }

        private async Task<List<Substitution>> FetchRelevantSubstitutionsAsync()
        {
            DateOnly yesterday = _query.ServiceDate.AddDays(-1);

            return await _db.Substitutions
                .AsNoTracking()
                .Include(s => s.WeeklySchedule)
                .Where(s => s.DeletedAt == null && (s.ServiceDate == _query.ServiceDate || s.ServiceDate == yesterday))
                .ToListAsync();
        }

        private async Task<Dictionary<int, int>> FetchWeeklyLoadAsync()
        {
            DateOnly weekStart = _StartOfWeek(_query.ServiceDate);
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

            return combined;
        }

        private static DateOnly _StartOfWeek(DateOnly reference)
        {
            // Business week starts on Sunday.
            int daysSinceSunday = ((int)reference.DayOfWeek + 1) % 7;
            return reference.AddDays(-daysSinceSunday);
        }


        // ==== Validate ====
        private void ValidateNoImpossibleSlotStates(List<WeeklySchedule> daySchedules)
        {
            foreach (WeeklySchedule slot in daySchedules)
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