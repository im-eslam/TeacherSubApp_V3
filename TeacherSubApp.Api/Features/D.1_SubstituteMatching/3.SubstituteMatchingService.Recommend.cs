using Microsoft.EntityFrameworkCore;
using TeacherSubApp.Api.Common;
using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;
using TeacherSubApp.Api.Features.SubstituteMatching.Enums;
using TeacherSubApp.Api.Features.SubstituteMatching.Internal;

namespace TeacherSubApp.Api.Features.SubstituteMatching
{
    public partial class SubstituteMatchingService : ISubstituteMatchingService
    {
        private SubstituteMatchQuery _query = null!;
        private SubstitutionAlgorithmSetting _settings = null!;
        private List<TeacherContext> _allTeachers = new();
        private TeacherContext _absentTeacherContext = null!;

        private List<TeacherContext> _eligibleCandidates = new();

        public async Task<Result<List<SubstituteCandidateDto>>> GetRecommendationsAsync(SubstituteMatchQuery query)
        {
            _query = query;

            // ---- Phase 0 - Validate ----
            Result validationResult = _ValidateQuery();
            if (validationResult.IsFailure)
                return Result<List<SubstituteCandidateDto>>.Failure(validationResult.ErrorType, validationResult.Error);

            Result settingsResult = await _LoadSettingsAsync();
            if (settingsResult.IsFailure)
                return Result<List<SubstituteCandidateDto>>.Failure(settingsResult.ErrorType, settingsResult.Error);

            // ---- Phase 1 - Fetch ----
            await _LoadAllTeacherContextsAsync();

            Result absentTeacherResult = _ResolveAbsentTeacherContext();
            if (absentTeacherResult.IsFailure)
                return Result<List<SubstituteCandidateDto>>.Failure(absentTeacherResult.ErrorType, absentTeacherResult.Error);

            // ---- Phase 2 - Hard Drop ----
            _FilterToEligibleCandidates();

            // ---- Phases 3:5 - Rank and Sort ----
            List<SubstituteCandidateDto> rankedCandidates = _ScoreAndRankEligibleCandidates();

            return Result<List<SubstituteCandidateDto>>.Success(rankedCandidates);
        }

        #region ==== Phase 0: Request Validation & Settings ====

        private Result _ValidateQuery()
        {
            if (_query.ServiceDate == DateOnly.MinValue)
            {
                return Result.Failure(ErrorType.Validation, SubstituteMatchingErrors.ServiceDateRequired);
            }

            int dayOfWeek = (int)_query.ServiceDate.DayOfWeek + 1;

            if (dayOfWeek is < 1 or > 5)
            {
                return Result.Failure(ErrorType.Validation, SubstituteMatchingErrors.InvalidDayOfWeek);
            }

            if (_query.PeriodNumber is < 1 or > 7)
            {
                return Result.Failure(ErrorType.Validation, SubstituteMatchingErrors.InvalidPeriodNumber);
            }

            return Result.Success();
        }

        private async Task<Result> _LoadSettingsAsync()
        {
            SubstitutionAlgorithmSetting? settings = await _db.SubstitutionAlgorithmSettings.FirstOrDefaultAsync();
            if (settings is null)
            {
                return Result.Failure(ErrorType.NotFound, SubstituteMatchingErrors.SettingsNotFound);
            }

            _settings = settings;
            return Result.Success();
        }

        #endregion

        #region ==== Phase 1: DB Funnel - Build Every TeacherContext ====

        private async Task _LoadAllTeacherContextsAsync()
        {
            TeacherContextAssembler assembler = new(_db, _query);
            _allTeachers = await assembler.BuildContexts();
        }

        private Result _ResolveAbsentTeacherContext()
        {
            TeacherContext? absentTeacherContext = _allTeachers.FirstOrDefault(t => t.Teacher.Id == _query.AbsentTeacherId);
            if (absentTeacherContext is null)
            {
                return Result.Failure(ErrorType.NotFound, SubstituteMatchingErrors.AbsentTeacherNotFound);
            }

            _absentTeacherContext = absentTeacherContext;
            return Result.Success();
        }

        #endregion

        #region ==== Phase 2: Hard-Drop Physically Impossible Candidates ====

        private void _FilterToEligibleCandidates()
        {
            _eligibleCandidates = _allTeachers
                .Where(t => t.Teacher.Id != _query.AbsentTeacherId)
                .Where(_CanPhysicallyCover)
                .ToList();
        }

        private bool _CanPhysicallyCover(TeacherContext teacher)
        {
            int periodNumber = _query.PeriodNumber;

            if (teacher.IsAbsentToday())
            {
                return false;
            }

            if (teacher.IsTeachingRegularClassAt(periodNumber))
            {
                return false;
            }

            if (teacher.IsTeachingSpecialClassAt(periodNumber))
            {
                return false;
            }

            if (teacher.IsAlreadyCoveringAt(periodNumber))
            {
                return false;
            }

            return true;
        }

        #endregion

        #region ==== Phases 3-5: Tier Classification, Scoring, Ranking ====

        private List<SubstituteCandidateDto> _ScoreAndRankEligibleCandidates()
        {
            ScoringEngine scoringEngine = new(_query, _settings, _absentTeacherContext);

            List<SubstituteCandidateDto> scoredCandidates = _eligibleCandidates
                .Select(candidate => _BuildCandidateDto(scoringEngine, candidate))
                .ToList();

            return scoringEngine.RankByTierThenScore(scoredCandidates);
        }

        private static SubstituteCandidateDto _BuildCandidateDto(ScoringEngine scoringEngine, TeacherContext candidate)
        {
            CandidateTier tier = scoringEngine.DetermineTier(candidate);
            double totalScore = scoringEngine.CalculateTotalScore(candidate);

            return new SubstituteCandidateDto
            {
                TeacherId = candidate.Teacher.Id,
                TeacherName = candidate.Teacher.Name,
                SubjectName = candidate.Teacher.Subject?.Name ?? string.Empty,
                Tier = tier,
                TotalScore = totalScore
            };
        }

        #endregion
    }
}