using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configs
{
    public sealed class TeacherAbsenceConfig : IEntityTypeConfiguration<TeacherAbsence>
    {
        public void Configure(EntityTypeBuilder<TeacherAbsence> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureIndexes(builder);
            _ConfigureRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<TeacherAbsence> builder)
        {
            builder.ToTable("TeacherAbsences");
            builder.HasKey(a => a.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<TeacherAbsence> builder)
        {
            builder.Property(a => a.TeacherId)
                   .IsRequired();

            builder.Property(a => a.AbsenceDate)
                   .IsRequired();

            builder.Property(a => a.Reason)
                   .IsRequired(false)
                   .HasMaxLength(500);
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<TeacherAbsence> builder)
        {
            builder.Property(a => a.DeletedAt)
                   .IsRequired(false);

            builder.Property(a => a.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");

            builder.Property(a => a.UpdatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");
        }

        private static void _ConfigureIndexes(EntityTypeBuilder<TeacherAbsence> builder)
        {
            builder.HasIndex(a => new { a.TeacherId, a.AbsenceDate })
                   .IsUnique()
                   .HasDatabaseName("IX_TeacherAbsences_TeacherId_Date_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(a => a.TeacherId)
                   .HasDatabaseName("IX_TeacherAbsences_TeacherId");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<TeacherAbsence> builder)
        {
            builder.HasOne(a => a.Teacher)
                   .WithMany(t => t.Absences)
                   .HasForeignKey(a => a.TeacherId)
                   .HasConstraintName("FK_TeacherAbsences_Teachers")
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
