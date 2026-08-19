namespace TeacherSubApp.Api.Data.Models
{
    public class Subject
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public ICollection<Teacher> Teachers { get; set; } = new List<Teacher>();
    }
}
