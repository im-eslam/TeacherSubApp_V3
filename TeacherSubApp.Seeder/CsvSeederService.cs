using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using TeacherSubApp.Api.Features.EventKeys.Dtos;
using TeacherSubApp.Api.Features.SchoolClasses.Dtos;
using TeacherSubApp.Api.Features.Subjects.Dtos;
using TeacherSubApp.Api.Features.Teachers.Dtos;

namespace TeacherSubApp.Seeder
{
    public class CsvSeederService
    {
        private readonly HttpClient _http;
        private readonly SeederConfig _config;

        private readonly Dictionary<string, int> _subjectMap = new();
        private readonly Dictionary<string, int> _classMap = new();
        private readonly Dictionary<string, int> _eventMap = new();
        private readonly Dictionary<string, int> _teacherMap = new();

        public CsvSeederService(SeederConfig config)
        {
            _config = config;
            _http = new HttpClient();
        }

        public async Task RunAsync()
        {
            Console.WriteLine("🚀 Initializing Strongly-Typed Data Seeder...");

            try
            {
                await SeedSubjectsAsync();
                await SeedClassesAsync();
                await SeedEventKeysAsync();
                await SeedTeachersAsync();
                await SeedTimetableAsync();

                Console.WriteLine("\n✅✅ SEEDING COMPLETE! ✅✅");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ SEEDER HALTED: {ex.Message}");
            }
        }

        private async Task SeedSubjectsAsync()
        {
            Console.WriteLine("\n--- Seeding Subjects ---");
            var rows = ReadCsv<dynamic>("CsvData/Subjects.csv");
            foreach (var row in rows)
            {
                string name = row.Name;
                var dto = new SubjectWriteDto { Name = name.Trim() };
                int? id = await PostAndGetIdAsync("/subjects", dto);
                if (id.HasValue)
                    _subjectMap[name.Trim()] = id.Value;
            }
        }

        private async Task SeedClassesAsync()
        {
            Console.WriteLine("\n--- Seeding Classes ---");
            var rows = ReadCsv<dynamic>("CsvData/Classes.csv");
            foreach (var row in rows)
            {
                string displayName = row.DisplayName;
                var dto = new SchoolClassWriteDto
                {
                    DisplayName = displayName.Trim(),
                    Grade = int.Parse((string)row.Grade),
                    Section = int.Parse((string)row.Section)
                };
                int? id = await PostAndGetIdAsync("/classes", dto);
                if (id.HasValue)
                    _classMap[displayName.Trim()] = id.Value;
            }
        }

        private async Task SeedEventKeysAsync()
        {
            Console.WriteLine("\n--- Seeding Event Keys ---");
            var rows = ReadCsv<dynamic>("CsvData/EventKeys.csv");
            foreach (var row in rows)
            {
                string eventName = row.EventName;
                var dto = new EventKeyWriteDto
                {
                    EventName = eventName.Trim(),
                    IsSupport = bool.Parse((string)row.IsSupport),
                    IsStandby = bool.Parse((string)row.IsStandby)
                };
                int? id = await PostAndGetIdAsync("/events", dto);
                if (id.HasValue)
                    _eventMap[eventName.Trim()] = id.Value;
            }
        }

        private async Task SeedTeachersAsync()
        {
            Console.WriteLine("\n--- Seeding Teachers ---");
            var rows = ReadCsv<dynamic>("CsvData/Teachers.csv");
            foreach (var row in rows)
            {
                string name = row.Name;
                string subjectName = row.SubjectName;

                int? subjectId = null;
                if (!string.IsNullOrWhiteSpace(subjectName) && _subjectMap.TryGetValue(subjectName.Trim(), out int mappedSubjectId))
                {
                    subjectId = mappedSubjectId;
                }

                var dto = new TeacherWriteDto
                {
                    Name = name.Trim(),
                    SubjectId = subjectId,
                    IsSupervisor = bool.Parse((string)row.IsSupervisor)
                };
                int? id = await PostAndGetIdAsync("/teachers", dto);
                if (id.HasValue)
                    _teacherMap[name.Trim()] = id.Value;
            }
        }

