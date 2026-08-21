using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Substitutions.Internal
{
    public sealed class SubstitutionSnapshotHandler
    {
        private readonly AppDbContext _db;

        public SubstitutionSnapshotHandler(AppDbContext db)
        {
            _db = db;
        }

        public async Task<SubstitutionSnapshot> BuildAsync(int absenceId, int weeklyScheduleId, int substituteTeacherId)
        {
            TeacherAbsence? absence = await _db.TeacherAbsences
                .AsNoTracking()
                .Include(a => a.Teacher)
                    .ThenInclude(t => t.Subject)
                .FirstOrDefaultAsync(a => a.Id == absenceId && a.DeletedAt == null);

            WeeklySchedule? schedule = await _db.WeeklySchedules
                .AsNoTracking()
                .Include(ws => ws.SchoolClass)
                .Include(ws => ws.EventKey)
                .FirstOrDefaultAsync(ws => ws.Id == weeklyScheduleId && ws.DeletedAt == null);

            Teacher? substituteTeacher = await _db.Teachers
                .AsNoTracking()
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(t => t.Id == substituteTeacherId && t.DeletedAt == null);

            return new SubstitutionSnapshot(
                absentTeacherName: absence?.Teacher?.Name ?? string.Empty,
                absentTeacherSubject: absence?.Teacher?.Subject?.Name ?? string.Empty,
                substituteTeacherName: substituteTeacher?.Name ?? string.Empty,
                substituteTeacherSubject: substituteTeacher?.Subject?.Name ?? string.Empty,
                className: _BuildClassName(schedule),
                periodNumber: schedule?.PeriodNumber ?? 0
            );
        }

        public static void ApplyToEntity(Substitution substitution, SubstitutionSnapshot snapshot)
        {
            substitution.AbsentTeacherNameAtTimeOfService = snapshot.AbsentTeacherName;
            substitution.AbsentTeacherSubjectAtTimeOfService = snapshot.AbsentTeacherSubject;
            substitution.SubstituteTeacherNameAtTimeOfService = snapshot.SubstituteTeacherName;
            substitution.SubstituteTeacherSubjectAtTimeOfService = snapshot.SubstituteTeacherSubject;
            substitution.ClassNameAtTimeOfService = snapshot.ClassName;
            substitution.PeriodNumberAtTimeOfService = snapshot.PeriodNumber;
        }

        private static string _BuildClassName(WeeklySchedule? schedule)
        {
            if (schedule?.SchoolClass is null)
                return string.Empty;

            return schedule.EventKey is not null
                ? $"{schedule.SchoolClass.DisplayName} ({schedule.EventKey.EventName})"
                : schedule.SchoolClass.DisplayName;
        }
    }
}