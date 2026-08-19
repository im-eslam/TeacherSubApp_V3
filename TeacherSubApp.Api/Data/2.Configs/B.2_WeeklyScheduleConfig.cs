using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configs
{
    public sealed class WeeklyScheduleConfig : IEntityTypeConfiguration<WeeklySchedule>
    {
        public void Configure(EntityTypeBuilder<WeeklySchedule> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureCheckConstraints(builder);
            _ConfigureIndexes(builder);
            _ConfigurePerformanceIndexes(builder);
            _ConfigureRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.ToTable("WeeklySchedules");
            builder.HasKey(ws => ws.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.Property(ws => ws.TeacherId)
                   .IsRequired();

            builder.Property(ws => ws.DayOfWeek)
                   .IsRequired();

            builder.Property(ws => ws.PeriodNumber)
                   .IsRequired();

            builder.Property(ws => ws.ClassId)
                   .IsRequired(false);

            builder.Property(ws => ws.EventId)
                   .IsRequired(false);
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.Property(ws => ws.DeletedAt)
                   .IsRequired(false);

            builder.Property(ws => ws.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");

            builder.Property(ws => ws.UpdatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");
        }

        private static void _ConfigureCheckConstraints(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "CK_Schedule_DayOfWeek",
                    "\"DayOfWeek\" >= 1 AND \"DayOfWeek\" <= 5");

                t.HasCheckConstraint(
                    "CK_Schedule_Period",
                     "\"PeriodNumber\" >= 1 AND \"PeriodNumber\" <= 7");

                t.HasCheckConstraint(
                    "CK_Schedule_ClassOrEvent",
                    "\"ClassId\" IS NOT NULL OR \"EventId\" IS NOT NULL");
            });
        }

        /// Empty after the last meeting update, we may assume data integrity so we do not complicate things (May implement later).
        /// Drop all the ideas in this methods this is only a draft.
        private static void _ConfigureIndexes(EntityTypeBuilder<WeeklySchedule> builder)
        {
            // Event "Support" Must have a class id -> service implmented 
            // Event "StandBy" Can't have a class id -> service implemented

            // builder.HasIndex(ws => new { ws.TeacherId, ws.DayOfWeek, ws.PeriodNumber })
            //        .IsUnique()
            //        .HasDatabaseName("IX_WeeklySchedules_TeacherSlot_Active")
            //        .HasFilter("\"DeletedAt\" IS NULL");

            // Removed: .IsUnique() - Handling this on service layer to allow "Support Bypass"
            // builder.HasIndex(ws => new { ws.ClassId, ws.DayOfWeek, ws.PeriodNumber })
            //        .HasDatabaseName("IX_WeeklySchedules_ClassSlot_Active")
            //        .HasFilter("\"ClassId\" IS NOT NULL AND \"DeletedAt\" IS NULL");
        }

        private static void _ConfigurePerformanceIndexes(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.HasIndex(ws => ws.EventId)
                   .HasDatabaseName("IX_WeeklySchedules_EventId")
                   .HasFilter("\"EventId\" IS NOT NULL");

            builder.HasIndex(ws => new { ws.DayOfWeek, ws.PeriodNumber })
                   .HasDatabaseName("IX_WeeklySchedules_DayPeriod_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(ws => ws.TeacherId)
                   .HasDatabaseName("IX_WeeklySchedules_TeacherId");

            builder.HasIndex(ws => ws.ClassId)
                   .HasDatabaseName("IX_WeeklySchedules_ClassId")
                   .HasFilter("\"ClassId\" IS NOT NULL");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.HasMany(ws => ws.Substitutions)
                   .WithOne(s => s.WeeklySchedule)
                   .HasForeignKey(s => s.WeeklyScheduleId)
                   .HasConstraintName("FK_Substitutions_WeeklySchedule")
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
