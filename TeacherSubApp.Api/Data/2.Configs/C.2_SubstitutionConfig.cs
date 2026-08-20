using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configurations
{
    public class C2_SubstitutionConfig : IEntityTypeConfiguration<Substitution>
    {
        public void Configure(EntityTypeBuilder<Substitution> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureSnapshotProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureIndexes(builder);
            _ConfigurePerformanceIndexes(builder);
            _ConfigureMirrorRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<Substitution> builder)
        {
            builder.ToTable("Substitutions");
            builder.HasKey(s => s.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<Substitution> builder)
        {
            builder.Property(s => s.AbsenceId)
                .IsRequired();

            builder.Property(s => s.WeeklyScheduleId)
                .IsRequired();

            builder.Property(s => s.SubstituteTeacherId)
                .IsRequired();

            builder.Property(s => s.ServiceDate)
                .IsRequired();

            builder.Property(s => s.IsAlgorithmMatch)
                .IsRequired()
                .HasDefaultValue(true);
        }

        private static void _ConfigureSnapshotProperties(EntityTypeBuilder<Substitution> builder)
        {
            builder.Property(s => s.AbsentTeacherNameAtTimeOfService)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(s => s.AbsentTeacherSubjectAtTimeOfService)
                .IsRequired(false)
                .HasMaxLength(100);

            builder.Property(s => s.SubstituteTeacherNameAtTimeOfService)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(s => s.SubstituteTeacherSubjectAtTimeOfService)
                .IsRequired(false)
                .HasMaxLength(100);

            builder.Property(s => s.ClassNameAtTimeOfService)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(s => s.PeriodNumberAtTimeOfService)
                .IsRequired();
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<Substitution> builder)
        {
            builder.Property(s => s.DeletedAt)
                .IsRequired(false);

            builder.Property(s => s.CreatedAt)
                .HasDefaultValueSql("now()");

            builder.Property(s => s.UpdatedAt)
                .HasDefaultValueSql("now()");
        }

        private static void _ConfigureIndexes(EntityTypeBuilder<Substitution> builder)
        {
            builder.HasIndex(s => new { s.SubstituteTeacherId, s.ServiceDate, s.PeriodNumberAtTimeOfService })
                   .IsUnique()
                   .HasDatabaseName("IX_Substitutions_Teacher_Date_Period_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(s => new { s.WeeklyScheduleId, s.ServiceDate })
                   .IsUnique()
                   .HasDatabaseName("IX_Substitutions_Slot_Date_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");
        }

        private static void _ConfigurePerformanceIndexes(EntityTypeBuilder<Substitution> builder)
        {
            builder.HasIndex(s => s.AbsenceId)
                   .HasDatabaseName("IX_Substitutions_AbsenceId")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(s => s.SubstituteTeacherId)
                .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(s => s.ServiceDate)
                .HasFilter("\"DeletedAt\" IS NULL");
        }

        private static void _ConfigureMirrorRelationships(EntityTypeBuilder<Substitution> builder)
        {
            builder.HasOne(s => s.TeacherAbsence)
                .WithMany(a => a.Substitutions)
                .HasForeignKey(s => s.AbsenceId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Substitutions_TeacherAbsences");

            builder.HasOne(s => s.WeeklySchedule)
                .WithMany(ws => ws.Substitutions)
                .HasForeignKey(s => s.WeeklyScheduleId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Substitutions_WeeklySchedule");

            builder.HasOne(s => s.SubstituteTeacher)
                .WithMany(t => t.Substitutions)
                .HasForeignKey(s => s.SubstituteTeacherId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Substitutions_SubstituteTeacher");
        }
    }
}
