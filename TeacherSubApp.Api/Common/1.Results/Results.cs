using TeacherSubApp.Api.Common.Results;

namespace TeacherSubApp.Api.Common
{
    public enum ErrorType
    {
        None = 0,
        Validation = 1,
        NotFound = 2,
        Conflict = 3,
        Unauthorized = 4,
        Forbidden = 5,   
        Failure = 6
    }

    public record Result
    {
        public bool IsSuccess { get; init; }
        public bool IsFailure => !IsSuccess;

        public ErrorType ErrorType { get; init; } = ErrorType.None;
        public Error Error { get; init; } = Error.None;

        public string ErrorCode => Error.Code;
        public string ErrorMessageEn => Error.MessageEn;
        public string ErrorMessageAr => Error.MessageAr;


        public static Result Success()
        {
            return new Result { IsSuccess = true };
        }

        public static Result Failure(ErrorType errorType, Error error)
        {
            if (error == Error.None)
                throw new InvalidOperationException("Cannot pass Error.None to a failed Result.");

            return new Result
            {
                IsSuccess = false,
                ErrorType = errorType,
                Error = error,
            };
        }
    }

    public record Result<T> : Result
    {
        public T? Value { get; init; }

        public static Result<T> Success(T value)
        {
            return new Result<T>
            {
                IsSuccess = true,
                Value = value,
                ErrorType = ErrorType.None
            };
        }

        public static new Result<T> Failure(ErrorType errorType, Error error)
        {
            if (error == Error.None)
                throw new InvalidOperationException("Cannot pass Error.None to a failed Result. You must provide a valid Error.");

            return new Result<T>
            {
                IsSuccess = false,
                ErrorType = errorType,
                Error = error,
            };
        }
    }
}