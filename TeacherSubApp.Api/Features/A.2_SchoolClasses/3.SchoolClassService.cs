using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.SchoolClasses.Dtos;

namespace TeacherSubApp.Api.Features.SchoolClasses
{
    public class SchoolClassService : ISchoolClassService
    {
        private readonly AppDbContext _db;
        public SchoolClassService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<SchoolClassReadDto>>> GetAllAsync(SchoolClassQuery query)
        {
            var list = await _FetchAllActiveAsync(query);
            return Result<List<SchoolClassReadDto>>.Success(list);
        }

        public async Task<Result<SchoolClassReadDto>> GetByIdAsync(int id)
        {
            SchoolClass? entity = await _FindActiveByIdAsync(id);

            return (entity is null) 
                ? Result<SchoolClassReadDto>.Failure(ErrorType.NotFound, SchoolClassErrors.NotFound)
                : Result<SchoolClassReadDto>.Success(SchoolClassReadDto.FromEntity(entity));
        }

        public async Task<Result<SchoolClassReadDto>> CreateAsync(SchoolClassWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckDisplayNameConflictAsync(dto.DisplayName, null),
                () => _CheckGradeSectionPairRuleAsync(dto.Grade, dto.Section),
                () => _CheckGradeSectionConflictAsync(dto.Grade, dto.Section, null)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SchoolClassReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            SchoolClass created = await _PersistNewAsync(dto);
            return Result<SchoolClassReadDto>.Success(SchoolClassReadDto.FromEntity(created));
        }

        public async Task<Result<SchoolClassReadDto>> UpdateAsync(int id, SchoolClassWriteDto dto)
        {
            SchoolClass? entity = await _FindActiveByIdAsync(id);
            if (entity is null)
            {
                return Result<SchoolClassReadDto>.Failure(ErrorType.NotFound, SchoolClassErrors.NotFound);
            }

            (bool nameChanged, bool gradeSecChanged) = _DetectChanges(entity, dto);
            if (!nameChanged && !gradeSecChanged)
            {
                return Result<SchoolClassReadDto>.Success(SchoolClassReadDto.FromEntity(entity));
            }

            List<Func<Task<Result>>> rules = [];
            if (nameChanged)
            {
                rules.Add(() => _CheckDisplayNameConflictAsync(dto.DisplayName, id));
            }
            if (gradeSecChanged)
            {
                rules.Add(() => _CheckGradeSectionPairRuleAsync(dto.Grade, dto.Section));
                rules.Add(() => _CheckGradeSectionConflictAsync(dto.Grade, dto.Section, id));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SchoolClassReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            SchoolClass updated = await _ApplyUpdateAsync(entity, dto);
            return Result<SchoolClassReadDto>.Success(SchoolClassReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            SchoolClass? entity = await _FindActiveByIdAsync(id);
            if (entity is null)
            { 
                return Result.Failure(ErrorType.NotFound, SchoolClassErrors.NotFound);
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                await _CascadeSoftDeleteWeeklySchedulesAsync(id);
                await _SoftDeleteAsync(entity);

                await tx.CommitAsync();
                return Result.Success();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<Result<List<int>>> GetUniqueGradesAsync()
        {
            List<int> grades = await _db.Classes.AsNoTracking()
                .Where(c => c.DeletedAt == null && c.Grade != null)
                .Select(c => c.Grade!.Value)
                .Distinct()
                .OrderBy(g => g)
                .ToListAsync();

            return Result<List<int>>.Success(grades);
        }

        public async Task<Result<List<int>>> GetUniqueSectionsForGradeAsync(int grade)
        {
            List<int> sections = await _db.Classes.AsNoTracking()
                .Where(c => c.DeletedAt == null && c.Grade == grade && c.Section != null)
                .Select(c => c.Section!.Value)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();

            return Result<List<int>>.Success(sections);
        }

        #region === Helper Methods ===

        // Read 
        private async Task<List<SchoolClassReadDto>> _FetchAllActiveAsync(SchoolClassQuery query)
        {
            IQueryable<SchoolClass> q = _db.Classes.AsNoTracking()
                                                   .Where(c => c.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(query.DisplayName))
                q = q.Where(c => EF.Functions.ILike(c.DisplayName, $"%{query.DisplayName.Trim()}%"));

            if (query.Grade.HasValue)
                q = q.Where(c => c.Grade == query.Grade);

            if (query.Section.HasValue)
                q = q.Where(c => c.Section == query.Section);

            return await q.OrderBy(c => c.DisplayName)
                          .Select(SchoolClassReadDto.ToDtoProjection)
                          .ToListAsync();
        }

        private Task<SchoolClass?> _FindActiveByIdAsync(int id) =>
            _db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

        // Validation 
        private async Task<Result> _CheckDisplayNameConflictAsync(string name, int? excludeId)
        {
            string clean = name.Trim().ToLower();
            bool taken = await _db.Classes
                .AnyAsync(c => c.DeletedAt == null
                && c.DisplayName.ToLower() == clean
                && (excludeId == null || c.Id != excludeId));

            return taken
                ? Result.Failure(ErrorType.Conflict, SchoolClassErrors.NameExists)
                : Result.Success();
        }

        private Task<Result> _CheckGradeSectionPairRuleAsync(int? grade, int? section)
        {
            bool pairValid = (grade is null && section is null) ||
                             (grade is not null && section is not null);

            return pairValid
                ? Task.FromResult(Result.Success())
                : Task.FromResult(Result.Failure(ErrorType.Validation, SchoolClassErrors.GradeSectionPairRequired));
        }

        private async Task<Result> _CheckGradeSectionConflictAsync(int? grade, int? section, int? excludeId)
        {
            if (grade is null || section is null)
                return Result.Success();

            bool taken = await _db.Classes
                .AnyAsync(c => c.DeletedAt == null
                && c.Grade == grade
                && c.Section == section
                && (excludeId == null || c.Id != excludeId));

            return taken
                ? Result.Failure(ErrorType.Conflict, SchoolClassErrors.GradeSectionExists)
                : Result.Success();
        }

        // State 
        private static (bool NameChanged, bool GradeSecChanged) _DetectChanges(SchoolClass entity, SchoolClassWriteDto dto)
        {
            bool nameChanged = !string.Equals(entity.DisplayName.Trim(), dto.DisplayName.Trim(), StringComparison.OrdinalIgnoreCase);
            bool gradeSecChanged = entity.Grade != dto.Grade || entity.Section != dto.Section;

            return (nameChanged, gradeSecChanged);
        }

        // Persistence 
        private async Task<SchoolClass> _PersistNewAsync(SchoolClassWriteDto dto)
        {
            var entity = SchoolClassWriteDto.ToEntity(dto);
            _db.Classes.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        private async Task<SchoolClass> _ApplyUpdateAsync(SchoolClass entity, SchoolClassWriteDto dto)
        {
            entity.DisplayName = dto.DisplayName.Trim();
            entity.Grade = dto.Grade;
            entity.Section = dto.Section;

            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return entity;
        }

        // Delete 
        private async Task _CascadeSoftDeleteWeeklySchedulesAsync(int classId)
        {
            DateTime now = DateTime.UtcNow;

            await _db.WeeklySchedules
                     .Where(ws => ws.ClassId == classId && ws.DeletedAt == null)
                     .ExecuteUpdateAsync(setters => setters
                         .SetProperty(ws => ws.DeletedAt, now)
                         .SetProperty(ws => ws.UpdatedAt, now));
        }

        private async Task _SoftDeleteAsync(SchoolClass entity)
        {
            entity.DeletedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}