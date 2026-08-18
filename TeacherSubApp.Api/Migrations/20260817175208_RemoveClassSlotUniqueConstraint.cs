using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherSubApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveClassSlotUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules",
                columns: new[] { "ClassId", "DayOfWeek", "PeriodNumber" },
                filter: "\"ClassId\" IS NOT NULL AND \"DeletedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules",
                columns: new[] { "ClassId", "DayOfWeek", "PeriodNumber" },
                unique: true,
                filter: "\"ClassId\" IS NOT NULL AND \"DeletedAt\" IS NULL");
        }
    }
}
