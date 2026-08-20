using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.Substitutions.Dtos
{
    public sealed record SubstitutionReadDto(
        int Id,
        int AbsenceId,
        int WeeklyScheduleId,
        int SubstituteTeacherId,
        DateOnly ServiceDate,
        bool IsAlgorithmMatch,
        string AbsentTeacherNameAtTimeOfService,
        string AbsentTeacherSubjectAtTimeOfService,
        string SubstituteTeacherNameAtTimeOfService,
        string SubstituteTeacherSubjectAtTimeOfService,
        string ClassNameAtTimeOfService,
        int PeriodNumberAtTimeOfService)
    {
        public static SubstitutionReadDto FromEntity(Substitution substitution) =>
            new(
                substitution.Id,
                substitution.AbsenceId,
                substitution.WeeklyScheduleId,
                substitution.SubstituteTeacherId,
                substitution.ServiceDate,
                substitution.IsAlgorithmMatch,
                substitution.AbsentTeacherNameAtTimeOfService,
                substitution.AbsentTeacherSubjectAtTimeOfService,
                substitution.SubstituteTeacherNameAtTimeOfService,
                substitution.SubstituteTeacherSubjectAtTimeOfService,
                substitution.ClassNameAtTimeOfService,
                substitution.PeriodNumberAtTimeOfService);

        public static readonly Expression<Func<Substitution, SubstitutionReadDto>> ToDtoProjection = s =>
            new SubstitutionReadDto(
                s.Id,
                s.AbsenceId,
                s.WeeklyScheduleId,
                s.SubstituteTeacherId,
                s.ServiceDate,
                s.IsAlgorithmMatch,
                s.AbsentTeacherNameAtTimeOfService,
                s.AbsentTeacherSubjectAtTimeOfService,
                s.SubstituteTeacherNameAtTimeOfService,
                s.SubstituteTeacherSubjectAtTimeOfService,
                s.ClassNameAtTimeOfService,
                s.PeriodNumberAtTimeOfService);
    }
}
