using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    public partial class SubstituteMatchingService : ISubstituteMatchingService
    {
        private readonly AppDbContext _db;
        public SubstituteMatchingService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Result<AlgorithmSettingsDto>> GetSettingsAsync()
        {
            SubstitutionAlgorithmSetting? settings = await _db.SubstitutionAlgorithmSettings.FirstOrDefaultAsync();
            return settings is null
                ? Result<AlgorithmSettingsDto>.Failure(ErrorType.NotFound, SubstituteMatchingErrors.SettingsNotFound)
                : Result<AlgorithmSettingsDto>.Success(_ToDto(settings));
        }

        public async Task<Result> UpdateSettingsAsync(AlgorithmSettingsDto dto)
        {
            double totalWeight = _SunWeights(dto);

            if (Math.Abs(totalWeight - 100.0) > 0.1)
            {
                return Result.Failure(ErrorType.Validation, SubstituteMatchingErrors.InvalidWeightsSum);
            }

            SubstitutionAlgorithmSetting? settings = await _db.SubstitutionAlgorithmSettings.FirstOrDefaultAsync();
            if (settings is null)
                return Result.Failure(ErrorType.NotFound, SubstituteMatchingErrors.SettingsNotFound);

            _ApplyChangesToSettings(settings, dto);

            await _db.SaveChangesAsync();
            return Result.Success();
        }

        #region ==== Helpers ====

        private static AlgorithmSettingsDto _ToDto(SubstitutionAlgorithmSetting s)
        {
            return new AlgorithmSettingsDto
            (
                s.SubjectMatchWeight,
                s.WeeklyLoadWeight,
                s.DailyLoadWeight,
                s.StandByWeight,
                s.SubbedYesterdayWeight,
                s.ConsecutiveClassWeight,
                s.EarlyLeaveWeight,
                s.OvertimeThreshold,
                s.LowLoadThreshold,
                s.DailyLoadThreshold,
                s.RestPeriodBreak
            );
        }

        private static double _SunWeights(AlgorithmSettingsDto dto)
        {
            return dto.SubjectMatchWeight + dto.WeeklyLoadWeight + dto.DailyLoadWeight +
                                 dto.StandbyWeight + dto.SubbedYesterdayWeight + dto.ConsecutiveClassWeight +
                                 dto.EarlyLeaveWeight;
        }

        private static void _ApplyChangesToSettings(SubstitutionAlgorithmSetting settings, AlgorithmSettingsDto dto)
        {
            settings.SubjectMatchWeight = dto.SubjectMatchWeight;
            settings.WeeklyLoadWeight = dto.WeeklyLoadWeight;
            settings.DailyLoadWeight = dto.DailyLoadWeight;
            settings.StandByWeight = dto.StandbyWeight;
            settings.SubbedYesterdayWeight = dto.SubbedYesterdayWeight;
            settings.ConsecutiveClassWeight = dto.ConsecutiveClassWeight;
            settings.EarlyLeaveWeight = dto.EarlyLeaveWeight;
            settings.OvertimeThreshold = dto.OvertimeThreshold;
            settings.LowLoadThreshold = dto.LowLoadThreshold;
            settings.DailyLoadThreshold = dto.DailyLoadThreshold;
            settings.RestPeriodBreak = dto.RestPeriodBreak;
        }

        #endregion
    }
}
