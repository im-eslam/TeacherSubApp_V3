using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Subjects.Dtos;

namespace TeacherSubApp.Api.Features.Subjects
{
    public class SubjectService : ISubjectService
    {
        private readonly AppDbContext _db;
        public SubjectService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<SubjectReadDto>>> GetAllAsync(SubjectQuery query)
        {
            List<SubjectReadDto> subjects = await _FetchAllActiveAsync(query);
            return Result<List<SubjectReadDto>>.Success(subjects);
        }

        public async Task<Result<SubjectReadDto>> GetByIdAsync(int id)
        {
            Subject? subject = await _FindActiveByIdAsync(id);

            return (subject is null)
                ? Result<SubjectReadDto>.Failure(ErrorType.NotFound, SubjectErrors.NotFound)
                : Result<SubjectReadDto>.Success(SubjectReadDto.FromEntity(subject));
        }

        public async Task<Result<SubjectReadDto>> CreateAsync(SubjectWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckNameConflictAsync(dto.Name, excludeId: null)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SubjectReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Subject created = await _PersistNewAsync(dto);
            return Result<SubjectReadDto>.Success(SubjectReadDto.FromEntity(created));
        }

        public async Task<Result<SubjectReadDto>> UpdateAsync(int id, SubjectWriteDto dto)
        {
            Subject? subject = await _FindActiveByIdAsync(id);
            if (subject is null)
            {
                return Result<SubjectReadDto>.Failure(ErrorType.NotFound, SubjectErrors.NotFound);
            }

            bool nameChanged = _DetectChanges(subject, dto);
            if (!nameChanged)
            {
                return Result<SubjectReadDto>.Success(SubjectReadDto.FromEntity(subject));
            }

            List<Func<Task<Result>>> rules = [];
            if (nameChanged)
            {
                rules.Add(() => _CheckNameConflictAsync(dto.Name, id));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SubjectReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Subject updated = await _ApplyUpdateAsync(subject, dto);
            return Result<SubjectReadDto>.Success(SubjectReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            Subject? subject = await _FindActiveByIdAsync(id);
            if (subject is null)
            {
                return Result.Failure(ErrorType.NotFound, SubjectErrors.NotFound);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                await _NullifyTeacherReferencesAsync(id);
                await _SoftDeleteAsync(subject);

                await transaction.CommitAsync();
                return Result.Success();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        #region === Helpers ===

        // Read
        private async Task<List<SubjectReadDto>> _FetchAllActiveAsync(SubjectQuery query)
        {
            IQueryable<Subject> q = _db.Subjects.AsNoTracking().Where(s => s.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(query.Name))
                q = q.Where(s => EF.Functions.ILike(s.Name, $"%{query.Name.Trim()}%"));

            return await q.OrderBy(s => s.Name).Select(SubjectReadDto.ToDtoProjection).ToListAsync();
        }

        private async Task<Subject?> _FindActiveByIdAsync(int id)
        {
            return await _db.Subjects.FirstOrDefaultAsync(s => s.Id == id && s.DeletedAt == null);
        }

        // Validation
        private async Task<Result> _CheckNameConflictAsync(string name, int? excludeId)
        {
            string normalizedName = name.Trim().ToLowerInvariant();

            bool nameTaken = await _db.Subjects
                .AnyAsync(s => s.DeletedAt == null
                            && s.Name.ToLower() == normalizedName
                            && (excludeId == null || s.Id != excludeId));

            return nameTaken
                ? Result.Failure(ErrorType.Conflict, SubjectErrors.NameExists)
                : Result.Success();
        }

        // State
        private static bool _DetectChanges(Subject subject, SubjectWriteDto wDto)
        {
            return !string.Equals(subject.Name.Trim(), wDto.Name.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        // Create / Update
        private async Task<Subject> _PersistNewAsync(SubjectWriteDto dto)
        {
            Subject entity = dto.ToEntity();
            _db.Subjects.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        private async Task<Subject> _ApplyUpdateAsync(Subject subject, SubjectWriteDto dto)
        {
            subject.Name = dto.Name.Trim();
            subject.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return subject;
        }

        // Delete
        private async Task _NullifyTeacherReferencesAsync(int subjectId)
        {
            await _db.Teachers
                .Where(t => t.SubjectId == subjectId && t.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(t => t.SubjectId, (int?)null)
                    .SetProperty(t => t.UpdatedAt, DateTime.UtcNow));
        }

        private async Task _SoftDeleteAsync(Subject subject)
        {
            subject.DeletedAt = DateTime.UtcNow;
            subject.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}
