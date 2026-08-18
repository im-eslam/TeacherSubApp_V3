namespace TeacherSubApp.Api.Data.Models
{
    public class WeeklySchedule
    {
        public int Id { get; set; }

        public int TeacherId { get; set; }
        public int DayOfWeek { get; set; }
        public int PeriodNumber { get; set; }
        public int? ClassId { get; set; }
        public int? EventId { get; set; }

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Teacher Teacher { get; set; } = null!;
        public SchoolClass? SchoolClass { get; set; }
        public EventKey? EventKey { get; set; }
        public ICollection<Substitution> Substitutions { get; set; } = new List<Substitution>();
    }
}
