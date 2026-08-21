using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data.Configs
{
    public class SubstitutionAlgorithmSettingsConfig
        : IEntityTypeConfiguration<SubstitutionAlgorithmSetting>
    {
        public void Configure(EntityTypeBuilder<SubstitutionAlgorithmSetting> builder)
        {
            _ConfigureTable(builder);
            _ConfigureProperties(builder);
            _ConfigureDefaults(builder);
        }

        private void _ConfigureTable(EntityTypeBuilder<SubstitutionAlgorithmSetting> builder)
        {
            builder.ToTable("SubstitutionAlgorithmSettings");
            builder.HasKey(x => x.Id);
        }

        private void _ConfigureProperties(EntityTypeBuilder<SubstitutionAlgorithmSetting> builder)
        {
            builder.Property(x => x.SubjectMatchWeight)
                .IsRequired();

            builder.Property(x => x.WeeklyLoadWeight)
                .IsRequired();

            builder.Property(x => x.DailyLoadWeight)
                .IsRequired();

            builder.Property(x => x.SubbedYesterdayWeight)
                .IsRequired();

            builder.Property(x => x.ConsecutiveClassWeight)
                .IsRequired();

            builder.Property(x => x.EarlyLeaveWeight)
                .IsRequired();

            builder.Property(x => x.OvertimeThreshold)
                .IsRequired();

            builder.Property(x => x.LowLoadThreshold)
                .IsRequired();

            builder.Property(x => x.DailyLoadThreshold)
                .IsRequired();

            builder.Property(x => x.RestPeriodBreak)
                .IsRequired();
        }

        private void _ConfigureDefaults(EntityTypeBuilder<SubstitutionAlgorithmSetting> builder)
        {
            builder.HasData(new SubstitutionAlgorithmSetting
            {
                Id = 1,

                WeeklyLoadWeight = 14.28,
                DailyLoadWeight = 14.28,
                SubjectMatchWeight = 14.28,
                StandByWeight = 14.28,
                SubbedYesterdayWeight = 14.28,
                ConsecutiveClassWeight = 14.28,
                EarlyLeaveWeight = 14.28,

                OvertimeThreshold = 16,
                LowLoadThreshold = 12,
                DailyLoadThreshold = 4,
                RestPeriodBreak = 4
            });
        }
    }
}