using TeacherSubApp.Api.Common.Results;
using TeacherSubApp.Api.Features.WeeklySchedules.Models;

namespace TeacherSubApp.Api.Features.WeeklySchedules
{
    public static class WeeklyScheduleErrors
    {
        // === Grid Query ===

        public static readonly Error TeacherNotFound = new(
            "SCHEDULE_TEACHER_NOT_FOUND",
            "The specified teacher was not found.",
            "لم يتم العثور على المعلم المحدد."
        );

        public static readonly Error ClassNotFound = new(
            "SCHEDULE_CLASS_NOT_FOUND",
            "The specified class was not found.",
            "لم يتم العثور على الصف المحدد."
        );

        // === Bulk Update — Request Self-Consistency ===

        private static Error _SlotSelfConflict(int scheduleId, string reasonEn, string reasonAr) => new(
            "SCHEDULE_SLOT_SELF_CONFLICT",
            $"Schedule slot #{scheduleId}: {reasonEn}",
            $"الحصة رقم {scheduleId}: {reasonAr}"
        );

        public static Error DuplicateEditTarget(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "appears more than once across Edits in this request.",
                "مكررة في أكثر من عملية تعديل ضمن هذا الطلب.");

        public static Error DuplicateDeleteTarget(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "appears more than once in Deletes.",
                "مكررة في عمليات الحذف.");

        public static Error DuplicateSwapTarget(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "is referenced by more than one Swap in this request.",
                "مشار إليها في أكثر من عملية تبديل ضمن هذا الطلب.");

        public static Error SwapWithItself(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "cannot be swapped with itself.",
                "لا يمكن تبديلها مع نفسها.");

        public static Error EditDeleteConflict(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "cannot be both edited and deleted in the same request.",
                "لا يمكن تعديلها وحذفها في نفس الطلب.");

        public static Error SwapDeleteConflict(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "cannot be both swapped and deleted in the same request.",
                "لا يمكن تبديلها وحذفها في نفس الطلب.");

        public static Error SwapEditConflict(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
                "cannot be both edited and swapped in the same request.",
                "لا يمكن تعديلها وتبديلها في نفس الطلب.");

        // === Bulk Update — Reference Resolution ===

        public static Error ReferenceNotFound(string entityTypeEn, string entityTypeAr, int id, string operationEn, string operationAr) => new(
            "SCHEDULE_REFERENCE_NOT_FOUND",
            $"{entityTypeEn} #{id} referenced in an {operationEn} was not found.",
            $"لم يتم العثور على {entityTypeAr} رقم {id} المشار إليه في عملية {operationAr}."
        );

        public static Error SlotNotFound(int scheduleId) =>
            _SlotSelfConflict(scheduleId,
            "was not found or has already been removed.",
            "لم يتم العثور عليها أو أنه تم حذفها بالفعل."
        );

        public static Error AddTeacherNotFound(int teacherId) => ReferenceNotFound("Teacher", "المعلم", teacherId, "Add", "الإضافة");
        public static Error AddClassNotFound(int classId) => ReferenceNotFound("Class", "الصف", classId, "Add", "الإضافة");
        public static Error AddEventNotFound(int eventId) => ReferenceNotFound("Event", "الحدث", eventId, "Add", "الإضافة");
        public static Error EditClassNotFound(int classId) => ReferenceNotFound("Class", "الصف", classId, "Edit", "التعديل");
        public static Error EditEventNotFound(int eventId) => ReferenceNotFound("Event", "الحدث", eventId, "Edit", "التعديل");

        // === Bulk Update — Row Validity ===

        public static Error SlotRequiresContent(string teacherName, int dayOfWeek, int periodNumber) => new(
            "SCHEDULE_SLOT_REQUIRES_CONTENT",
            $"The slot for {teacherName} on {ScheduleDay.NameEn(dayOfWeek)}, Period {periodNumber} must have a Class or an Event assigned.",
            $"يجب أن تحتوي حصة {teacherName} يوم {ScheduleDay.NameAr(dayOfWeek)}, الحصة {periodNumber} على مادة أو حدث."
        );

        public static Error SupportEventRequiresClass(string teacherName, string eventName, int dayOfWeek, int periodNumber) => new(
            "SCHEDULE_SUPPORT_EVENT_REQUIRES_CLASS",
            $"'{eventName}' is a Support event and requires a Class ({teacherName}, {ScheduleDay.NameEn(dayOfWeek)}, Period {periodNumber}).",
            $"'{eventName}' هو حدث دعم ويتطلب تحديد صف ({teacherName}, يوم {ScheduleDay.NameAr(dayOfWeek)}, الحصة {periodNumber})."
        );

        public static Error StandbyEventForbidsClass(string teacherName, string eventName, int dayOfWeek, int periodNumber) => new(
            "SCHEDULE_STANDBY_EVENT_FORBIDS_CLASS",
            $"'{eventName}' is a Stand-by event and cannot have a Class assigned ({teacherName}, {ScheduleDay.NameEn(dayOfWeek)}, Period {periodNumber}).",
            $"'{eventName}' هو حدث احتياطي ولا يمكن تعيين صف له ({teacherName}, يوم {ScheduleDay.NameAr(dayOfWeek)}, الحصة {periodNumber})."
        );

        // === Bulk Update — Double Booking ===

        public static Error TeacherDoubleBooked(string teacherName, int dayOfWeek, int periodNumber, string occupiedByDescription) => new(
            "SCHEDULE_TEACHER_DOUBLE_BOOKED",
            $"{teacherName} already has {occupiedByDescription} on {ScheduleDay.NameEn(dayOfWeek)}, Period {periodNumber}.",
            $"لدى {teacherName} بالفعل {occupiedByDescription} يوم {ScheduleDay.NameAr(dayOfWeek)}, الحصة {periodNumber}."
        );

        public static Error ClassDoubleBooked(string classDisplayName, int dayOfWeek, int periodNumber, string otherTeacherName) => new(
            "SCHEDULE_CLASS_DOUBLE_BOOKED",
            $"Class {classDisplayName} is already booked with {otherTeacherName} on {ScheduleDay.NameEn(dayOfWeek)}, Period {periodNumber}.",
            $"الصف {classDisplayName} محجوز بالفعل مع {otherTeacherName} يوم {ScheduleDay.NameAr(dayOfWeek)}, الحصة {periodNumber}."
        );
    }
}