        private async Task SeedTimetableAsync()
        {
            //Console.WriteLine("\n--- Seeding Timetable (Bulk) ---");
            //var rows = ReadCsv<dynamic>("CsvData/Timetable.csv");

            //var bulkDto = new WeeklyScheduleBulkUpdateDto();

            //foreach (var row in rows)
            //{
            //    string teacherName = row.TeacherName;
            //    if (string.IsNullOrWhiteSpace(teacherName))
            //        continue;

            //    string className = row.ClassDisplayName;
            //    string eventName = row.EventName;

            //    if (!_teacherMap.TryGetValue(teacherName.Trim(), out int teacherId))
            //    {
            //        Console.WriteLine($"[SKIPPED] Teacher '{teacherName}' not found in DB.");
            //        continue;
            //    }

            //    var addDto = new WeeklyScheduleAddDto
            //    {
            //        TeacherId = teacherId,
            //        DayOfWeek = int.Parse((string)row.DayOfWeek),
            //        PeriodNumber = int.Parse((string)row.PeriodNumber),
            //        ClassId = !string.IsNullOrWhiteSpace(className) && _classMap.ContainsKey(className.Trim()) ? _classMap[className.Trim()] : null,
            //        EventId = !string.IsNullOrWhiteSpace(eventName) && _eventMap.ContainsKey(eventName.Trim()) ? _eventMap[eventName.Trim()] : null
            //    };

            //    bulkDto.Adds.Add(addDto);
            //}

            //if (bulkDto.Adds.Count > 0)
            //{
            //    Console.WriteLine($"Sending bulk update with {bulkDto.Adds.Count} schedules...");
            //    await PutBulkAsync("/schedules/bulk", bulkDto);
            //}
            //else
            //{
            //    Console.WriteLine("No schedules to insert.");
            //}
        }

        private async Task PutBulkAsync(string endpoint, object payload)
        {
            string url = $"{_config.ApiBaseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            var response = await _http.PutAsJsonAsync(url, payload);

            if (!response.IsSuccessStatusCode)
            {
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"\n[HTTP ERROR] BULK FAIL on {url}");
                Console.WriteLine($"   Raw Response: {responseBody}");

                if (_config.StopOnError)
                    throw new Exception($"Bulk HTTP Error on {url}");
            }
            else
            {
                if (_config.PrintSuccessMessages)
                    Console.WriteLine($"[SUCCESS] {url} -> Bulk Inserted Successfully!");
            }
        }

        private List<T> ReadCsv<T>(string filePath)
        {
            using var reader = new StreamReader(filePath, System.Text.Encoding.UTF8);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true });
            return new List<T>(csv.GetRecords<T>());
        }

        private async Task<int?> PostAndGetIdAsync(string endpoint, object payload)
        {
            string url = $"{_config.ApiBaseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            var response = await _http.PostAsJsonAsync(url, payload);
            string responseBody = await response.Content.ReadAsStringAsync();
            string payloadString = JsonSerializer.Serialize(payload);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"\n[HTTP ERROR] {url} \n   Data: {payloadString} \n   Raw Response: {responseBody}");
                if (_config.StopOnError)
                    throw new Exception($"HTTP Error on {url}");
                return null;
            }

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("isSuccess", out var isSuccessProp) || root.TryGetProperty("IsSuccess", out isSuccessProp))
            {
                if (isSuccessProp.GetBoolean())
                {
                    if (root.TryGetProperty("value", out var val) || root.TryGetProperty("Value", out val))
                    {
                        int id = val.ValueKind == JsonValueKind.Number ? val.GetInt32() :
                                 (val.TryGetProperty("id", out var idProp) || val.TryGetProperty("Id", out idProp)) ? idProp.GetInt32() : 0;

                        if (id != 0)
                        {
                            if (_config.PrintSuccessMessages)
                                Console.WriteLine($"[SUCCESS] {url} -> Inserted ID: {id}");
                            return id;
                        }
                    }
                }
                else
                {
                    string error = root.TryGetProperty("errorMessage", out var err) ? err.GetString() : "Unknown API Error";
                    Console.WriteLine($"\n[API REJECTED] {url} \n   Data: {payloadString} \n   Error: {error}");
                    if (_config.StopOnError)
                        throw new Exception($"API Rejected: {error}");
                    return null;
                }
            }
            else if (root.TryGetProperty("id", out var idProp) || root.TryGetProperty("Id", out idProp))
            {
                int id = idProp.GetInt32();
                if (_config.PrintSuccessMessages)
                    Console.WriteLine($"[SUCCESS] {url} -> Inserted ID: {id}");
                return id;
            }

            Console.WriteLine($"\n[PARSE FAILED] API succeeded but ID not found! {url}\n   Raw Response: {responseBody}");
            return null;
        }
    }

}
