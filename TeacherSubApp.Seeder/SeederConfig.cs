namespace TeacherSubApp.Seeder
{
    public class SeederConfig
    {
        public string ApiBaseUrl { get; set; } = "https://localhost:5130/api";
        public bool StopOnError { get; set; } = false;
        public bool PrintSuccessMessages { get; set; } = false;
    }
}
