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
                name: "IX_WeeklySchedules_ClassSlot_Active",
                table: "WeeklySchedules");

            migrationBuilder.DropIndex(
                name: "IX_WeeklySchedules_TeacherSlot_Active",
                table: "WeeklySchedules");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The dropped indexes enforced slot uniqueness, which is explicitly
            // out of scope and must not be recreated by rolling back this feature.
        }
    }
}
