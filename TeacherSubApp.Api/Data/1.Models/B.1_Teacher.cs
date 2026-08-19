namespace TeacherSubApp.Api.Data.Models
{
    public class Teacher
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public int? SubjectId { get; set; }
        public bool IsSupervisor { get; set; }

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public Subject? Subject { get; set; }
        public ICollection<WeeklySchedule> WeeklySchedules { get; set; } = new List<WeeklySchedule>();
        public ICollection<TeacherAbsence> Absences { get; set; } = new List<TeacherAbsence>();
        public ICollection<Substitution> Substitutions { get; set; } = new List<Substitution>();
    }
}
