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
            ArgumentNullException.ThrowIfNull(error, nameof(error));

            if(isSuccess && (errorType != ErrorType.None || error != Error.None()))
                throw new InvalidOperationException("A successful Result must use ErrorType.None and Error.None().");

            if(!isSuccess && (errorType == ErrorType.None || error == Error.None()))
                throw new InvalidOperationException("A failed Result must use a valid ErrorType and a valid Error.");

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
            return new Result(false, errorType, error);
        }
    }

    public sealed record Result<T> : Result
    {
        public T? Value { get; }

        private Result (bool isSuccess, ErrorType errorType, Error error, T? value) : base(isSuccess, errorType, error)
        {
            Value = value;
        }

        public static Result<T> Success (T value)
        {
            return new Result<T>(isSuccess: true, errorType: ErrorType.None, error: Error.None(), value);
        }

        public static new Result<T> Failure (ErrorType errorType, Error error)
        {
            return new Result<T>(isSuccess: false, errorType, error, value: default);
        }
    }
}
