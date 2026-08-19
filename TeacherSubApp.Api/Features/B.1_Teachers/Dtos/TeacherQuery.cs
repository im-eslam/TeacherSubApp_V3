namespace TeacherSubApp.Api.Features.Teachers.Dtos
{
    public sealed record TeacherQuery
    {
        public string? Name { get; init; }
        public int? SubjectId { get; init; }
        public bool? IsSupervisor { get; init; }
    }
}