using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Substitutions.Dtos;

namespace TeacherSubApp.Api.Features.Substitutions.Internal
{
    public sealed class SubstitutionChangeSet
    {
        public bool AbsenceChanged { get; }
        public bool WeeklyScheduleChanged { get; }
        public bool SubstituteTeacherChanged { get; }
        public bool ServiceDateChanged { get; }
        public bool AlgorithmMatchChanged { get; }

        private SubstitutionChangeSet(
            bool absenceChanged,
            bool weeklyScheduleChanged,
            bool substituteTeacherChanged,
            bool serviceDateChanged,
            bool algorithmMatchChanged)
        {
            AbsenceChanged = absenceChanged;
            WeeklyScheduleChanged = weeklyScheduleChanged;
            SubstituteTeacherChanged = substituteTeacherChanged;
            ServiceDateChanged = serviceDateChanged;
            AlgorithmMatchChanged = algorithmMatchChanged;
        }

        public bool Any =>
            AbsenceChanged
            || WeeklyScheduleChanged
            || SubstituteTeacherChanged
            || ServiceDateChanged
            || AlgorithmMatchChanged;

        public static SubstitutionChangeSet Detect(Substitution substitution, SubstitutionWriteDto dto)
        {
            return new SubstitutionChangeSet(
                absenceChanged: substitution.AbsenceId != dto.AbsenceId,
                weeklyScheduleChanged: substitution.WeeklyScheduleId != dto.WeeklyScheduleId,
                substituteTeacherChanged: substitution.SubstituteTeacherId != dto.SubstituteTeacherId,
                serviceDateChanged: substitution.ServiceDate != dto.ServiceDate,
                algorithmMatchChanged: substitution.IsAlgorithmMatch != dto.IsAlgorithmMatch);
        }
    }
}