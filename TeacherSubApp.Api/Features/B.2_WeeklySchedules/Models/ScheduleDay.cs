namespace TeacherSubApp.Api.Features.WeeklySchedules.Models
{
    public static class ScheduleDay
    {
        private static readonly Dictionary<int, (string En, string Ar)> Names = new()
        {
            [1] = ("Sunday", "الأحد"),
            [2] = ("Monday", "الاثنين"),
            [3] = ("Tuesday", "الثلاثاء"),
            [4] = ("Wednesday", "الأربعاء"),
            [5] = ("Thursday", "الخميس")
        };

        public static string NameEn(int dayOfWeek) =>
            Names.TryGetValue(dayOfWeek, out var n) ? n.En : $"Day {dayOfWeek}";

        public static string NameAr(int dayOfWeek) =>
            Names.TryGetValue(dayOfWeek, out var n) ? n.Ar : $"يوم {dayOfWeek}";
    }
}
