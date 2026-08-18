using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Teachers.Dtos;

namespace TeacherSubApp.Api.Features.Teachers
{
    public class TeacherService : ITeacherService
    {
        private readonly AppDbContext _db;

        public TeacherService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<TeacherReadDto>>> GetAllAsync(TeacherQuery query)
        {
            List<TeacherReadDto> teachers = await _FetchAllActiveAsync(query);
            return Result<List<TeacherReadDto>>.Success(teachers);
        }

        public async Task<Result<TeacherReadDto>> GetByIdAsync(int id)
        {
            Teacher? teacher = await _FindActiveByIdWithSubjectAsync(id);

            return (teacher is null)
                ? Result<TeacherReadDto>.Failure(ErrorType.NotFound, TeacherErrors.NotFound)
                : Result<TeacherReadDto>.Success(TeacherReadDto.FromEntity(teacher));
        }

        public async Task<Result<TeacherReadDto>> CreateAsync(TeacherWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckNameConflictAsync(dto.Name, null),
                () => _CheckSubjectValidAsync(dto.SubjectId)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<TeacherReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Teacher created = await _PersistNewAsync(dto);
            return Result<TeacherReadDto>.Success(TeacherReadDto.FromEntity(created));
        }

        public async Task<Result<TeacherReadDto>> UpdateAsync(int id, TeacherWriteDto dto)
        {
            Teacher? teacher = await _FindActiveByIdWithSubjectAsync(id);
            if (teacher is null)
            {
                return Result<TeacherReadDto>.Failure(ErrorType.NotFound, TeacherErrors.NotFound);
            }

            (bool nameChanged, bool subjectChanged, bool supervisorChanged) = _DetectChanges(teacher, dto);
            if (!nameChanged && !subjectChanged && !supervisorChanged)
            {
                return Result<TeacherReadDto>.Success(TeacherReadDto.FromEntity(teacher));
            }

            List<Func<Task<Result>>> rules = [];
            if (nameChanged)
            {
                rules.Add(() => _CheckNameConflictAsync(dto.Name, id));
            }
            if (subjectChanged)
            {
                rules.Add(() => _CheckSubjectValidAsync(dto.SubjectId));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<TeacherReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Teacher updated = await _ApplyUpdateAsync(teacher, dto);
            return Result<TeacherReadDto>.Success(TeacherReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            Teacher? teacher = await _FindActiveByIdAsync(id);
            if (teacher is null)
            {
                return Result.Failure(ErrorType.NotFound, TeacherErrors.NotFound);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                await _CascadeSoftDeleteWeeklySchedulesAsync(id);
                await _SoftDeleteAsync(teacher);

                await transaction.CommitAsync();
                return Result.Success();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        #region === Helper Methods ===

        // Read
        private async Task<List<TeacherReadDto>> _FetchAllActiveAsync(TeacherQuery query)
        {
            IQueryable<Teacher> q = _db.Teachers.AsNoTracking().Where(t => t.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(query.Name))
                q = q.Where(t => EF.Functions.ILike(t.Name, $"%{query.Name.Trim()}%"));

            if (query.SubjectId.HasValue)
                q = q.Where(t => t.SubjectId == query.SubjectId.Value);

            if (query.IsSupervisor.HasValue)
                q = q.Where(t => t.IsSupervisor == query.IsSupervisor.Value);

            return await q
                .OrderBy(t => t.Name)
                .Select(TeacherReadDto.ToDtoProjection)
                .ToListAsync();
        }

        private Task<Teacher?> _FindActiveByIdAsync(int id)
        {
            return _db.Teachers.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);
        }

        private Task<Teacher?> _FindActiveByIdWithSubjectAsync(int id)
        {
            return _db.Teachers
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);
        }

        // Validation
        private async Task<Result> _CheckNameConflictAsync(string name, int? excludeId)
        {
            string clean = name.Trim();
            bool nameTaken = await _db.Teachers
                .AnyAsync(t => t.DeletedAt == null
                            && EF.Functions.ILike(t.Name, clean)
                            && (excludeId == null || t.Id != excludeId));

            return nameTaken
                ? Result.Failure(ErrorType.Conflict, TeacherErrors.NameExists)
                : Result.Success();
        }

        private async Task<Result> _CheckSubjectValidAsync(int? subjectId)
        {
            if (!subjectId.HasValue)
                return Result.Success();

            bool subjectValid = await _db.Subjects
                .AnyAsync(s => s.Id == subjectId.Value && s.DeletedAt == null);

            return subjectValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, TeacherErrors.SubjectInvalid);
        }

        // State
        private static (bool NameChanged, bool SubjectChanged, bool SupervisorChanged) _DetectChanges(Teacher teacher, TeacherWriteDto dto)
        {
            bool nameChanged = !string.Equals(teacher.Name.Trim(), dto.Name.Trim(), StringComparison.OrdinalIgnoreCase);
            bool subjectChanged = teacher.SubjectId != dto.SubjectId;
            bool supervisorChanged = teacher.IsSupervisor != dto.IsSupervisor;

            return (nameChanged, subjectChanged, supervisorChanged);
        }

        // Create / Update
        private async Task<Teacher> _PersistNewAsync(TeacherWriteDto dto)
        {
            Teacher entity = TeacherWriteDto.ToEntity(dto);
            _db.Teachers.Add(entity);
            await _db.SaveChangesAsync();

            if (entity.SubjectId.HasValue)
            {
                entity.Subject = await _db.Subjects
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == entity.SubjectId.Value);
            }

            return entity;
        }

        private async Task<Teacher> _ApplyUpdateAsync(Teacher teacher, TeacherWriteDto dto)
        {
            teacher.Name = dto.Name.Trim();
            teacher.SubjectId = dto.SubjectId;
            teacher.IsSupervisor = dto.IsSupervisor;

            teacher.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            if (teacher.SubjectId.HasValue && (teacher.Subject == null || teacher.Subject.Id != teacher.SubjectId))
            {
                teacher.Subject = await _db.Subjects
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == teacher.SubjectId.Value);
            }
            else if (!teacher.SubjectId.HasValue)
            {
                teacher.Subject = null;
            }

            return teacher;
        }

        // Delete
        private async Task _CascadeSoftDeleteWeeklySchedulesAsync(int teacherId)
        {
            DateTime now = DateTime.UtcNow;
            await _db.WeeklySchedules
                .Where(ws => ws.TeacherId == teacherId && ws.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(ws => ws.DeletedAt, now)
                    .SetProperty(ws => ws.UpdatedAt, now));
        }

        private async Task _SoftDeleteAsync(Teacher teacher)
        {
            teacher.DeletedAt = DateTime.UtcNow;
            teacher.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}