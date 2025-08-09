// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /ai/speech/tts */
export async function tts(options?: { [key: string]: any }) {
  return request<any>(`${/api/}/ai/speech/tts`, {
    method: "GET",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /ai/speech/ttsStream */
export async function ttsStream(options?: { [key: string]: any }) {
  return request<any>(`${/api/}/ai/speech/ttsStream`, {
    method: "GET",
    ...(options || {}),
  });
}
