export interface ApiError {
  errorCode: string;
  errorMessageEn: string;
  errorMessageAr: string;
  traceId?: string | null;
}

export class FrontendError extends Error {
  public readonly errorCode: "NETWORK_ERROR" | "UNKNOWN_ERROR";

  constructor(errorCode: "NETWORK_ERROR" | "UNKNOWN_ERROR") {
    super();
    this.name = "FrontendError";
    this.errorCode = errorCode;
  }
}

export const isApiError = (value: unknown): value is ApiError => {
  return (
    typeof value === "object" &&
    value !== null &&
    "errorCode" in value &&
    "errorMessageEn" in value &&
    "errorMessageAr" in value
  );
};

const API_BASE_URL = "/api";

function createCombinedSignal(customSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(20_000);
  return customSignal
    ? AbortSignal.any([customSignal, timeoutSignal])
    : timeoutSignal;
}

async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (rawError) {
    if (rawError instanceof Error && rawError.name === "AbortError") {
      throw rawError;
    }

    console.error(`[Network Failure] -> ${url}`, rawError);
    throw new FrontendError("NETWORK_ERROR");
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.status === 204 ? (undefined as T) : response.json();
  }

  const errorData = await response.json().catch((rawError) => {
    console.error(
      "[JSON Parse Failure] -> Server returned non-JSON data.",
      rawError,
    );
    return null;
  });

  if (isApiError(errorData)) {
    throw errorData;
  }

  console.error(
    `[Unknown Error Shape] -> status ${response.status} ${response.url}`,
    errorData,
  );
  throw new FrontendError("UNKNOWN_ERROR");
}

export const apiClient = {
  get: async <T>(endpoint: string, customSignal?: AbortSignal): Promise<T> => {
    const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      signal: createCombinedSignal(customSignal),
    });
    return handleResponse<T>(response);
  },

  post: async <T, D = unknown>(
    endpoint: string,
    data: D,
    customSignal?: AbortSignal,
  ): Promise<T> => {
    const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: createCombinedSignal(customSignal),
    });
    return handleResponse<T>(response);
  },

  put: async <T, D = unknown>(
    endpoint: string,
    data: D,
    customSignal?: AbortSignal,
  ): Promise<T> => {
    const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: createCombinedSignal(customSignal),
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(
    endpoint: string,
    customSignal?: AbortSignal,
  ): Promise<T> => {
    const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      signal: createCombinedSignal(customSignal),
    });
    return handleResponse<T>(response);
  },
};
