using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Dtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules.Internal
{
    public sealed class SlotSwapperHandler : WeeklyScheduleService
    {
        private readonly AppDbContext _db;

        public SlotSwapperHandler(AppDbContext db) : base(db)
        {
            _db = db;
        }

        public async Task<Result> SwapCoreAsync(SlotCoordinate cordA, SlotCoordinate cordB)
        {
            bool sameSlot = cordA.TeacherId == cordB.TeacherId &&
                            cordA.DayOfWeek == cordB.DayOfWeek &&
                            cordA.PeriodNumber == cordB.PeriodNumber;

            if (sameSlot)
            {
                return Result.Success();
            }

            WeeklySchedule? slotA = await _FindActiveByCoordinateAsync(cordA.TeacherId, cordA.DayOfWeek, cordA.PeriodNumber);
            WeeklySchedule? slotB = await _FindActiveByCoordinateAsync(cordB.TeacherId, cordB.DayOfWeek, cordB.PeriodNumber);

            (int? classId, int? eventId) contentA = slotA is not null ? (slotA.ClassId, slotA.EventId) : (null, null);
            (int? classId, int? eventId) contentB = slotB is not null ? (slotB.ClassId, slotB.EventId) : (null, null);

            Result applyToA = await _ApplyContentToSlotAsync(slotA, cordA, contentB.classId, contentB.eventId);
            if (applyToA.IsFailure)
                return applyToA;

            Result applyToB = await _ApplyContentToSlotAsync(slotB, cordB, contentA.classId, contentA.eventId);
            if (applyToB.IsFailure)
                return applyToB;

            return Result.Success();
        }

        private Task<WeeklySchedule?> _FindActiveByCoordinateAsync(int teacherId, int dayOfWeek, int periodNumber)
        {
            return _db.WeeklySchedules.FirstOrDefaultAsync(ws =>
                ws.TeacherId == teacherId &&
                ws.DayOfWeek == dayOfWeek &&
                ws.PeriodNumber == periodNumber &&
                ws.DeletedAt == null);
        }

        private async Task<Result> _ApplyContentToSlotAsync(WeeklySchedule? existingSlot, SlotCoordinate coord, int? classId, int? eventId)
        {
            bool hasNewContent = classId.HasValue || eventId.HasValue;

            if (existingSlot is not null && !hasNewContent)
            {
                await _SoftDeleteAsync(existingSlot);
                return Result.Success();
            }

            if (existingSlot is not null && hasNewContent)
            {
                Result classCheck = await _CheckClassActiveAsync(classId);
                if (classCheck.IsFailure)
                    return classCheck;

                Result eventCheck = await _CheckEventActiveAsync(eventId);
                if (eventCheck.IsFailure)
                    return eventCheck;

                existingSlot.ClassId = classId;
                existingSlot.EventId = eventId;
                existingSlot.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Result.Success();
            }

            if (existingSlot is null && hasNewContent)
            {
                Result teacherCheck = await _CheckTeacherActiveAsync(coord.TeacherId);
                if (teacherCheck.IsFailure)
                    return teacherCheck;

                Result classCheck = await _CheckClassActiveAsync(classId);
                if (classCheck.IsFailure)
                    return classCheck;

                Result eventCheck = await _CheckEventActiveAsync(eventId);
                if (eventCheck.IsFailure)
                    return eventCheck;

                WeeklySchedule newRow = new()
                {
                    TeacherId = coord.TeacherId,
                    DayOfWeek = coord.DayOfWeek,
                    PeriodNumber = coord.PeriodNumber,
                    ClassId = classId,
                    EventId = eventId
                };

                _db.WeeklySchedules.Add(newRow);
                await _db.SaveChangesAsync();

                return Result.Success();
            }

            return Result.Success();
        }
    }
}