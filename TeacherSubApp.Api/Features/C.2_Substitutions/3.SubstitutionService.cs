using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Substitutions.Dtos;
using TeacherSubApp.Api.Features.Substitutions.Internal;

namespace TeacherSubApp.Api.Features.Substitutions
{
    public class SubstitutionService : ISubstitutionService
    {
        private readonly AppDbContext _db;
        private readonly SubstitutionSnapshotHandler _snapshotHandler;
        public SubstitutionService(AppDbContext db)
        {
            _db = db;
            _snapshotHandler = new SubstitutionSnapshotHandler(db);
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
            SubstitutionSnapshot snapshot = await _snapshotHandler.BuildAsync(dto.AbsenceId, dto.WeeklyScheduleId, dto.SubstituteTeacherId);

            List<Func<Task<Result>>> rules =
            [
                () => _CheckAbsenceActiveAsync(dto.AbsenceId),
                () => _CheckWeeklyScheduleActiveAsync(dto.WeeklyScheduleId),
                () => _CheckWeeklyScheduleEligibleForSubstitutionAsync(dto.WeeklyScheduleId),
                () => _CheckSubstituteTeacherActiveAsync(dto.SubstituteTeacherId),
                () => _CheckSubstituteDoubleBookedAsync(dto.SubstituteTeacherId, dto.ServiceDate, snapshot.PeriodNumber, excludeId: null),
                () => _CheckSlotAlreadySubstitutedAsync(dto.WeeklyScheduleId, dto.ServiceDate, excludeId: null),
                () => _CheckSubstituteCannotBeAbsentTeacherAsync(dto.AbsenceId, dto.SubstituteTeacherId),
                () => _CheckServiceDateMatchesAbsenceAsync(dto.AbsenceId, dto.ServiceDate),
                () => _CheckServiceDateMatchesScheduleDayAsync(dto.WeeklyScheduleId, dto.ServiceDate),
            ];

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SubstitutionReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Substitution created = await _PersistNewAsync(dto, snapshot);
            return Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(created));
        }

        public async Task<Result<SubstitutionReadDto>> UpdateAsync(int id, SubstitutionWriteDto dto)
        {
            Substitution? substitution = await _FindActiveByIdAsync(id);
            if (substitution is null)
            {
                return Result<SubstitutionReadDto>.Failure(ErrorType.NotFound, SubstitutionErrors.NotFound);
            }

            SubstitutionChangeSet changes = SubstitutionChangeSet.Detect(substitution, dto);
            if (!changes.Any)
            {
                return Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(substitution));
            }

            SubstitutionSnapshot snapshot = await _snapshotHandler.BuildAsync(dto.AbsenceId, dto.WeeklyScheduleId, dto.SubstituteTeacherId);

            List<Func<Task<Result>>> rules = [];
            if (changes.AbsenceChanged)
            {
                rules.Add(() => _CheckAbsenceActiveAsync(dto.AbsenceId));
            }
            if (changes.WeeklyScheduleChanged)
            {
                rules.Add(() => _CheckWeeklyScheduleActiveAsync(dto.WeeklyScheduleId));
                rules.Add(() => _CheckWeeklyScheduleEligibleForSubstitutionAsync(dto.WeeklyScheduleId));
            }
            if (changes.SubstituteTeacherChanged)
            {
                rules.Add(() => _CheckSubstituteTeacherActiveAsync(dto.SubstituteTeacherId));
            }
            if (changes.SubstituteTeacherChanged || changes.WeeklyScheduleChanged || changes.ServiceDateChanged)
            {
                rules.Add(() => _CheckSubstituteDoubleBookedAsync(dto.SubstituteTeacherId, dto.ServiceDate, snapshot.PeriodNumber, id));
            }
            if (changes.AbsenceChanged || changes.SubstituteTeacherChanged)
            {
                rules.Add(() => _CheckSubstituteCannotBeAbsentTeacherAsync(dto.AbsenceId, dto.SubstituteTeacherId));
            }
            if (changes.WeeklyScheduleChanged || changes.ServiceDateChanged)
            {
                rules.Add(() => _CheckSlotAlreadySubstitutedAsync(dto.WeeklyScheduleId, dto.ServiceDate, id));
            }
            if (changes.AbsenceChanged || changes.WeeklyScheduleChanged || changes.ServiceDateChanged)
            {
                rules.Add(() => _CheckServiceDateMatchesAbsenceAsync(dto.AbsenceId, dto.ServiceDate));
                rules.Add(() => _CheckServiceDateMatchesScheduleDayAsync(dto.WeeklyScheduleId, dto.ServiceDate));
            }

            foreach (Func<Task<Result>> rule in rules)
            {
                Result res = await rule();
                if (res.IsFailure)
                {
                    return Result<SubstitutionReadDto>.Failure(res.ErrorType, res.Error);
                }
            }

