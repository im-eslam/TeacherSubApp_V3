using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.Substitutions.Dtos;

namespace TeacherSubApp.Api.Features.Substitutions
{
    public interface ISubstitutionService
    {
        // READ
        Task<Result<List<SubstitutionReadDto>>> GetAllAsync(SubstitutionQuery query);
        Task<Result<SubstitutionReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<SubstitutionReadDto>> CreateAsync(SubstitutionWriteDto dto);
        Task<Result<SubstitutionReadDto>> UpdateAsync(int id, SubstitutionWriteDto dto);
        Task<Result> DeleteAsync(int id);
    }
}
