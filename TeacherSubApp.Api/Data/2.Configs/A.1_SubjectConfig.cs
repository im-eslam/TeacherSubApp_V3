using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Config
{
    public sealed class SubjectConfig : IEntityTypeConfiguration<Subject>
    {
        public void Configure(EntityTypeBuilder<Subject> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureIndexes(builder);
            _ConfigureRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<Subject> builder)
        {
            builder.ToTable("Subjects");
            builder.HasKey(s => s.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<Subject> builder)
        {
            builder.Property(s => s.Name)
                   .IsRequired()
                   .HasMaxLength(100);
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<Subject> builder)
        {
            builder.Property(s => s.DeletedAt)
                   .IsRequired(false);

            builder.Property(s => s.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");

            builder.Property(s => s.UpdatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");
        }

        private static void _ConfigureIndexes(EntityTypeBuilder<Subject> builder)
        {
            builder.HasIndex(s => s.Name)
                   .IsUnique()
                   .HasDatabaseName("IX_Subjects_Name_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<Subject> builder)
        {
            builder.HasMany(s => s.Teachers)
                   .WithOne(t => t.Subject)
                   .HasForeignKey(t => t.SubjectId)
                   .HasConstraintName("FK_Teachers_Subjects")
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}