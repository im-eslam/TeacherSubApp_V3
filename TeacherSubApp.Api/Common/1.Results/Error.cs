namespace TeacherSubApp.Api.Common.Results
{
    public sealed record Error
    {
        public string Code { get; }
        public string MessageEn { get; }
        public string MessageAr { get; }

        private Error (string code, string messageEn, string messageAr)
        {
            Code = code;
            MessageEn = messageEn;
            MessageAr = messageAr;
        }

        public static Error Create (string code, string messageEn, string messageAr)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(code, nameof(code));
            ArgumentException.ThrowIfNullOrWhiteSpace(messageEn, nameof(messageEn));
            ArgumentException.ThrowIfNullOrWhiteSpace(messageAr, nameof(messageAr));

            return new Error(code.Trim(), messageEn.Trim(), messageAr.Trim());
        }

        public static Error None ( )
        {
            return new Error(string.Empty, string.Empty, string.Empty);
        }
    }
}