using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Reports.Dtos;
using TeacherSubApp.Api.Features.Reports.Internal;

namespace TeacherSubApp.Api.Features.Reports
{
    public partial class ReportService
    {
        public async Task<Result<TeacherAbsenceHistoryDto>> GetTeacherAbsenceHistoryAsync(
            int teacherId,
            TeacherAbsenceHistoryQuery query)
        {
            Result dateValidation = await _ValidateDateRangeAsync(query.FromDate, query.ToDate);
            if (dateValidation.IsFailure)
            {
                return Result<TeacherAbsenceHistoryDto>.Failure(dateValidation.ErrorType, dateValidation.Error);
            }

            Result<Teacher> teacherResult = await _GetActiveTeacherAsync(teacherId);
            if (teacherResult.IsFailure)
            {
                return Result<TeacherAbsenceHistoryDto>.Failure(teacherResult.ErrorType, teacherResult.Error);
            }

            Teacher teacher = teacherResult.Value!;
            List<TeacherAbsence> absences = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null
                         && a.TeacherId == teacherId
                         && a.AbsenceDate >= query.FromDate
                         && a.AbsenceDate <= query.ToDate)
                .OrderBy(a => a.AbsenceDate)
                .ToListAsync();

            CoverageAssemblyResult coverage = await new CoverageAssembler(_db).BuildAsync(absences);
            List<TeacherAbsenceHistoryEntryDto> entries = absences
                .Select(absence => _BuildHistoryEntry(absence, coverage))
                .ToList();

            int totalSlotsFreed = entries.Sum(entry => entry.SlotsFreed);
            int totalSlotsCovered = entries.Sum(entry => entry.SlotsCovered);

            return Result<TeacherAbsenceHistoryDto>.Success(new TeacherAbsenceHistoryDto(
                teacher.Id,
                teacher.Name,
                teacher.Subject?.Name,
                query.FromDate,
                query.ToDate,
                entries.Count,
                totalSlotsFreed,
                totalSlotsCovered,
                Math.Max(0, totalSlotsFreed - totalSlotsCovered),
                entries));
        }

        private static TeacherAbsenceHistoryEntryDto _BuildHistoryEntry(
            TeacherAbsence absence,
            CoverageAssemblyResult coverage)
        {
            List<DailyCoverageSlotDto> slots = coverage.SlotsByAbsenceId.GetValueOrDefault(absence.Id) ?? [];
            int slotsCovered = coverage.CoveredByAbsenceId.GetValueOrDefault(absence.Id);

            return new TeacherAbsenceHistoryEntryDto(
                absence.Id,
                absence.AbsenceDate,
                absence.Reason,
                slots.Count,
                slotsCovered,
                Math.Max(0, slots.Count - slotsCovered),
                slots);
        }
    }
}
