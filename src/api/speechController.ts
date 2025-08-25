// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /ai/speech/stream/tts */
export async function streamTts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.streamTTSParams,
  options?: { [key: string]: any }
) {
  return request<string>("/ai/speech/stream/tts", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /ai/speech/tts */
export async function ttsFile(options?: { [key: string]: any }) {
  return request<any>("/ai/speech/tts", {
    method: "GET",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /ai/speech/ttsStream */
export async function ttsStream(options?: { [key: string]: any }) {
  return request<string[]>("/ai/speech/ttsStream", {
    method: "GET",
    ...(options || {}),
  });
}
