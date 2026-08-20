using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Substitutions.Dtos;

namespace TeacherSubApp.Api.Features.Substitutions
{
    public class SubstitutionService : ISubstitutionService
    {
        private readonly AppDbContext _db;

        public SubstitutionService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<SubstitutionReadDto>>> GetAllAsync(SubstitutionQuery query)
        {
            List<SubstitutionReadDto> substitutions = await _FetchAllActiveAsync(query);
            return Result<List<SubstitutionReadDto>>.Success(substitutions);
        }

        public async Task<Result<SubstitutionReadDto>> GetByIdAsync(int id)
        {
            Substitution? substitution = await _FindActiveByIdAsync(id);

            return substitution is null
                ? Result<SubstitutionReadDto>.Failure(ErrorType.NotFound, SubstitutionErrors.NotFound)
                : Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(substitution));
        }

        public async Task<Result<SubstitutionReadDto>> CreateAsync(SubstitutionWriteDto dto)
        {
            (string absentTeacherName,
                string absentTeacherSubject,
                string substituteTeacherName,
                string substituteTeacherSubject,
                string className,
                int periodNumber) = await _BuildSnapshotAsync(
                    dto.AbsenceId,
                    dto.WeeklyScheduleId,
                    dto.SubstituteTeacherId);

            List<Func<Task<Result>>> rules =
            [
                () => _CheckAbsenceActiveAsync(dto.AbsenceId),
                () => _CheckWeeklyScheduleActiveAsync(dto.WeeklyScheduleId),
                () => _CheckSubstituteTeacherActiveAsync(dto.SubstituteTeacherId),
                () => _CheckSubstituteDoubleBookedAsync(
                    dto.SubstituteTeacherId,
                    dto.ServiceDate,
                    periodNumber,
                    excludeId: null),
                () => _CheckSubstituteCannotBeAbsentTeacherAsync(
                    dto.AbsenceId,
                    dto.SubstituteTeacherId)
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SubstitutionReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Substitution created = await _PersistNewAsync(
                dto,
                absentTeacherName,
                absentTeacherSubject,
                substituteTeacherName,
                substituteTeacherSubject,
                className,
                periodNumber);

            return Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(created));
        }

        public async Task<Result<SubstitutionReadDto>> UpdateAsync(int id, SubstitutionWriteDto dto)
        {
            Substitution? substitution = await _FindActiveByIdAsync(id);
            if (substitution is null)
            {
                return Result<SubstitutionReadDto>.Failure(ErrorType.NotFound, SubstitutionErrors.NotFound);
            }

            (bool absenceChanged,
                bool weeklyScheduleChanged,
                bool substituteTeacherChanged,
                bool serviceDateChanged,
                bool algorithmMatchChanged) = _DetectChanges(substitution, dto);

            if (!absenceChanged
                && !weeklyScheduleChanged
                && !substituteTeacherChanged
                && !serviceDateChanged
                && !algorithmMatchChanged)
            {
                return Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(substitution));
            }

            (string absentTeacherName,
                string absentTeacherSubject,
                string substituteTeacherName,
                string substituteTeacherSubject,
                string className,
                int periodNumber) = await _BuildSnapshotAsync(
                    dto.AbsenceId,
                    dto.WeeklyScheduleId,
                    dto.SubstituteTeacherId);

