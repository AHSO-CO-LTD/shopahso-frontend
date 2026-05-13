export type ApiPrimitive = string | number | boolean;

export type ApiQueryParams = Record<
  string,
  ApiPrimitive | null | undefined
>;

export type ApiResponseType = "json" | "text" | "blob" | "none";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  query?: ApiQueryParams;
  responseType?: ApiResponseType;
  timeoutMs?: number;
};

export type ApiProbeResult = {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
};
