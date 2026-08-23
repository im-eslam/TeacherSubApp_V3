using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Reports.Dtos;
using TeacherSubApp.Api.Features.Reports.Internal;

namespace TeacherSubApp.Api.Features.Reports
{
    public partial class ReportService
    {
        public async Task<Result<DailyReportDto>> GetDailyReportAsync(DailyReportQuery query)
        {
            Result dateValidation = await _ValidateDailyDateAsync(query.Date);
            if (dateValidation.IsFailure)
                return Result<DailyReportDto>.Failure(dateValidation.ErrorType, dateValidation.Error);

            List<TeacherAbsence> absences = await _db.TeacherAbsences
                .AsNoTracking()
                .Include(a => a.Teacher)
                .ThenInclude(t => t.Subject)
                .Where(a => a.DeletedAt == null && a.AbsenceDate == query.Date)
                .OrderBy(a => a.Teacher.Name)
                .ToListAsync();

            CoverageAssemblyResult coverage = await new CoverageAssembler(_db).BuildAsync(absences);
            List<DailyAbsenceEntryDto> entries = absences
                .Select(absence => _BuildDailyEntry(absence, coverage))
                .ToList();

            int totalSlotsFreed = entries.Sum(entry => entry.SlotsFreed);
            int totalSlotsCovered = entries.Sum(entry => entry.SlotsCovered);

            return Result<DailyReportDto>.Success(new DailyReportDto(
                query.Date,
                entries.Count,
                totalSlotsFreed,
                totalSlotsCovered,
                Math.Max(0, totalSlotsFreed - totalSlotsCovered),
                entries));
        }

        private static DailyAbsenceEntryDto _BuildDailyEntry(
            TeacherAbsence absence,
            CoverageAssemblyResult coverage)
        {
            List<DailyCoverageSlotDto> slots = coverage.SlotsByAbsenceId.GetValueOrDefault(absence.Id) ?? [];
            int slotsCovered = coverage.CoveredByAbsenceId.GetValueOrDefault(absence.Id);

            return new DailyAbsenceEntryDto(
                absence.Id,
                absence.TeacherId,
                absence.Teacher.Name,
                absence.Teacher.Subject?.Name,
                absence.Reason,
                slots.Count,
                slotsCovered,
                Math.Max(0, slots.Count - slotsCovered),
                slots);
        }
    }
}
