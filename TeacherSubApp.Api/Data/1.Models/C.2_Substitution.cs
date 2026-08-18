namespace TeacherSubApp.Api.Data.Models
{
    public class Substitution
    {
        public int Id { get; set; }

        public int AbsenceId { get; set; }
        public int WeeklyScheduleId { get; set; }
        public int SubstituteTeacherId { get; set; }
        public DateOnly ServiceDate { get; set; }

        public bool IsAlgorithmMatch { get; set; } = true;

        // Snapshoots
        public string AbsentTeacherNameAtTimeOfService { get; set; } = string.Empty;
        public string AbsentTeacherSubjectAtTimeOfService { get; set; } = string.Empty;

        public string SubstituteTeacherNameAtTimeOfService { get; set; } = string.Empty;
        public string SubstituteTeacherSubjectAtTimeOfService { get; set; } = string.Empty;

        public string ClassNameAtTimeOfService { get; set; } = string.Empty;
        public int PeriodNumberAtTimeOfService { get; set; }

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public TeacherAbsence TeacherAbsence { get; set; } = null!;
        public WeeklySchedule WeeklySchedule { get; set; } = null!;
        public Teacher SubstituteTeacher { get; set; } = null!;
    }
}
