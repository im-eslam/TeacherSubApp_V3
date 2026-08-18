namespace TeacherSubApp.Api.Data.Models
{
    public class TeacherAbsence
    {
        public int Id { get; set; }

        public int TeacherId { get; set; }
        public DateOnly AbsenceDate { get; set; }
        public string? Reason { get; set; }

        // Audit & Soft-Delete Timestamps
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Teacher Teacher { get; set; } = null!;
        public ICollection<Substitution> Substitutions { get; set; } = new List<Substitution>();
    }
}
