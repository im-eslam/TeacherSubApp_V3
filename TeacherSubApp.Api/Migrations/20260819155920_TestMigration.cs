using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherSubApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class TestMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WeeklySchedules_Classes",
                table: "WeeklySchedules");

            migrationBuilder.DropForeignKey(
                name: "FK_WeeklySchedules_EventKeys",
                table: "WeeklySchedules");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:citext", ",,");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Subjects",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "citext",
                oldMaxLength: 100);

            migrationBuilder.AddForeignKey(
                name: "FK_WeeklySchedules_Classes",
                table: "WeeklySchedules",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WeeklySchedules_EventKeys",
                table: "WeeklySchedules",
                column: "EventId",
                principalTable: "EventKeys",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WeeklySchedules_Classes",
                table: "WeeklySchedules");

            migrationBuilder.DropForeignKey(
                name: "FK_WeeklySchedules_EventKeys",
                table: "WeeklySchedules");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:citext", ",,");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Subjects",
                type: "citext",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddForeignKey(
                name: "FK_WeeklySchedules_Classes",
                table: "WeeklySchedules",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_WeeklySchedules_EventKeys",
                table: "WeeklySchedules",
                column: "EventId",
                principalTable: "EventKeys",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
