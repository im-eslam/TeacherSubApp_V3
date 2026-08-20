using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TeacherSubApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class C1_Done : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Grade = table.Column<int>(type: "integer", nullable: true),
                    Section = table.Column<int>(type: "integer", nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => x.Id);
                    table.CheckConstraint("CK_Class_Grade_Positive", "\"Grade\" > 0");
                    table.CheckConstraint("CK_Class_GradeSection_Pair", "(\"Grade\" IS NULL AND \"Section\" IS NULL) OR (\"Grade\" IS NOT NULL AND \"Section\" IS NOT NULL)");
                    table.CheckConstraint("CK_Class_Section_Positive", "\"Section\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "EventKeys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsSupport = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsStandby = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventKeys", x => x.Id);
                    table.CheckConstraint("CK_EventKeys_ExclusiveFlags", "NOT (\"IsSupport\" = true AND \"IsStandby\" = true)");
                });

            migrationBuilder.CreateTable(
                name: "Subjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Teachers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SubjectId = table.Column<int>(type: "integer", nullable: true),
                    IsSupervisor = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teachers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teachers_Subjects",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TeacherAbsences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeacherId = table.Column<int>(type: "integer", nullable: false),
                    AbsenceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherAbsences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeacherAbsences_Teachers",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WeeklySchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeacherId = table.Column<int>(type: "integer", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    PeriodNumber = table.Column<int>(type: "integer", nullable: false),
                    ClassId = table.Column<int>(type: "integer", nullable: true),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklySchedules", x => x.Id);
                    table.CheckConstraint("CK_Schedule_ClassOrEvent", "\"ClassId\" IS NOT NULL OR \"EventId\" IS NOT NULL");
                    table.CheckConstraint("CK_Schedule_DayOfWeek", "\"DayOfWeek\" >= 1 AND \"DayOfWeek\" <= 5");
                    table.CheckConstraint("CK_Schedule_Period", "\"PeriodNumber\" >= 1 AND \"PeriodNumber\" <= 7");
                    table.ForeignKey(
                        name: "FK_WeeklySchedules_Classes",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklySchedules_EventKeys",
                        column: x => x.EventId,
                        principalTable: "EventKeys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklySchedules_Teachers",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Substitutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AbsenceId = table.Column<int>(type: "integer", nullable: false),
                    WeeklyScheduleId = table.Column<int>(type: "integer", nullable: false),
                    SubstituteTeacherId = table.Column<int>(type: "integer", nullable: false),
                    ServiceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsAlgorithmMatch = table.Column<bool>(type: "boolean", nullable: false),
                    AbsentTeacherNameAtTimeOfService = table.Column<string>(type: "text", nullable: false),
                    AbsentTeacherSubjectAtTimeOfService = table.Column<string>(type: "text", nullable: false),
                    SubstituteTeacherNameAtTimeOfService = table.Column<string>(type: "text", nullable: false),
                    SubstituteTeacherSubjectAtTimeOfService = table.Column<string>(type: "text", nullable: false),
                    ClassNameAtTimeOfService = table.Column<string>(type: "text", nullable: false),
                    PeriodNumberAtTimeOfService = table.Column<int>(type: "integer", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Substitutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Substitutions_SubstituteTeacher",
                        column: x => x.SubstituteTeacherId,
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Substitutions_TeacherAbsences",
                        column: x => x.AbsenceId,
                        principalTable: "TeacherAbsences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Substitutions_WeeklySchedule",
                        column: x => x.WeeklyScheduleId,
                        principalTable: "WeeklySchedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Classes_DisplayName_Active",
                table: "Classes",
                column: "DisplayName",
                unique: true,
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_GradeSection_Active",
                table: "Classes",
                columns: new[] { "Grade", "Section" },
                unique: true,
                filter: "\"DeletedAt\" IS NULL AND \"Grade\" IS NOT NULL AND \"Section\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_EventKeys_IsStandby_Active_Unique",
                table: "EventKeys",
                column: "IsStandby",
                unique: true,
                filter: "\"DeletedAt\" IS NULL AND \"IsStandby\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_EventKeys_IsSupport_Active_Unique",
                table: "EventKeys",
                column: "IsSupport",
                unique: true,
                filter: "\"DeletedAt\" IS NULL AND \"IsSupport\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_EventKeys_Name_Active",
                table: "EventKeys",
                column: "EventName",
                unique: true,
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_Name_Active",
                table: "Subjects",
                column: "Name",
                unique: true,
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Substitutions_AbsenceId",
                table: "Substitutions",
                column: "AbsenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Substitutions_SubstituteTeacherId",
                table: "Substitutions",
                column: "SubstituteTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_Substitutions_WeeklyScheduleId",
                table: "Substitutions",
                column: "WeeklyScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAbsences_AbsenceDate_Active",
                table: "TeacherAbsences",
                column: "AbsenceDate",
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAbsences_TeacherId",
                table: "TeacherAbsences",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAbsences_TeacherId_Date_Active",
                table: "TeacherAbsences",
                columns: new[] { "TeacherId", "AbsenceDate" },
                unique: true,
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_Name_Active",
                table: "Teachers",
                column: "Name",
                unique: true,
                filter: "\"DeletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_SubjectId",
                table: "Teachers",
                column: "SubjectId",
                filter: "\"SubjectId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_ClassId",
                table: "WeeklySchedules",
                column: "ClassId",
                filter: "\"ClassId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklySchedules_DayPeriod_Active",
                table: "WeeklySchedules",
                columns: new[] { "DayOfWeek", "PeriodNumber" },
                filter: "\"DeletedAt\" IS NULL");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Substitutions");

            migrationBuilder.DropTable(
                name: "TeacherAbsences");

            migrationBuilder.DropTable(
                name: "WeeklySchedules");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropTable(
                name: "EventKeys");

            migrationBuilder.DropTable(
                name: "Teachers");

            migrationBuilder.DropTable(
                name: "Subjects");
        }
    }
}
