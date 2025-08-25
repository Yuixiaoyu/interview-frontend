// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /interview/get/detail */
export async function getInterviewDetailBySessionId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInterviewDetailBySessionIdParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListAiInterviewRecords>(
    "/interview/get/detail",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 GET /interview/get/session */
export async function getInterviewSession(options?: { [key: string]: any }) {
  return request<API.BaseResponseListAiSession>("/interview/get/session", {
    method: "GET",
    ...(options || {}),
  });
}
