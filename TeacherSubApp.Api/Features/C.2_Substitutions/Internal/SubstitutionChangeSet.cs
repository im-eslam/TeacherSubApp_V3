namespace TeacherSubApp.Api.Features.Substitutions.Dtos
{
    public sealed class SubstitutionChangeSet
    {
        public bool AbsenceChanged { get; set; }
        public bool WeeklyScheduleChanged { get; set; }
        public bool SubstituteTeacherChanged { get; set; }
        public bool ServiceDateChanged { get; set; }
        public bool AlgorithmMatchChanged { get; set; }

        public bool Any =>
            AbsenceChanged
            || WeeklyScheduleChanged
            || SubstituteTeacherChanged
            || ServiceDateChanged
            || AlgorithmMatchChanged;
    }
}