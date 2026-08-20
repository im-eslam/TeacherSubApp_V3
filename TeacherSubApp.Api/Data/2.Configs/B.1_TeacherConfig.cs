using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configs
{
    public class TeacherConfig : IEntityTypeConfiguration<Teacher>
    {
        public void Configure(EntityTypeBuilder<Teacher> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureIndexes(builder);
            _ConfigurePerformanceIndexes(builder);
            _ConfigureRelationships(builder);
            _ConfigureMirrorRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<Teacher> builder)
        {
            builder.ToTable("Teachers");
            builder.HasKey(t => t.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<Teacher> builder)
        {
            builder.Property(t => t.Name)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(t => t.SubjectId)
                   .IsRequired(false);

            builder.Property(t => t.IsSupervisor)
                   .IsRequired()
                   .HasDefaultValue(false);
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<Teacher> builder)
        {
            builder.Property(t => t.DeletedAt)
                   .IsRequired(false);

            builder.Property(t => t.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");

            builder.Property(t => t.UpdatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");
        }

        private static void _ConfigureIndexes(EntityTypeBuilder<Teacher> builder)
        {
            builder.HasIndex(t => t.Name)
                   .IsUnique()
                   .HasDatabaseName("IX_Teachers_Name_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");
        }

        private static void _ConfigurePerformanceIndexes(EntityTypeBuilder<Teacher> builder)
        {
            builder.HasIndex(t => t.SubjectId)
                   .HasDatabaseName("IX_Teachers_SubjectId")
                   .HasFilter("\"SubjectId\" IS NOT NULL");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<Teacher> builder)
        {
            builder.HasMany(t => t.WeeklySchedules)
                   .WithOne(ws => ws.Teacher)
                   .HasForeignKey(ws => ws.TeacherId)
                   .HasConstraintName("FK_WeeklySchedules_Teachers")
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(t => t.Absences)
                   .WithOne(a => a.Teacher)
                   .HasForeignKey(a => a.TeacherId)
                   .HasConstraintName("FK_TeacherAbsences_Teachers")
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(t => t.Substitutions)
                   .WithOne(s => s.SubstituteTeacher)
                   .HasForeignKey(s => s.SubstituteTeacherId)
                   .HasConstraintName("FK_Substitutions_SubstituteTeacher")
                   .OnDelete(DeleteBehavior.Restrict);
        }

        private static void _ConfigureMirrorRelationships(EntityTypeBuilder<Teacher> builder)
        {
            builder.HasOne(t => t.Subject)
                   .WithMany(s => s.Teachers)
                   .HasForeignKey(t => t.SubjectId)
                   .HasConstraintName("FK_Teachers_Subjects")
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
