namespace TeacherSubApp.Api.Features.EventKeys.Dtos
{
    public record EventKeyQuery
    {
        public string? EventName { get; init; }
        public bool? IsSupport { get; init; }
        public bool? IsStandby { get; init; }
    }
}