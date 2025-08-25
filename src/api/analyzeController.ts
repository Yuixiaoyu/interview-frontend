// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /analyze/fileStream */
export async function streamAnalyzeFile(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.streamAnalyzeFileParams,
  options?: { [key: string]: any }
) {
  return request<API.SseEmitter>("/analyze/fileStream", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /analyze/videoStream */
export async function analyzeVideo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.analyzeVideoParams,
  options?: { [key: string]: any }
) {
  return request<API.SseEmitter>("/analyze/videoStream", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
