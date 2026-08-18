using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Models
{
    public class MemoryState
    {
        public Dictionary<int, Teacher> TeachersDict { get; set; } = new();
        public Dictionary<int, SchoolClass> ClassesDict { get; set; } = new();
        public Dictionary<int, EventKey> EventsDict { get; set; } = new();
        public Dictionary<int, WeeklySchedule> TrackedUniverseSlots { get; set; } = new();
    }
}
