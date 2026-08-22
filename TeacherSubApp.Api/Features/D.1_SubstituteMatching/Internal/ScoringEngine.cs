using TeacherSubApp.Api.Data.Models;
using TeacherSubApp.Api.Features.SubstituteMatching.Dtos;
using TeacherSubApp.Api.Features.SubstituteMatching.Enums;

namespace TeacherSubApp.Api.Features.SubstituteMatching.Internal
{
    public sealed class ScoringEngine
    {
        private const int LastPeriodOfDay = 7;

        private readonly SubstituteMatchQuery _query;
        private readonly SubstitutionAlgorithmSetting _settings;
        private readonly TeacherContext _absentTeacherContext;

        public ScoringEngine(SubstituteMatchQuery query, SubstitutionAlgorithmSetting settings, TeacherContext absentTeacherContext)
        {
            _query = query;
            _settings = settings;
            _absentTeacherContext = absentTeacherContext;
        }

        // ==== Tier Classification ====
        public CandidateTier DetermineTier(TeacherContext candidate)
        {
            if (candidate.IsSupervisor())
            {
                return CandidateTier.C3;
            }

            if (candidate.IsInMeetingAt(_query.PeriodNumber))
            {
                return CandidateTier.C2;
            }

            if (candidate.IsSupportAt(_query.PeriodNumber))
            {
                return CandidateTier.C1;
            }

            return candidate.WeeklyLoad() >= _settings.OvertimeThreshold
                ? CandidateTier.B
                : CandidateTier.A;
        }

        // ==== Rank / Sort / Filter ====

        public double CalculateTotalScore(TeacherContext candidate)
        {
            double weeklyLoadScore = _NormalizeWeeklyLoad(candidate);
            double dailyLoadScore = _NormalizeDailyLoad(candidate);

            double subjectMatchScore = candidate.IsSubjectMatch(_absentTeacherContext.Teacher.SubjectId) ? 1.0 : 0.0;
            double standbyScore = candidate.IsStandbyAt(_query.PeriodNumber) ? 1.0 : 0.0;
            double subbedYesterdayScore = _SubbedYesterday(candidate) ? 0.0 : 1.0;
            double consecutiveClassScore = _CausesThreeInARow(candidate) ? 0.0 : 1.0;
            double earlyLeaveScore = _IsEarlyLeaveRisk(candidate) ? 0.0 : 1.0;

            double totalScore = (subjectMatchScore * _settings.SubjectMatchWeight)
                 + (weeklyLoadScore * _settings.WeeklyLoadWeight)
                 + (dailyLoadScore * _settings.DailyLoadWeight)
                 + (standbyScore * _settings.StandByWeight)
                 + (subbedYesterdayScore * _settings.SubbedYesterdayWeight)
                 + (consecutiveClassScore * _settings.ConsecutiveClassWeight)
                 + (earlyLeaveScore * _settings.EarlyLeaveWeight);

            return Math.Round(totalScore, 2);
        }

        public List<SubstituteCandidateDto> RankByTierThenScore(List<SubstituteCandidateDto> scoredCandidates)
        {
            return scoredCandidates
                .OrderBy(c => c.Tier)
                .ThenByDescending(c => c.TotalScore)
                .ToList();
        }

        public List<SubstituteCandidateDto> ExcludeTier(List<SubstituteCandidateDto> scoredCandidates, CandidateTier excludeTier)
        {
            if (scoredCandidates is null)
                return new List<SubstituteCandidateDto>();

            return scoredCandidates
                .Where(c => c.Tier != excludeTier)
                .ToList();
        }

        #region ==== Private Herlpers ====

        private double _NormalizeWeeklyLoad(TeacherContext candidate)
        {
            double rawScore = (_settings.OvertimeThreshold - candidate.WeeklyLoad()) / (double)_settings.OvertimeThreshold;
            return Math.Max(0.0, rawScore);
        }

        private double _NormalizeDailyLoad(TeacherContext candidate)
        {
            double rawScore = (_settings.DailyLoadThreshold - candidate.DailyLoad()) / (double)_settings.DailyLoadThreshold;
            return Math.Max(0.0, rawScore);
        }

        private bool _SubbedYesterday(TeacherContext candidate)
        {
            if (candidate.SubbedYesterday() && candidate.WeeklyLoad() >= _settings.LowLoadThreshold)
            {
                return true;
            }

            return false;
        }

        private bool _CausesThreeInARow(TeacherContext candidate)
        {
            int previousPeriod = _query.PeriodNumber - 1;
            int nextPeriod = _query.PeriodNumber + 1;

            if (previousPeriod < 1)
            {
                return false;
            }

            int targetBlock = _GetPeriodBlock(_query.PeriodNumber);
            int previousBlock = _GetPeriodBlock(previousPeriod);
            int nextBlock = _GetPeriodBlock(nextPeriod);

            if (previousBlock != targetBlock && nextBlock != targetBlock)
            {
                return false;
            }

            bool occupiedAtPreviousPeriod = previousBlock == targetBlock && candidate.IsOccupiedAt(previousPeriod);
            bool occupiedAtNextPeriod = nextBlock == targetBlock && candidate.IsOccupiedAt(nextPeriod);

            return occupiedAtPreviousPeriod && occupiedAtNextPeriod;
        }

        private bool _IsEarlyLeaveRisk(TeacherContext candidate)
        {
            bool isLastPeriodOfDay = _query.PeriodNumber == LastPeriodOfDay;
            return isLastPeriodOfDay && (candidate.IsFreeAt(_query.PeriodNumber) || candidate.IsStandbyAt(_query.PeriodNumber));
        }

        private int _GetPeriodBlock(int periodNumber)
        {
            return periodNumber <= _settings.RestPeriodBreak ? 1 : 2;
        }

        #endregion
    }
}