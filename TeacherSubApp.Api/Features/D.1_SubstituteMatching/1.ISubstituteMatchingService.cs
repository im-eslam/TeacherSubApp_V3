using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    public interface ISubstituteMatchingService
    {
        Task<Result<AlgorithmSettingsDto>> GetSettingsAsync();
        Task<Result> UpdateSettingsAsync(AlgorithmSettingsDto dto);

        Task<Result<List<SubstituteCandidateDto>>> GetRecommendationsAsync(SubstituteMatchQuery query);
    }
}
