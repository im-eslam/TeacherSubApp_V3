namespace TeacherSubApp.Api.Data.Models
{
    public class Subject
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Teacher> Teachers { get; set; } = new List<Teacher>();
    }
}
