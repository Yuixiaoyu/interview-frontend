// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /file/question/get */
export async function questionGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListString>("/file/question/get", {
    method: "GET",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /file/resume/analyze/upload */
export async function resumeUploadFileAnalyzeLocal(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.resumeUploadFileAnalyzeLocalParams,
  body: {},
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseResumeDocument>(
    "/file/resume/analyze/upload",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        // biz has a default value: resume
        biz: "resume",
        ...params,
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 GET /file/resume/get */
export async function resumeGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseResumeDocument>("/file/resume/get", {
    method: "GET",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /file/upload */
export async function uploadFile(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.uploadFileParams,
  body: {},
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseString>("/file/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      // biz has a default value: resume
      biz: "resume",
      ...params,
    },
    data: body,
    ...(options || {}),
  });
}
