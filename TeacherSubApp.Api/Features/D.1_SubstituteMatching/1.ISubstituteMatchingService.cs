using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    public interface ISubstituteMatchingService
    {
        // Settings
        Task<Result<AlgorithmSettingsDto>> GetSettingsAsync();
        Task<Result> UpdateSettingsAsync(AlgorithmSettingsDto dto);

        // Recommendations
        Task<Result<List<SubstituteCandidateDto>>> GetRecommendationsAsync(SubstituteMatchQuery query);
    }
}
