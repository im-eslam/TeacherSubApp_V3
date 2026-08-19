using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configs
{
    public class SchoolClassConfig : IEntityTypeConfiguration<SchoolClass>
    {
        public void Configure(EntityTypeBuilder<SchoolClass> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureCheckConstraints(builder);
            _ConfigureIndexes(builder);
            _ConfigureRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<SchoolClass> builder)
        {
            builder.ToTable("Classes");
            builder.HasKey(c => c.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<SchoolClass> builder)
        {
            builder.Property(c => c.DisplayName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(c => c.Grade)
                   .IsRequired(false);

            builder.Property(c => c.Section)
                    .IsRequired(false);
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<SchoolClass> builder)
        {
            builder.Property(c => c.DeletedAt)
                   .IsRequired(false);

            builder.Property(c => c.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");

            builder.Property(c => c.UpdatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");
        }

        private static void _ConfigureCheckConstraints(EntityTypeBuilder<SchoolClass> builder)
        {
            builder.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Class_Grade_Positive", "\"Grade\" > 0");
                t.HasCheckConstraint("CK_Class_Section_Positive", "\"Section\" > 0");
                t.HasCheckConstraint(
                    "CK_Class_GradeSection_Pair",
                    "(\"Grade\" IS NULL AND \"Section\" IS NULL) OR (\"Grade\" IS NOT NULL AND \"Section\" IS NOT NULL)"
                );
            });
        }

        private static void _ConfigureIndexes(EntityTypeBuilder<SchoolClass> builder)
        {
            builder.HasIndex(c => c.DisplayName)
                   .IsUnique()
                   .HasDatabaseName("IX_Classes_DisplayName_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(c => new { c.Grade, c.Section })
                   .IsUnique()
                   .HasDatabaseName("IX_Classes_GradeSection_Active")
                   .HasFilter("\"DeletedAt\" IS NULL AND \"Grade\" IS NOT NULL AND \"Section\" IS NOT NULL");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<SchoolClass> builder)
        {
            // Not using set null (there is no meaning in keeping a teacher weekly schedule slot that does not have a class assigned), but keeping it here as a fallback.
            // (EventId = [value] && ClassId = Null) -> Slot gone completely.
            // (EventId = [value] && ClassId = [value]) -> special class, also gone.
            // The service will handle the soft delete of related WeeklySchedules when a SchoolClass is soft deleted.
            builder.HasMany(c => c.WeeklySchedules)
                   .WithOne(ws => ws.SchoolClass)
                   .HasForeignKey(ws => ws.ClassId)
                   .HasConstraintName("FK_WeeklySchedules_Classes")
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
