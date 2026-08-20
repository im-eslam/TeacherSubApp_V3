using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configurations
{
    public class C2_SubstitutionConfig : IEntityTypeConfiguration<Substitution>
    {
        public void Configure(EntityTypeBuilder<Substitution> builder)
        {
            builder.ToTable("Substitutions");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.AbsenceId)
                .IsRequired();

            builder.Property(s => s.WeeklyScheduleId)
                .IsRequired();

            builder.Property(s => s.SubstituteTeacherId)
                .IsRequired();

            builder.Property(s => s.ServiceDate)
                .IsRequired();

            builder.Property(s => s.IsAlgorithmMatch)
                .IsRequired();

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
                .IsRequired(false)
                .HasMaxLength(100);

            builder.Property(s => s.PeriodNumberAtTimeOfService)
                .IsRequired();

            builder.Property(s => s.DeletedAt)
                .IsRequired(false);

            builder.Property(s => s.CreatedAt)
                .HasDefaultValueSql("now()");

            builder.Property(s => s.UpdatedAt)
                .HasDefaultValueSql("now()");

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

            builder.HasIndex(s => s.SubstituteTeacherId)
                .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasIndex(s => s.ServiceDate)
                .HasFilter("\"DeletedAt\" IS NULL");
        }
    }
}
