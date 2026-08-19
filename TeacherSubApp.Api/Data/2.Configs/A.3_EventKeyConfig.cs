using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configs
{
    public class EventKeyConfig : IEntityTypeConfiguration<EventKey>
    {
        public void Configure(EntityTypeBuilder<EventKey> builder)
        {
            _ConfigureTableAndKey(builder);
            _ConfigureProperties(builder);
            _ConfigureAuditProperties(builder);
            _ConfigureCheckConstraints(builder);
            _ConfigureIndexes(builder);
            _ConfigureRelationships(builder);
        }

        private static void _ConfigureTableAndKey(EntityTypeBuilder<EventKey> builder)
        {
            builder.ToTable("EventKeys");
            builder.HasKey(e => e.Id);
        }

        private static void _ConfigureProperties(EntityTypeBuilder<EventKey> builder)
        {
            builder.Property(e => e.EventName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(e => e.IsSupport)
                   .IsRequired()
                   .HasDefaultValue(false);

            builder.Property(e => e.IsStandby)
                   .IsRequired()
                   .HasDefaultValue(false);
        }

        private static void _ConfigureAuditProperties(EntityTypeBuilder<EventKey> builder)
        {
            builder.Property(e => e.DeletedAt)
                   .IsRequired(false);

            builder.Property(e => e.CreatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");

            builder.Property(e => e.UpdatedAt)
                   .IsRequired()
                   .HasDefaultValueSql("now()");
        }

        private static void _ConfigureCheckConstraints(EntityTypeBuilder<EventKey> builder)
        {
            builder.ToTable(t =>
            {
                t.HasCheckConstraint(
                "CK_EventKeys_ExclusiveFlags",
                "NOT (\"IsSupport\" = true AND \"IsStandby\" = true)");
            });
        }

        private static void _ConfigureIndexes(EntityTypeBuilder<EventKey> builder)
        {
            builder.HasIndex(e => e.EventName)
                   .IsUnique()
                   .HasDatabaseName("IX_EventKeys_Name_Active")
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(e => e.IsSupport)
                   .IsUnique()
                   .HasDatabaseName("IX_EventKeys_IsSupport_Active_Unique")
                   .HasFilter("\"DeletedAt\" IS NULL AND \"IsSupport\" = true");

            builder.HasIndex(e => e.IsStandby)
                   .IsUnique()
                   .HasDatabaseName("IX_EventKeys_IsStandby_Active_Unique")
                   .HasFilter("\"DeletedAt\" IS NULL AND \"IsStandby\" = true");
        }

        private static void _ConfigureRelationships(EntityTypeBuilder<EventKey> builder)
        {
            builder.HasMany(e => e.WeeklySchedules)
                   .WithOne(ws => ws.EventKey)
                   .HasForeignKey(ws => ws.EventId)
                   .HasConstraintName("FK_WeeklySchedules_EventKeys")
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
