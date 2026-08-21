using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.TeacherAbsences.Dtos;

namespace TeacherSubApp.Api.Features.TeacherAbsences
{
    public class TeacherAbsenceService : ITeacherAbsenceService
    {
        private readonly AppDbContext _db;
        public TeacherAbsenceService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<TeacherAbsenceReadDto>>> GetAllAsync(TeacherAbsenceQuery query)
        {
            List<TeacherAbsenceReadDto> absences = await _FetchAllActiveAsync(query);
            return Result<List<TeacherAbsenceReadDto>>.Success(absences);
        }

        public async Task<Result<TeacherAbsenceReadDto>> GetByIdAsync(int id)
        {
            TeacherAbsence? absence = await _FindActiveByIdWithTeacherAsync(id);

            return absence is null
                ? Result<TeacherAbsenceReadDto>.Failure(ErrorType.NotFound, TeacherAbsenceErrors.NotFound)
                : Result<TeacherAbsenceReadDto>.Success(TeacherAbsenceReadDto.FromEntity(absence));
        }

        public async Task<Result<TeacherAbsenceReadDto>> CreateAsync(TeacherAbsenceWriteDto dto)
        {
            List<Func<Task<Result>>> rules =
            [
                () => _CheckTeacherActiveAsync(dto.TeacherId),
                () => _CheckDateConflictAsync(dto.TeacherId, dto.AbsenceDate, excludeId: null)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<TeacherAbsenceReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            TeacherAbsence created = await _PersistNewAsync(dto);
            return Result<TeacherAbsenceReadDto>.Success(TeacherAbsenceReadDto.FromEntity(created));
        }

        public async Task<Result<TeacherAbsenceReadDto>> UpdateAsync(int id, TeacherAbsenceWriteDto dto)
        {
            TeacherAbsence? absence = await _FindActiveByIdWithTeacherAsync(id);
            if (absence is null)
            {
                return Result<TeacherAbsenceReadDto>.Failure(ErrorType.NotFound, TeacherAbsenceErrors.NotFound);
            }

            (bool teacherChanged, bool dateChanged, bool reasonChanged) = _DetectChanges(absence, dto);
            if (!teacherChanged && !dateChanged && !reasonChanged)
            {
                return Result<TeacherAbsenceReadDto>.Success(TeacherAbsenceReadDto.FromEntity(absence));
            }

            List<Func<Task<Result>>> rules = [];
            if (teacherChanged)
            {
                rules.Add(() => _CheckTeacherActiveAsync(dto.TeacherId));
            }
            if (teacherChanged || dateChanged)
            {
                rules.Add(() => _CheckDateConflictAsync(dto.TeacherId, dto.AbsenceDate, id));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<TeacherAbsenceReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            TeacherAbsence updated = await _ApplyUpdateAsync(absence, dto);
            return Result<TeacherAbsenceReadDto>.Success(TeacherAbsenceReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            TeacherAbsence? absence = await _FindActiveByIdAsync(id);
            if (absence is null)
            {
                return Result.Failure(ErrorType.NotFound, TeacherAbsenceErrors.NotFound);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                await _CascadeSoftDeleteSubstitutionsAsync(id);
                await _SoftDeleteAsync(absence);

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
        private async Task<List<TeacherAbsenceReadDto>> _FetchAllActiveAsync(TeacherAbsenceQuery query)
        {
            IQueryable<TeacherAbsence> q = _db.TeacherAbsences.AsNoTracking().Where(a => a.DeletedAt == null);

            if (query.TeacherId.HasValue)
                q = q.Where(a => a.TeacherId == query.TeacherId.Value);

            if (query.FromDate.HasValue)
                q = q.Where(a => a.AbsenceDate >= query.FromDate.Value);

            if (query.ToDate.HasValue)
                q = q.Where(a => a.AbsenceDate <= query.ToDate.Value);

            return await q
                .OrderByDescending(a => a.AbsenceDate)
                .ThenBy(a => a.TeacherId)
                .Select(TeacherAbsenceReadDto.ToDtoProjection)
                .ToListAsync();
        }

        private Task<TeacherAbsence?> _FindActiveByIdAsync(int id)
        {
            return _db.TeacherAbsences.FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null);
        }

        private Task<TeacherAbsence?> _FindActiveByIdWithTeacherAsync(int id)
        {
            return _db.TeacherAbsences
                .Include(a => a.Teacher)
                .FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null);
        }

        // Validation
        private async Task<Result> _CheckTeacherActiveAsync(int teacherId)
        {
            bool teacherValid = await _db.Teachers
                .AnyAsync(t => t.Id == teacherId && t.DeletedAt == null);

            return teacherValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, TeacherAbsenceErrors.TeacherInvalid);
        }

        private async Task<Result> _CheckDateConflictAsync(int teacherId, DateOnly absenceDate, int? excludeId)
        {
            bool dateTaken = await _db.TeacherAbsences
                .AnyAsync(a => a.DeletedAt == null
                            && a.TeacherId == teacherId
                            && a.AbsenceDate == absenceDate
                            && (!excludeId.HasValue || a.Id != excludeId.Value));

            return dateTaken
                ? Result.Failure(ErrorType.Conflict, TeacherAbsenceErrors.DateConflict)
                : Result.Success();
        }

        // State
        private static (bool TeacherChanged, bool DateChanged, bool ReasonChanged) _DetectChanges(TeacherAbsence absence, TeacherAbsenceWriteDto dto)
        {
            bool teacherChanged = absence.TeacherId != dto.TeacherId;
            bool dateChanged = absence.AbsenceDate != dto.AbsenceDate;
            bool reasonChanged = !string.Equals(
                absence.Reason?.Trim(),
                dto.Reason?.Trim(),
                StringComparison.OrdinalIgnoreCase);

            return (teacherChanged, dateChanged, reasonChanged);
        }

        // Create / Update
        private async Task<TeacherAbsence> _PersistNewAsync(TeacherAbsenceWriteDto dto)
        {
            TeacherAbsence entity = dto.ToEntity();
            _db.TeacherAbsences.Add(entity);

            await _db.SaveChangesAsync();
            await _LoadTeacherNavigationAsync(entity);

            return entity;
        }

        private async Task<TeacherAbsence> _ApplyUpdateAsync(TeacherAbsence absence, TeacherAbsenceWriteDto dto)
        {
            absence.TeacherId = dto.TeacherId;
            absence.AbsenceDate = dto.AbsenceDate;
            absence.Reason = dto.Reason?.Trim();

            absence.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await _LoadTeacherNavigationAsync(absence);

            return absence;
        }

        private async Task _LoadTeacherNavigationAsync(TeacherAbsence absence)
        {
            if (absence.Teacher == null || absence.Teacher.Id != absence.TeacherId)
            {
                absence.Teacher = (await _db.Teachers.AsNoTracking().FirstOrDefaultAsync(t => t.Id == absence.TeacherId))!;
            }
        }

        // Delete
        private async Task _CascadeSoftDeleteSubstitutionsAsync(int absenceId)
        {
            DateTime now = DateTime.UtcNow;

            await _db.Substitutions
                .Where(s => s.AbsenceId == absenceId && s.DeletedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.DeletedAt, now)
                    .SetProperty(s => s.UpdatedAt, now));
        }

        private async Task _SoftDeleteAsync(TeacherAbsence absence)
        {
            absence.DeletedAt = DateTime.UtcNow;
            absence.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}
