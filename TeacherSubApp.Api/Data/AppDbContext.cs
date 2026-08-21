using Microsoft.EntityFrameworkCore;
using System.Reflection;
using TeacherSubApp.Api.Data.Models;

namespace TeacherSubApp.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Subject> Subjects { get; set; }
        public DbSet<SchoolClass> Classes { get; set; }
        public DbSet<EventKey> EventKeys { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<TeacherAbsence> TeacherAbsences { get; set; }
        public DbSet<Substitution> Substitutions { get; set; }
        public DbSet<WeeklySchedule> WeeklySchedules { get; set; }
        public DbSet<SubstitutionAlgorithmSetting> SubstitutionAlgorithmSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        }
    }
}