            Substitution updated = await _ApplyUpdateAsync(substitution, dto, snapshot);
            return Result<SubstitutionReadDto>.Success(SubstitutionReadDto.FromEntity(updated));
        }

        public async Task<Result> DeleteAsync(int id)
        {
            Substitution? substitution = await _FindActiveByIdAsync(id);
            if (substitution is null)
            {
                return Result.Failure(ErrorType.NotFound, SubstitutionErrors.NotFound);
            }

            await _SoftDeleteAsync(substitution);
            return Result.Success();
        }

        #region === Helpers ===

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

        private async Task<Result> _CheckWeeklyScheduleEligibleForSubstitutionAsync(int weeklyScheduleId)
        {
            WeeklySchedule? schedule = await _db.WeeklySchedules
                .AsNoTracking()
                .FirstOrDefaultAsync(ws => ws.Id == weeklyScheduleId && ws.DeletedAt == null);

            bool isEventOnly = schedule is not null
                && schedule.EventId != null
                && schedule.ClassId == null;

            return isEventOnly
                ? Result.Failure(ErrorType.Validation, SubstitutionErrors.WeeklyScheduleEventOnlyNotAllowed)
                : Result.Success();
        }

        private async Task<Result> _CheckSubstituteTeacherActiveAsync(int substituteTeacherId)
        {
            bool teacherValid = await _db.Teachers
                .AnyAsync(t => t.Id == substituteTeacherId && t.DeletedAt == null);

            return teacherValid
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, SubstitutionErrors.SubstituteTeacherInvalid);
        }

        private async Task<Result> _CheckSubstituteDoubleBookedAsync(int substituteTeacherId, DateOnly serviceDate, int periodNumber, int? excludeId)
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

        private async Task<Result> _CheckSubstituteCannotBeAbsentTeacherAsync(int absenceId, int substituteTeacherId)
        {
            int? absentTeacherId = await _db.TeacherAbsences
                .Where(a => a.Id == absenceId && a.DeletedAt == null)
                .Select(a => (int?)a.TeacherId)
                .FirstOrDefaultAsync();

            return absentTeacherId.HasValue && absentTeacherId.Value == substituteTeacherId
                ? Result.Failure(ErrorType.Validation, SubstitutionErrors.SubstituteCannotBeAbsentTeacher)
                : Result.Success();
        }

        protected async Task<Result> _CheckSlotAlreadySubstitutedAsync(int weeklyScheduleId, DateOnly serviceDate, int? excludeId)
        {
            bool alreadyTaken = await _db.Substitutions
                .AnyAsync(s => s.DeletedAt == null
                            && s.WeeklyScheduleId == weeklyScheduleId
                            && s.ServiceDate == serviceDate
                            && (!excludeId.HasValue || s.Id != excludeId.Value));

            return alreadyTaken
                ? Result.Failure(ErrorType.Conflict, SubstitutionErrors.SlotAlreadySubstituted)
                : Result.Success();
        }

        protected async Task<Result> _CheckServiceDateMatchesAbsenceAsync(int absenceId, DateOnly serviceDate)
        {
            DateOnly? absenceDate = await _db.TeacherAbsences
                .Where(a => a.Id == absenceId && a.DeletedAt == null)
                .Select(a => (DateOnly?)a.AbsenceDate)
                .FirstOrDefaultAsync();

            return absenceDate.HasValue && absenceDate.Value != serviceDate
                ? Result.Failure(ErrorType.Validation, SubstitutionErrors.ServiceDateAbsenceMismatch)
                : Result.Success();
        }

        protected async Task<Result> _CheckServiceDateMatchesScheduleDayAsync(int weeklyScheduleId, DateOnly serviceDate)
        {
            int? scheduleDayOfWeek = await _db.WeeklySchedules
                .Where(ws => ws.Id == weeklyScheduleId && ws.DeletedAt == null)
                .Select(ws => (int?)ws.DayOfWeek)
                .FirstOrDefaultAsync();

            if (!scheduleDayOfWeek.HasValue)
                return Result.Success();

            int actualDayOfWeek = (int)serviceDate.DayOfWeek;

            return actualDayOfWeek == scheduleDayOfWeek.Value
                ? Result.Success()
                : Result.Failure(ErrorType.Validation, SubstitutionErrors.ServiceDateDayOfWeekMismatch);
        }

        // Create / Update
        private async Task<Substitution> _PersistNewAsync(SubstitutionWriteDto dto, SubstitutionSnapshot snapshot)
        {
            Substitution entity = dto.ToEntity();

            // Map the snapshot cleanly using the static handler
            SubstitutionSnapshotHandler.ApplyToEntity(entity, snapshot);

            _db.Substitutions.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        private async Task<Substitution> _ApplyUpdateAsync(Substitution substitution, SubstitutionWriteDto dto, SubstitutionSnapshot snapshot)
        {
            substitution.AbsenceId = dto.AbsenceId;
            substitution.WeeklyScheduleId = dto.WeeklyScheduleId;
            substitution.SubstituteTeacherId = dto.SubstituteTeacherId;
            substitution.ServiceDate = dto.ServiceDate;
            substitution.IsAlgorithmMatch = dto.IsAlgorithmMatch;

            // Map the snapshot cleanly using the static handler
            SubstitutionSnapshotHandler.ApplyToEntity(substitution, snapshot);

            substitution.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return substitution;
        }

        // Delete
        private async Task _SoftDeleteAsync(Substitution substitution)
        {
            substitution.DeletedAt = DateTime.UtcNow;
            substitution.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}