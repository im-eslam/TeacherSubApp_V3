namespace TeacherSubApp.Api.Features.Substitutions.Internal
{
    public class SubstitutionSnapshot
    {
        public string AbsentTeacherName { get; set; } = string.Empty;
        public string AbsentTeacherSubject { get; set; } = string.Empty;

        public string SubstituteTeacherName { get; set; } = string.Empty;
        public string SubstituteTeacherSubject { get; set; } = string.Empty;

        public string ClassName { get; set; } = string.Empty;
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