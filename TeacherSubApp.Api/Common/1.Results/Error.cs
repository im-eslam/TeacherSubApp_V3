namespace TeacherSubApp.Api.Common.Results
{
    public record Error(string Code, string MessageEn, string MessageAr)
    {
        public static readonly Error None = new(string.Empty, string.Empty, string.Empty);
    }
}
