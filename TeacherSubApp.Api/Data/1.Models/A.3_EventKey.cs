namespace TeacherSubApp.Api.Data.Models
{
    public class EventKey
    {
        public int Id { get; set; }

        public string EventName { get; set; } = string.Empty;
        public bool IsSupport { get; set; }
        public bool IsStandby { get; set; }

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public ICollection<WeeklySchedule> WeeklySchedules { get; set; } = new List<WeeklySchedule>();
    }
}
