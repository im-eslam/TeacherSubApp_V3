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

        private static void _ConfigureIndexes(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.HasIndex(ws => new { ws.TeacherId, ws.DayOfWeek, ws.PeriodNumber })
                   .IsUnique()
                   .HasDatabaseName("UX_WeeklySchedules_TeacherSlot_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(ws => new { ws.ClassId, ws.DayOfWeek, ws.PeriodNumber })
                   .IsUnique()
                   .HasDatabaseName("UX_WeeklySchedules_ClassSlot_Active")
                   .HasFilter("\"ClassId\" IS NOT NULL AND \"DeletedAt\" IS NULL");

            builder.HasIndex(ws => new { ws.EventId, ws.DayOfWeek, ws.PeriodNumber })
                   .IsUnique()
                   .HasDatabaseName("UX_WeeklySchedules_EventSlot_Active")
                   .HasFilter("\"EventId\" IS NOT NULL AND \"DeletedAt\" IS NULL");

            builder.HasIndex(ws => new { ws.DayOfWeek, ws.PeriodNumber })
                   .HasDatabaseName("IX_WeeklySchedules_DayPeriod_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<WeeklySchedule> builder)
        {
            builder.HasOne(ws => ws.Teacher)
                   .WithMany(t => t.WeeklySchedules)
                   .HasForeignKey(ws => ws.TeacherId)
                   .HasConstraintName("FK_WeeklySchedules_Teachers")
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ws => ws.SchoolClass)
                   .WithMany(c => c.WeeklySchedules)
                   .HasForeignKey(ws => ws.ClassId)
                   .HasConstraintName("FK_WeeklySchedules_Classes")
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ws => ws.EventKey)
                   .WithMany(e => e.WeeklySchedules)
                   .HasForeignKey(ws => ws.EventId)
                   .HasConstraintName("FK_WeeklySchedules_EventKeys")
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(ws => ws.Substitutions)
                   .WithOne(s => s.WeeklySchedule)
                   .HasForeignKey(s => s.WeeklyScheduleId)
                   .HasConstraintName("FK_Substitutions_WeeklySchedule")
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
