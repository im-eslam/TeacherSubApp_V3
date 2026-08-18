import { type ApiError, FrontendError, isApiError } from "./apiClient";

const FrontendErrorTranslations: Record<FrontendError["errorCode"], string> = {
  NETWORK_ERROR: "تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.",
  UNKNOWN_ERROR: "حدث خطأ غير معروف.",
};

function getBackendErrorMessage(
  error: ApiError,
  featureTranslations?: Record<string, string>,
): string {
  const message =
    featureTranslations?.[error.errorCode] ?? error.errorMessageAr;

  if (error.traceId) {
    return `${message} (المرجع: ${error.traceId.substring(0, 8)})`;
  }

  return message;
}

function getFrontendErrorMessage(error: FrontendError): string {
  return FrontendErrorTranslations[error.errorCode];
}

export const getErrorMessage = (
  error: unknown,
  featureTranslations?: Record<string, string>,
): string => {
  if (error instanceof FrontendError) {
    return getFrontendErrorMessage(error);
  }

  if (isApiError(error)) {
    return getBackendErrorMessage(error, featureTranslations);
  }

  return FrontendErrorTranslations.UNKNOWN_ERROR;
};
