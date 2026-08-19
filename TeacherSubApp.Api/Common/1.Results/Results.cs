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
        public bool IsSuccess { get; }
        public bool IsFailure => !IsSuccess;

        public ErrorType ErrorType { get; }
        public Error Error { get; }

        protected Result (bool isSuccess, ErrorType errorType, Error error)
        {
            IsSuccess = isSuccess;
            ErrorType = errorType;
            Error = error;
        }

        public static Result Success ( )
        {
            return new Result(true, ErrorType.None, Error.None());
        }

        public static Result Failure (ErrorType errorType, Error error)
        {
            if(errorType == ErrorType.None)
                throw new InvalidOperationException("Cannot pass ErrorType.None to a failed Result. You must provide a valid ErrorType.");
            if(error == Error.None())
                throw new InvalidOperationException("Cannot pass Error.None to a failed Result. You must provide a valid Error.");

            return new Result(false, errorType, error);
        }
    }

    public sealed record Result<T> : Result
    {
        public T? Value { get; init; }

        private Result (bool isSuccess, ErrorType errorType, Error error, T? value) : base(isSuccess, errorType, error)
        {
            Value = value;
        }

        public static Result<T> Success (T value)
        {
            return new Result<T>(true, ErrorType.None, Error.None(), value);
        }

        public static new Result<T> Failure (ErrorType errorType, Error error)
        {
            if(errorType == ErrorType.None)
                throw new InvalidOperationException("Cannot pass ErrorType.None to a failed Result. You must provide a valid ErrorType.");
            if(error == Error.None())
                throw new InvalidOperationException("Cannot pass Error.None to a failed Result. You must provide a valid Error.");

            return new Result<T>(false, errorType, error, default);
        }
    }
}