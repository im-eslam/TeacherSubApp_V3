using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Data;

namespace TeacherSubApp.Api.Features.Reports.Internal
{
    public sealed class TeacherLoadCalculator
    {
        private readonly AppDbContext _db;

        public TeacherLoadCalculator(AppDbContext db)
        {
            _db = db;
        }

        public async Task<int> GetBaseWeeklyLoadAsync(int teacherId)
        {
            return await _db.WeeklySchedules
                .AsNoTracking()
                .Where(ws => ws.DeletedAt == null && ws.TeacherId == teacherId && ws.ClassId != null)
                .CountAsync();
        }

        public async Task<int> GetActualWeeklyLoadAsync(int teacherId, DateOnly anyDateInWeek)
        {
            (DateOnly weekStart, DateOnly weekEnd) = _GetWeekBounds(anyDateInWeek);

            int baseWeeklyLoad = await GetBaseWeeklyLoadAsync(teacherId);

            int freedSlotsThisWeek = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                         && s.TeacherAbsence.TeacherId == teacherId
                         && s.ServiceDate >= weekStart
                         && s.ServiceDate <= weekEnd)
                .CountAsync();

            int coveredSlotsThisWeek = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                         && s.SubstituteTeacherId == teacherId
                         && s.ServiceDate >= weekStart
                         && s.ServiceDate <= weekEnd)
                .CountAsync();

            return baseWeeklyLoad - freedSlotsThisWeek + coveredSlotsThisWeek;
        }

        private static (DateOnly WeekStart, DateOnly WeekEnd) _GetWeekBounds(DateOnly date)
        {
            DateOnly weekStart = date.AddDays(-(int)date.DayOfWeek);
            DateOnly weekEnd = weekStart.AddDays(6);
            return (weekStart, weekEnd);
        }
    }
}