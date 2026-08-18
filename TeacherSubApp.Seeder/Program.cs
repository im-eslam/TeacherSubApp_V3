namespace TeacherSubApp.Seeder
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var config = new SeederConfig
            {
                ApiBaseUrl= "https://localhost:7199/api",
                StopOnError = false,
                PrintSuccessMessages = false
            };

            var seeder = new CsvSeederService(config);
            await seeder.RunAsync();
        }
    }
}