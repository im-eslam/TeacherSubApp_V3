using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Features.SchoolClasses.Dtos;

namespace TeacherSubApp.Api.Features.SchoolClasses
{
    public interface ISchoolClassService
    {
        // READ
        Task<Result<List<SchoolClassReadDto>>> GetAllAsync(SchoolClassQuery query);
        Task<Result<SchoolClassReadDto>> GetByIdAsync(int id);

        // CREATE, UPDATE, DELETE
        Task<Result<SchoolClassReadDto>> CreateAsync(SchoolClassWriteDto dto);
        Task<Result<SchoolClassReadDto>> UpdateAsync(int id, SchoolClassWriteDto dto);
        Task<Result> DeleteAsync(int id);

        // DROP DOWNs
        Task<Result<List<int>>> GetUniqueGradesAsync();
        Task<Result<List<int>>> GetUniqueSectionsForGradeAsync(int grade);
    }
}