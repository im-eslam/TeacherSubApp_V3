namespace TeacherSubApp.Api.Data.Models
{
    public class SchoolClass
    {
        public int Id { get; set; }

        public int? Grade { get; set; }
        public int? Section { get; set; }
        public string DisplayName { get; set; } = string.Empty;

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } 
        public DateTime UpdatedAt { get; set; } 

        // Navigation
        public ICollection<WeeklySchedule> WeeklySchedules { get; set; } = new List<WeeklySchedule>();
    }
}
