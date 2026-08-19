using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Features.EventKeys
{
    public static class EventKeyErrors
    {
        public static class Validation
        {
            public const string NameRequired = "The event name is required.|اسم الحدث مطلوب.";
            public const string NameMaxLength = "The event name cannot exceed 100 characters.|لا يمكن أن يتجاوز اسم الحدث 100 حرف.";
        };

        public static readonly Error NotFound = Error.Create(
            "EVENTKEY_NOT_FOUND",
            "The requested event-key was not found.",
            "لم يتم العثور على الحدث."
        );

        public static readonly Error NameExists = Error.Create(
            "EVENTKEY_NAME_EXISTS",
            "An active event-key with this name already exists.",
            "يوجد حدث نشط بهذا الاسم بالفعل."
        );

        public static readonly Error FlagsConflict = Error.Create(
            "EVENTKEY_FLAGS_CONFLICT",
            "An event cannot be both Support and Stand-by at the same time.",
            "لا يمكن أن يكون الحدث \"مساندة\" و\"احتياطي\" في نفس الوقت."
        );

        public static readonly Error SupportConflict = Error.Create(
            "EVENTKEY_SUPPORT_CONFLICT",
            "Another active event-key is already marked as the Support event.",
            "يوجد حدث نشط آخر محدّد بالفعل كحدث دعم."
        );

        public static readonly Error StandbyConflict = Error.Create(
            "EVENTKEY_STANDBY_CONFLICT",
            "Another active event-key is already marked as the Stand-by event.",
            "يوجد حدث نشط آخر محدّد بالفعل كحدث احتياطي."
        );
    }
}