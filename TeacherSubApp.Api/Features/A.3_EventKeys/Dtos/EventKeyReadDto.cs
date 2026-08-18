using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.EventKeys.Dtos
{
    public record EventKeyReadDto
    {
        public int Id { get; init; }
        public string EventName { get; init; } = string.Empty;
        public bool IsSupport { get; init; }
        public bool IsStandby { get; init; }

        public static EventKeyReadDto FromEntity(EventKey e)
        {
            return new EventKeyReadDto
            {
                Id = e.Id,
                EventName = e.EventName,
                IsSupport = e.IsSupport,
                IsStandby = e.IsStandby
            };
        }

        public static readonly Expression<Func<EventKey, EventKeyReadDto>> ToDtoProjection =
            e => new EventKeyReadDto
            {
                Id = e.Id,
                EventName = e.EventName,
                IsSupport = e.IsSupport,
                IsStandby = e.IsStandby
            };
    }
}