            List<Func<Task<Result>>> rules = [];
            if (absenceChanged)
            {
                rules.Add(() => _CheckAbsenceActiveAsync(dto.AbsenceId));
            }
            if (weeklyScheduleChanged)
            {
                rules.Add(() => _CheckWeeklyScheduleActiveAsync(dto.WeeklyScheduleId));
            }
            if (substituteTeacherChanged)
            {
                rules.Add(() => _CheckSubstituteTeacherActiveAsync(dto.SubstituteTeacherId));
            }
            if (substituteTeacherChanged || weeklyScheduleChanged || serviceDateChanged)
            {
                rules.Add(() => _CheckSubstituteDoubleBookedAsync(
                    dto.SubstituteTeacherId,
                    dto.ServiceDate,
                    periodNumber,
                    id));
            }
            if (absenceChanged || substituteTeacherChanged)
            {
                rules.Add(() => _CheckSubstituteCannotBeAbsentTeacherAsync(
                    dto.AbsenceId,
                    dto.SubstituteTeacherId));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SubstitutionReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Substitution updated = await _ApplyUpdateAsync(
                substitution,
                dto,
                absentTeacherName,
                absentTeacherSubject,
                substituteTeacherName,
                substituteTeacherSubject,
                className,
                periodNumber);

            return Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            Substitution? substitution = await _FindActiveByIdAsync(id);
            if (substitution is null)
            {
                return Result.Failure(ErrorType.NotFound, SubstitutionErrors.NotFound);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                DateTime now = DateTime.UtcNow;
                substitution.DeletedAt = now;
                substitution.UpdatedAt = now;

                await _db.SaveChangesAsync();
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
        private async Task<List<SubstitutionReadDto>> _FetchAllActiveAsync(SubstitutionQuery query)
        {
            IQueryable<Substitution> q = _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null);

            if (query.AbsenceId.HasValue)
                q = q.Where(s => s.AbsenceId == query.AbsenceId.Value);

            if (query.WeeklyScheduleId.HasValue)
                q = q.Where(s => s.WeeklyScheduleId == query.WeeklyScheduleId.Value);

            if (query.SubstituteTeacherId.HasValue)
                q = q.Where(s => s.SubstituteTeacherId == query.SubstituteTeacherId.Value);

            if (query.FromDate.HasValue)
                q = q.Where(s => s.ServiceDate >= query.FromDate.Value);

            if (query.ToDate.HasValue)
                q = q.Where(s => s.ServiceDate <= query.ToDate.Value);

            if (query.IsAlgorithmMatch.HasValue)
                q = q.Where(s => s.IsAlgorithmMatch == query.IsAlgorithmMatch.Value);

            return await q
                .OrderByDescending(s => s.ServiceDate)
                .ThenBy(s => s.PeriodNumberAtTimeOfService)
                .ThenBy(s => s.SubstituteTeacherId)
                .Select(SubstitutionReadDto.ToDtoProjection)
                .ToListAsync();
        }

        private Task<Substitution?> _FindActiveByIdAsync(int id)
        {
            return _db.Substitutions
                .FirstOrDefaultAsync(s => s.Id == id && s.DeletedAt == null);
        }

        // Validation
        private async Task<Result> _CheckAbsenceActiveAsync(int absenceId)
        {
            bool absenceValid = await _db.TeacherAbsences
                .AnyAsync(a => a.Id == absenceId && a.DeletedAt == null);

            return absenceValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, SubstitutionErrors.AbsenceInvalid);
        }

