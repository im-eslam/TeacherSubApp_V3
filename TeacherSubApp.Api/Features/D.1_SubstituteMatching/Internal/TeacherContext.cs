using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.SubstituteMatching.Internal
{
    public sealed class TeacherContext
    {
        public Teacher Teacher { get; }

        private readonly List<WeeklySchedule> _daySchedules;
        private readonly TeacherAbsence? _absenceToday;
        private readonly List<Substitution> _substitutions;
        private readonly int _weeklyLoad;

        public TeacherContext(Teacher teacher, List<WeeklySchedule> daySchedules, TeacherAbsence? absenceToday, List<Substitution> substitutions, int weeklyLoad)
        {
            Teacher = teacher;
            _daySchedules = daySchedules;
            _absenceToday = absenceToday;
            _substitutions = substitutions;
            _weeklyLoad = weeklyLoad;
        }

        // ==== Hard-Drop Checks ====

        public bool IsAbsentToday()
        {
            return _absenceToday is not null;
        }

        public bool IsTeachingRegularClassAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);
            bool hasClass = slot?.ClassId is not null;
            bool hasEvent = slot?.EventId is not null;

            return hasClass && !hasEvent;
        }

        public bool IsTeachingSpecialClassAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);
            bool hasClass = slot?.ClassId is not null;
            bool isSupportEvent = slot?.EventKey?.IsSupport ?? false;
            bool isStandbyEvent = slot?.EventKey?.IsStandby ?? false;

            return hasClass && !isSupportEvent && !isStandbyEvent;
        }

        public bool IsAlreadyCoveringAt(int periodNumber)
        {
            return _substitutions.Any(s => s.WeeklySchedule.PeriodNumber == periodNumber);
        }

        // ==== Bad Choices ====

        public bool IsSupervisor()
        {
            return Teacher.IsSupervisor;
        }

        public bool IsSupportAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);
            return slot?.EventKey?.IsSupport ?? false;
        }

        public bool IsStandbyAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);
            return slot?.EventKey?.IsStandby ?? false;
        }

        public bool IsInMeetingAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);

            bool hasClass = slot?.ClassId is not null;
            bool hasEvent = slot?.EventId is not null;

            return !hasClass && hasEvent && !IsSupportAt(periodNumber) && !IsStandbyAt(periodNumber);
        }

        public bool IsFreeAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);

            bool hasClass = slot?.ClassId is not null;
            bool hasEvent = slot?.EventId is not null;

            return !hasClass && !hasEvent;
        }

        // ==== Load & History ====

        public int WeeklyLoad()
        {
            return _weeklyLoad;
        }

        public int DailyLoad()
        {
            return _daySchedules.Count(s => s.ClassId is not null);
        }

        public bool SubbedYesterday()
        {
            DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
            DateOnly yesterday = today.AddDays(-1);
            return _substitutions.Any(s => s.ServiceDate == yesterday);
        }

        public bool IsSubjectMatch(int? targetSubjectId)
        {
            return targetSubjectId is not null && Teacher.SubjectId == targetSubjectId;
        }

        // ==== Scoring Signals ====

        public bool IsOccupiedAt(int periodNumber)
        {
            WeeklySchedule? slot = _GetSlotAt(periodNumber);
            return slot?.ClassId is not null;
        }

        // ==== Private Helpers ====

        private WeeklySchedule? _GetSlotAt(int periodNumber)
        {
            return _daySchedules.FirstOrDefault(s => s.PeriodNumber == periodNumber);
        }
    }
}