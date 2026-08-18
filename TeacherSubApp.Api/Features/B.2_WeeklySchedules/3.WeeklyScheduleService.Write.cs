using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Common.Exceptions;
using TeacherSubApp.Api.Features.WeeklySchedules.Models;
using TeacherSubApp.Api.Features.WeeklySchedules.Results;
using static TeacherSubApp.Api.Features.WeeklySchedules.Dtos.WeeklyScheduleWriteDtos;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public partial class WeeklyScheduleService
    {
        public async Task<BulkUpdateResult> BulkUpdateAsync(WeeklyScheduleBulkUpdateDto dto)
        {
            BulkValidationContext ctx = new BulkValidationContext();

            ValidatedRequestState requestState = _ValidateSelfContradictions(dto, ctx);
            if(ctx.HasErrors)
                return _Fail(ctx);

            MemoryState memoryState = await _LoadAndResolveReferencesAsync(dto, requestState, ctx);
            if(ctx.HasErrors)
                return _Fail(ctx);

            List<ProjectedSlot> finalSlots = _ProjectFinalState(requestState, memoryState);

            _ValidateContentRules(finalSlots, requestState.TouchedSlotIds, ctx);

            _ValidateCollisions(finalSlots, ctx);

            if(ctx.HasErrors)
                return _Fail(ctx);

            return await _ExecuteTransactionAsync(requestState, memoryState);
        }

        #region === Private Helpers ===

        private ValidatedRequestState _ValidateSelfContradictions(WeeklyScheduleBulkUpdateDto dto, BulkValidationContext ctx)
        {
            ValidatedRequestState state = new ValidatedRequestState();

            foreach(var edit in dto.Edits)
            {
                if(!state.EditIds.Add(edit.Id))
                    ctx.AddError(WeeklyScheduleErrors.DuplicateEditTarget(edit.Id));
                state.TouchedSlotIds.Add(edit.Id);
            }

            foreach(var del in dto.Deletes)
            {
                if(!state.DeleteIds.Add(del))
                    ctx.AddError(WeeklyScheduleErrors.DuplicateDeleteTarget(del));
            }

            foreach(var swap in dto.Swaps)
            {
                if(swap.ScheduleIdA == swap.ScheduleIdB)
                    ctx.AddError(WeeklyScheduleErrors.SwapWithItself(swap.ScheduleIdA));
                if(!state.SwapIds.Add(swap.ScheduleIdA))
                    ctx.AddError(WeeklyScheduleErrors.DuplicateSwapTarget(swap.ScheduleIdA));
                if(!state.SwapIds.Add(swap.ScheduleIdB))
                    ctx.AddError(WeeklyScheduleErrors.DuplicateSwapTarget(swap.ScheduleIdB));

                state.TouchedSlotIds.Add(swap.ScheduleIdA);
                state.TouchedSlotIds.Add(swap.ScheduleIdB);
            }

            foreach(var id in state.EditIds)
            {
                if(state.DeleteIds.Contains(id))
                    ctx.AddError(WeeklyScheduleErrors.EditDeleteConflict(id));
                if(state.SwapIds.Contains(id))
                    ctx.AddError(WeeklyScheduleErrors.SwapEditConflict(id));
            }
            foreach(var id in state.DeleteIds)
            {
                if(state.SwapIds.Contains(id))
                    ctx.AddError(WeeklyScheduleErrors.SwapDeleteConflict(id));
            }

            return state;
        }

        private async Task<MemoryState> _LoadAndResolveReferencesAsync(WeeklyScheduleBulkUpdateDto dto, ValidatedRequestState reqState, BulkValidationContext ctx)
        {
            // Load data (Stage 1)
            var memory = new MemoryState();

            memory.TeachersDict = await _db.Teachers.Where(t => t.DeletedAt == null).ToDictionaryAsync(t => t.Id);
            memory.ClassesDict = await _db.Classes.Where(c => c.DeletedAt == null).ToDictionaryAsync(c => c.Id);
            memory.EventsDict = await _db.EventKeys.Where(e => e.DeletedAt == null).ToDictionaryAsync(e => e.Id);

            memory.TrackedUniverseSlots = await _db.WeeklySchedules
                .Include(x => x.Teacher).Include(x => x.SchoolClass).Include(x => x.EventKey)
                .Where(x => x.DeletedAt == null)
                .ToDictionaryAsync(x => x.Id);

            // Resolve references (Stage 2)
            foreach(var add in dto.Adds)
            {
                bool valid = true;
                if(!memory.TeachersDict.ContainsKey(add.TeacherId))
                {
                    ctx.AddError(WeeklyScheduleErrors.AddTeacherNotFound(add.TeacherId));
                    valid = false;
                }
                if(add.ClassId.HasValue && !memory.ClassesDict.ContainsKey(add.ClassId.Value))
                {
                    ctx.AddError(WeeklyScheduleErrors.AddClassNotFound(add.ClassId.Value));
                    valid = false;
                }
                if(add.EventId.HasValue && !memory.EventsDict.ContainsKey(add.EventId.Value))
                {
                    ctx.AddError(WeeklyScheduleErrors.AddEventNotFound(add.EventId.Value));
                    valid = false;
                }

                if(valid)
                {
                    reqState.ValidAdds.Add(add);
                }
            }

            foreach(var edit in dto.Edits)
            {
                if(!memory.TrackedUniverseSlots.ContainsKey(edit.Id))
                {
                    ctx.AddError(WeeklyScheduleErrors.SlotNotFound(edit.Id));
                    continue;
                }
                bool valid = true;
                if(edit.ClassId.HasValue && !memory.ClassesDict.ContainsKey(edit.ClassId.Value))
                {
                    ctx.AddError(WeeklyScheduleErrors.EditClassNotFound(edit.ClassId.Value));
                    valid = false;
                }
                if(edit.EventId.HasValue && !memory.EventsDict.ContainsKey(edit.EventId.Value))
                {
                    ctx.AddError(WeeklyScheduleErrors.EditEventNotFound(edit.EventId.Value));
                    valid = false;
                }
                if(valid)
                {
                    reqState.ValidEdits.Add(edit);
                }
            }

            foreach(var del in dto.Deletes)
            {
                if(!memory.TrackedUniverseSlots.ContainsKey(del))
                {
                    ctx.AddError(WeeklyScheduleErrors.SlotNotFound(del));
                    continue;
                }
                reqState.ValidDeletes.Add(del);
            }

            foreach(var swap in dto.Swaps)
            {
                bool valid = true;
                if(!memory.TrackedUniverseSlots.ContainsKey(swap.ScheduleIdA))
                {
                    ctx.AddError(WeeklyScheduleErrors.SlotNotFound(swap.ScheduleIdA));
                    valid = false;
                }
                if(!memory.TrackedUniverseSlots.ContainsKey(swap.ScheduleIdB))
                {
                    ctx.AddError(WeeklyScheduleErrors.SlotNotFound(swap.ScheduleIdB));
                    valid = false;
                }
                if(valid)
                {
                    reqState.ValidSwaps.Add(swap);
                }
            }

            return memory;
        }

        private List<ProjectedSlot> _ProjectFinalState(ValidatedRequestState reqState, MemoryState memory)
        {
            var projectedDict = memory.TrackedUniverseSlots.Values.Select(x => new ProjectedSlot
            {
                Id = x.Id,
                TeacherId = x.TeacherId,
                TeacherName = x.Teacher.Name,
                DayOfWeek = x.DayOfWeek,
                PeriodNumber = x.PeriodNumber,
                ClassId = x.ClassId,
                EventId = x.EventId,
                ClassDisplayName = x.SchoolClass?.DisplayName,
                EventName = x.EventKey?.EventName,
                EventIsSupport = x.EventKey?.IsSupport ?? false,
                EventIsStandby = x.EventKey?.IsStandby ?? false
            }).ToDictionary(x => x.Id!.Value);

            foreach(var del in reqState.ValidDeletes)
            {
                projectedDict[del].IsDeleted = true;
            }

            foreach(var edit in reqState.ValidEdits)
            {
                var slot = projectedDict[edit.Id];
                slot.ClassId = edit.ClassId;
                slot.ClassDisplayName = edit.ClassId.HasValue ? memory.ClassesDict[edit.ClassId.Value].DisplayName : null;
                slot.EventId = edit.EventId;
                slot.EventName = edit.EventId.HasValue ? memory.EventsDict[edit.EventId.Value].EventName : null;
                slot.EventIsSupport = edit.EventId.HasValue && memory.EventsDict[edit.EventId.Value].IsSupport;
                slot.EventIsStandby = edit.EventId.HasValue && memory.EventsDict[edit.EventId.Value].IsStandby;
            }

            foreach(var swap in reqState.ValidSwaps)
            {
                var slotA = projectedDict[swap.ScheduleIdA];
                var slotB = projectedDict[swap.ScheduleIdB];

                var tempClassId = slotA.ClassId;
                var tempClassDisplayName = slotA.ClassDisplayName;
                var tempEventId = slotA.EventId;
                var tempEventName = slotA.EventName;
                var tempEventIsSupport = slotA.EventIsSupport;
                var tempEventIsStandby = slotA.EventIsStandby;

                slotA.ClassId = slotB.ClassId;
                slotA.ClassDisplayName = slotB.ClassDisplayName;
                slotA.EventId = slotB.EventId;
                slotA.EventName = slotB.EventName;
                slotA.EventIsSupport = slotB.EventIsSupport;
                slotA.EventIsStandby = slotB.EventIsStandby;

                slotB.ClassId = tempClassId;
                slotB.ClassDisplayName = tempClassDisplayName;
                slotB.EventId = tempEventId;
                slotB.EventName = tempEventName;
                slotB.EventIsSupport = tempEventIsSupport;
                slotB.EventIsStandby = tempEventIsStandby;
            }

            var finalSlots = projectedDict.Values.Where(x => !x.IsDeleted).ToList();

            foreach(var add in reqState.ValidAdds)
            {
                finalSlots.Add(new ProjectedSlot
                {
                    Id = null,
                    TeacherId = add.TeacherId,
                    TeacherName = memory.TeachersDict[add.TeacherId].Name,
                    DayOfWeek = add.DayOfWeek,
                    PeriodNumber = add.PeriodNumber,
                    ClassId = add.ClassId,
                    EventId = add.EventId,
                    ClassDisplayName = add.ClassId.HasValue ? memory.ClassesDict[add.ClassId.Value].DisplayName : null,
                    EventName = add.EventId.HasValue ? memory.EventsDict[add.EventId.Value].EventName : null,
                    EventIsSupport = add.EventId.HasValue && memory.EventsDict[add.EventId.Value].IsSupport,
                    EventIsStandby = add.EventId.HasValue && memory.EventsDict[add.EventId.Value].IsStandby
                });
            }

            return finalSlots;
        }

        private void _ValidateContentRules(List<ProjectedSlot> slots, HashSet<int> touchedIds, BulkValidationContext ctx)
        {
            foreach(var slot in slots)
            {
                if(slot.Id != null && !touchedIds.Contains(slot.Id.Value))
                    continue;

                if(slot.ClassId == null && slot.EventId == null)
                    ctx.AddError(WeeklyScheduleErrors.SlotRequiresContent(slot.TeacherName, slot.DayOfWeek, slot.PeriodNumber));
                else if(slot.EventIsSupport && slot.ClassId == null)
                    ctx.AddError(WeeklyScheduleErrors.SupportEventRequiresClass(slot.TeacherName, slot.EventName!, slot.DayOfWeek, slot.PeriodNumber));
                else if(slot.EventIsStandby && slot.ClassId != null)
                    ctx.AddError(WeeklyScheduleErrors.StandbyEventForbidsClass(slot.TeacherName, slot.EventName!, slot.DayOfWeek, slot.PeriodNumber));
            }
        }

        private void _ValidateCollisions(List<ProjectedSlot> slots, BulkValidationContext ctx)
        {
            var teacherGroups = slots.GroupBy(x => new { x.TeacherId, x.DayOfWeek, x.PeriodNumber });
            foreach(var group in teacherGroups.Where(g => g.Count() > 1))
            {
                var description = string.Join(" & ", group.Select(x => x.ClassDisplayName ?? x.EventName ?? "Unknown"));
                ctx.AddError(WeeklyScheduleErrors.TeacherDoubleBooked(group.First().TeacherName, group.Key.DayOfWeek, group.Key.PeriodNumber, description));
            }

            var classGroups = slots.Where(x => x.ClassId.HasValue).GroupBy(x => new { x.ClassId, x.DayOfWeek, x.PeriodNumber });
            foreach(var group in classGroups)
            {
                var primaryTeachers = group.Where(x => !x.EventIsSupport).ToList();

                if(primaryTeachers.Count > 1)
                {
                    var teacherNames = string.Join(" & ", primaryTeachers.Select(x => x.TeacherName));
                    ctx.AddError(WeeklyScheduleErrors.ClassDoubleBooked(group.First().ClassDisplayName!, group.Key.DayOfWeek, group.Key.PeriodNumber, teacherNames));
                }
            }
        }

        private async Task<BulkUpdateResult> _ExecuteTransactionAsync(ValidatedRequestState reqState, MemoryState memory)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach(var del in reqState.ValidDeletes)
                {
                    memory.TrackedUniverseSlots[del].DeletedAt = DateTime.UtcNow;
                    memory.TrackedUniverseSlots[del].UpdatedAt = DateTime.UtcNow;
                }

                foreach(var edit in reqState.ValidEdits)
                    edit.ApplyTo(memory.TrackedUniverseSlots[edit.Id]);

                foreach(var swap in reqState.ValidSwaps)
                {
                    var entityA = memory.TrackedUniverseSlots[swap.ScheduleIdA];
                    var entityB = memory.TrackedUniverseSlots[swap.ScheduleIdB];

                    var tempClass = entityA.ClassId;
                    var tempEvent = entityA.EventId;
                    entityA.ClassId = entityB.ClassId;
                    entityA.EventId = entityB.EventId;
                    entityA.UpdatedAt = DateTime.UtcNow;
                    entityB.ClassId = tempClass;
                    entityB.EventId = tempEvent;
                    entityB.UpdatedAt = DateTime.UtcNow;
                }

                foreach(var add in reqState.ValidAdds)
                    _db.WeeklySchedules.Add(add.ToEntity());

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return BulkUpdateResult.Success();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static BulkUpdateResult _Fail(BulkValidationContext ctx)
        {
            return BulkUpdateResult.Failure(ErrorType.Validation, GlobalErrors.ValidationError("Validation failed.", "فشل التحقق."), ctx.Errors);
        }

        #endregion
    }
}