        private async Task<Result> _CheckWeeklyScheduleActiveAsync(int weeklyScheduleId)
        {
            bool scheduleValid = await _db.WeeklySchedules
                .AnyAsync(ws => ws.Id == weeklyScheduleId && ws.DeletedAt == null);

            return scheduleValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, SubstitutionErrors.WeeklyScheduleInvalid);
        }

        private async Task<Result> _CheckSubstituteTeacherActiveAsync(int substituteTeacherId)
        {
            bool teacherValid = await _db.Teachers
                .AnyAsync(t => t.Id == substituteTeacherId && t.DeletedAt == null);

            return teacherValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, SubstitutionErrors.SubstituteTeacherInvalid);
        }

        private async Task<Result> _CheckSubstituteDoubleBookedAsync(
            int substituteTeacherId,
            DateOnly serviceDate,
            int periodNumber,
            int? excludeId)
        {
            bool alreadyBooked = await _db.Substitutions
                .AnyAsync(s => s.DeletedAt == null
                            && s.SubstituteTeacherId == substituteTeacherId
                            && s.ServiceDate == serviceDate
                            && s.PeriodNumberAtTimeOfService == periodNumber
                            && (!excludeId.HasValue || s.Id != excludeId.Value));

            return alreadyBooked
                ? Result.Failure(ErrorType.Conflict, SubstitutionErrors.SubstituteDoubleBooked)
                : Result.Success();
        }

        private async Task<Result> _CheckSubstituteCannotBeAbsentTeacherAsync(
            int absenceId,
            int substituteTeacherId)
        {
            int? absentTeacherId = await _db.TeacherAbsences
                .Where(a => a.Id == absenceId && a.DeletedAt == null)
                .Select(a => (int?)a.TeacherId)
                .FirstOrDefaultAsync();

            return absentTeacherId.HasValue && absentTeacherId.Value == substituteTeacherId
                ? Result.Failure(ErrorType.Validation, SubstitutionErrors.SubstituteCannotBeAbsentTeacher)
                : Result.Success();
        }

        // Snapshot
        private async Task<(
            string AbsentTeacherName,
            string AbsentTeacherSubject,
            string SubstituteTeacherName,
            string SubstituteTeacherSubject,
            string ClassName,
            int PeriodNumber)> _BuildSnapshotAsync(
                int absenceId,
                int weeklyScheduleId,
                int substituteTeacherId)
        {
            TeacherAbsence? absence = await _db.TeacherAbsences
                .AsNoTracking()
                .Include(a => a.Teacher)
                    .ThenInclude(t => t.Subject)
                .FirstOrDefaultAsync(a => a.Id == absenceId && a.DeletedAt == null);

            WeeklySchedule? schedule = await _db.WeeklySchedules
                .AsNoTracking()
                .Include(ws => ws.SchoolClass)
                .Include(ws => ws.EventKey)
                .FirstOrDefaultAsync(ws => ws.Id == weeklyScheduleId && ws.DeletedAt == null);

            Teacher? substituteTeacher = await _db.Teachers
                .AsNoTracking()
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(t => t.Id == substituteTeacherId && t.DeletedAt == null);

            string className = schedule?.SchoolClass != null
                ? schedule.SchoolClass.DisplayName
                : schedule?.EventKey != null
                    ? schedule.EventKey.EventName
                    : string.Empty;

            return (
                absence?.Teacher?.Name ?? string.Empty,
                absence?.Teacher?.Subject?.Name ?? string.Empty,
                substituteTeacher?.Name ?? string.Empty,
                substituteTeacher?.Subject?.Name ?? string.Empty,
                className ?? string.Empty,
                schedule?.PeriodNumber ?? 0);
        }

        // State
        private static (
            bool AbsenceChanged,
            bool WeeklyScheduleChanged,
            bool SubstituteTeacherChanged,
            bool ServiceDateChanged,
            bool AlgorithmMatchChanged) _DetectChanges(
                Substitution substitution,
                SubstitutionWriteDto dto)
        {
            bool absenceChanged = substitution.AbsenceId != dto.AbsenceId;
            bool weeklyScheduleChanged = substitution.WeeklyScheduleId != dto.WeeklyScheduleId;
            bool substituteTeacherChanged = substitution.SubstituteTeacherId != dto.SubstituteTeacherId;
            bool serviceDateChanged = substitution.ServiceDate != dto.ServiceDate;
            bool algorithmMatchChanged = substitution.IsAlgorithmMatch != dto.IsAlgorithmMatch;

            return (
                absenceChanged,
                weeklyScheduleChanged,
                substituteTeacherChanged,
                serviceDateChanged,
                algorithmMatchChanged);
        }

        // Create / Update
        private async Task<Substitution> _PersistNewAsync(
            SubstitutionWriteDto dto,
            string absentTeacherName,
            string absentTeacherSubject,
            string substituteTeacherName,
            string substituteTeacherSubject,
            string className,
            int periodNumber)
        {
            Substitution entity = dto.ToEntity();
            _ApplySnapshot(
                entity,
                absentTeacherName,
                absentTeacherSubject,
                substituteTeacherName,
                substituteTeacherSubject,
                className,
                periodNumber);

            _db.Substitutions.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        private async Task<Substitution> _ApplyUpdateAsync(
            Substitution substitution,
            SubstitutionWriteDto dto,
            string absentTeacherName,
            string absentTeacherSubject,
            string substituteTeacherName,
            string substituteTeacherSubject,
            string className,
            int periodNumber)
        {
            substitution.AbsenceId = dto.AbsenceId;
            substitution.WeeklyScheduleId = dto.WeeklyScheduleId;
            substitution.SubstituteTeacherId = dto.SubstituteTeacherId;
            substitution.ServiceDate = dto.ServiceDate;
            substitution.IsAlgorithmMatch = dto.IsAlgorithmMatch;

            _ApplySnapshot(
                substitution,
                absentTeacherName,
                absentTeacherSubject,
                substituteTeacherName,
                substituteTeacherSubject,
                className,
                periodNumber);

            substitution.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return substitution;
        }

        private static void _ApplySnapshot(
            Substitution substitution,
            string absentTeacherName,
            string absentTeacherSubject,
            string substituteTeacherName,
            string substituteTeacherSubject,
            string className,
            int periodNumber)
        {
            substitution.AbsentTeacherNameAtTimeOfService = absentTeacherName ?? string.Empty;
            substitution.AbsentTeacherSubjectAtTimeOfService = absentTeacherSubject ?? string.Empty;
            substitution.SubstituteTeacherNameAtTimeOfService = substituteTeacherName ?? string.Empty;
            substitution.SubstituteTeacherSubjectAtTimeOfService = substituteTeacherSubject ?? string.Empty;
            substitution.ClassNameAtTimeOfService = className ?? string.Empty;
            substitution.PeriodNumberAtTimeOfService = periodNumber;
        }

        // Delete
        #endregion
    }
}
