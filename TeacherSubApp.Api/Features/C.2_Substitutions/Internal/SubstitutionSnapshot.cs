namespace TeacherSubApp.Api.Features.Substitutions.Internal
{
    public class SubstitutionSnapshot
    {
        public string AbsentTeacherName { get; }
        public string AbsentTeacherSubject { get; }

        public string SubstituteTeacherName { get; }
        public string SubstituteTeacherSubject { get; }

        public string ClassName { get; }
        public int PeriodNumber { get; set; }

        public SubstitutionSnapshot(
            string absentTeacherName,
            string absentTeacherSubject,
            string substituteTeacherName,
            string substituteTeacherSubject,
            string className,
            int periodNumber)
        {
            AbsentTeacherName = absentTeacherName;
            AbsentTeacherSubject = absentTeacherSubject;
            SubstituteTeacherName = substituteTeacherName;
            SubstituteTeacherSubject = substituteTeacherSubject;
            ClassName = className;
            PeriodNumber = periodNumber;
        }

        public static SubstitutionSnapshot Empty()
        {
            return new SubstitutionSnapshot(
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                0);
        }
    }
}