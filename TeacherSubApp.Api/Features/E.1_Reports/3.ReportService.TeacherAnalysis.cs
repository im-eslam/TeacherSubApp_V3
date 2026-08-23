using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.Reports.Dtos;
using TeacherSubApp.Api.Features.Reports.Internal;

namespace TeacherSubApp.Api.Features.Reports
{
    public partial class ReportService
    {
        /// <summary>
        /// AverageActualWeeklyLoad uses the teacher's current WeeklySchedule for every bucket, so historical values can shift after schedule edits.
        /// </summary>
        public async Task<Result<TeacherAnalysisDto>> GetTeacherAnalysisAsync(
            int teacherId,
            ReportDateRangeQuery query)
        {
            Result dateValidation = await _ValidateDateRangeAsync(query.FromDate, query.ToDate);
            if (dateValidation.IsFailure)
            {
                return Result<TeacherAnalysisDto>.Failure(dateValidation.ErrorType, dateValidation.Error);
            }

            Result<Teacher> teacherResult = await _GetActiveTeacherAsync(teacherId);
            if (teacherResult.IsFailure)
            {
                return Result<TeacherAnalysisDto>.Failure(teacherResult.ErrorType, teacherResult.Error);
            }

            Teacher teacher = teacherResult.Value!;
            List<TeacherAbsence> absences = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null
                         && a.TeacherId == teacherId
                         && a.AbsenceDate >= query.FromDate
                         && a.AbsenceDate <= query.ToDate)
                .ToListAsync();
            CoverageAssemblyResult coverage = await new CoverageAssembler(_db).BuildAsync(absences);

            int totalSlotsFreed = 0;
            int totalSlotsCoveredForTeacher = 0;
            foreach (TeacherAbsence absence in absences)
            {
                List<DailyCoverageSlotDto> slots = coverage.SlotsByAbsenceId.GetValueOrDefault(absence.Id) ?? [];
                totalSlotsFreed += slots.Count;
                totalSlotsCoveredForTeacher += coverage.CoveredByAbsenceId.GetValueOrDefault(absence.Id);
            }

            List<TeacherSubstitutionFact> substitutions = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                         && s.SubstituteTeacherId == teacherId
                         && s.ServiceDate >= query.FromDate
                         && s.ServiceDate <= query.ToDate)
                .Select(s => new TeacherSubstitutionFact(
                    s.ServiceDate,
                    s.IsAlgorithmMatch))
                .ToListAsync();

            WeeklyLoadBuildResult load = await new WeeklyLoadBucketBuilder(_db)
                .BuildAsync(teacherId, query.FromDate, query.ToDate);

            int totalSubstitutions = substitutions.Count;
            int algorithmMatches = substitutions.Count(s => s.IsAlgorithmMatch);
            double absenceCoverageRate = totalSlotsFreed == 0
                ? 0
                : (double)totalSlotsCoveredForTeacher / totalSlotsFreed;
            double algorithmMatchRate = totalSubstitutions == 0
                ? 0
                : (double)algorithmMatches / totalSubstitutions;
            double averageActualWeeklyLoad = load.Buckets.Count == 0
                ? 0
                : load.Buckets.Average(bucket => bucket.NetActualLoad);

            (int? absenceRank, int? substitutionRank) = await _GetTeacherRanksAsync(
                teacherId,
                query.FromDate,
                query.ToDate,
                absences.Count,
                totalSubstitutions);

            return Result<TeacherAnalysisDto>.Success(new TeacherAnalysisDto(
                teacher.Id,
                teacher.Name,
                teacher.Subject?.Name,
                teacher.IsSupervisor,
                query.FromDate,
                query.ToDate,
                absences.Count,
                totalSlotsFreed,
                totalSlotsCoveredForTeacher,
                Math.Max(0, totalSlotsFreed - totalSlotsCoveredForTeacher),
                absenceCoverageRate,
                totalSubstitutions,
                substitutions.Select(s => s.ServiceDate).Distinct().Count(),
                algorithmMatchRate,
                load.BaseWeeklyLoad,
                averageActualWeeklyLoad,
                absenceRank,
                substitutionRank));
        }

        private async Task<(int? AbsenceRank, int? SubstitutionRank)> _GetTeacherRanksAsync(
            int teacherId,
            DateOnly fromDate,
            DateOnly toDate,
            int teacherAbsenceCount,
            int teacherSubstitutionCount)
        {
            List<int> absenceCounts = await _db.TeacherAbsences
                .AsNoTracking()
                .Where(a => a.DeletedAt == null
                         && a.Teacher.DeletedAt == null
                         && a.AbsenceDate >= fromDate
                         && a.AbsenceDate <= toDate)
                .GroupBy(a => a.TeacherId)
                .Select(group => group.Count())
                .ToListAsync();

            List<int> substitutionCounts = await _db.Substitutions
                .AsNoTracking()
                .Where(s => s.DeletedAt == null
                         && s.SubstituteTeacher.DeletedAt == null
                         && s.ServiceDate >= fromDate
                         && s.ServiceDate <= toDate)
                .GroupBy(s => s.SubstituteTeacherId)
                .Select(group => group.Count())
                .ToListAsync();

            int? absenceRank = teacherAbsenceCount == 0
                ? null
                : absenceCounts.Count(count => count > teacherAbsenceCount) + 1;
            int? substitutionRank = teacherSubstitutionCount == 0
                ? null
                : substitutionCounts.Count(count => count > teacherSubstitutionCount) + 1;

            return (absenceRank, substitutionRank);
        }

        private sealed record TeacherSubstitutionFact(
            DateOnly ServiceDate,
            bool IsAlgorithmMatch);
    }
}
