using TeacherSubApp.Api.Features.SubstituteMatching.Enums;

namespace TeacherSubApp.Api.Features.SubstituteMatching.Dtos
{
    public sealed record SubstituteCandidateDto
    {
        public int TeacherId { get; init; }
        public string TeacherName { get; init; } = string.Empty;
        public string SubjectName { get; init; } = string.Empty;

        public CandidateTier Tier { get; init; }
        public double TotalScore { get; init; }

        public List<string> Pros { get; init; } = new();
        public List<string> Cons { get; init; } = new();
    }
}
