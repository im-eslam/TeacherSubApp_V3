namespace TeacherSubApp.Api.Data.Models
{
    public class SubstitutionAlgorithmSetting
    {
        public int Id { get; set; }

        public double SubjectMatchWeight { get; set; }
        public double WeeklyLoadWeight { get; set; }
        public double DailyLoadWeight { get; set; }
        public double StandByWeight { get; set; }
        public double SubbedYesterdayWeight { get; set; }
        public double ConsecutiveClassWeight { get; set; }
        public double EarlyLeaveWeight { get; set; }

        public int OvertimeThreshold { get; set; }
        public int LowLoadThreshold { get; set; }
        public int DailyLoadThreshold { get; set; }
        public int RestPeriodBreak { get; set; }
    }
}