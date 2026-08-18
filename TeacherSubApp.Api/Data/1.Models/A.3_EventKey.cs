namespace TeacherSubApp.Api.Data.Models
{
    public class EventKey
    {
        public int Id { get; set; }

        public string EventName { get; set; } = string.Empty;

        public bool IsSupport { get; set; } = false;
        public bool IsStandby { get; set; } = false;

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<WeeklySchedule> WeeklySchedules { get; set; } = new List<WeeklySchedule>();
    }
}
