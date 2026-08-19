using System.Linq.Expressions;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Features.EventKeys.Dtos
{
    public sealed record EventKeyReadDto(int Id, string EventName, bool IsSupport, bool IsStandby)
    {
        public static EventKeyReadDto FromEntity(EventKey e) =>
            new(e.Id, e.EventName, e.IsSupport, e.IsStandby);

        public static readonly Expression<Func<EventKey, EventKeyReadDto>> ToDtoProjection =
            e => new EventKeyReadDto(e.Id, e.EventName, e.IsSupport, e.IsStandby);
    }
}