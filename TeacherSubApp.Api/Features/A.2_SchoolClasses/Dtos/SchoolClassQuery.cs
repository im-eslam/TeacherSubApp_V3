namespace TeacherSubApp.Api.Features.SchoolClasses.Dtos
{
    public sealed record SchoolClassQuery
    {
        public string? DisplayName { get; init; }
        public int? Grade { get; init; }
        public int? Section { get; init; }
    }
}