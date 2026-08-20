public sealed class SubstitutionChangeSet
{
    public bool AbsenceChanged { get; }
    public bool WeeklyScheduleChanged { get; }
    public bool SubstituteTeacherChanged { get; }
    public bool ServiceDateChanged { get; }
    public bool AlgorithmMatchChanged { get; }

    public SubstitutionChangeSet(
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
}