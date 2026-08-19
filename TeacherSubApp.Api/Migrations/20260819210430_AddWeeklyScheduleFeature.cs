using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherSubApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyScheduleFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_ClassId",
                table: "WeeklySchedules");

            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules");

            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_EventId",
                table: "WeeklySchedules");

            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_TeacherId",
                table: "WeeklySchedules");

            migrationBuilder.RenameIndex(
                name: "IX_WeeklySchedules_TeacherSlot_Active",
                table: "WeeklySchedules",
                newName: "UX_WeeklySchedules_TeacherSlot_Active");

            migrationBuilder.CreateIndex(
                name: "UX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules",
                columns: new[] { "ClassId", "DayOfWeek", "PeriodNumber" },
                unique: true,
                filter: "\"ClassId\" IS NOT NULL AND \"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "UX_WeeklySchedules_EventSlot_Active",
                table: "WeeklySchedules",
                columns: new[] { "EventId", "DayOfWeek", "PeriodNumber" },
                unique: true,
                filter: "\"EventId\" IS NOT NULL AND \"DeletedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules");

            migrationBuilder.DropIndex(
                name: "UX_WeeklySchedules_EventSlot_Active",
                table: "WeeklySchedules");

            migrationBuilder.RenameIndex(
                name: "UX_WeeklySchedules_TeacherSlot_Active",
                table: "WeeklySchedules",
                newName: "IX_WeeklySchedules_TeacherSlot_Active");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_ClassId",
                table: "WeeklySchedules",
                column: "ClassId",
                filter: "\"ClassId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules",
                columns: new[] { "ClassId", "DayOfWeek", "PeriodNumber" },
                filter: "\"ClassId\" IS NOT NULL AND \"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_EventId",
                table: "WeeklySchedules",
                column: "EventId",
                filter: "\"EventId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_TeacherId",
                table: "WeeklySchedules",
                column: "TeacherId");
        }
    }
}
