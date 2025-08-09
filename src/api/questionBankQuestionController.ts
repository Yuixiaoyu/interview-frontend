// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 POST /questionBankQuestion/add */
export async function addQuestionBankQuestion(
  body: API.QuestionBankQuestionAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>(`${/api/}/questionBankQuestion/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /questionBankQuestion/add/batch */
export async function saveBathQuestionToBank(
  body: API.QuestionBankQuestionBatchAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>(
    `${/api/}/questionBankQuestion/add/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/delete */
export async function deleteQuestionBankQuestion(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>(
    `${/api/}/questionBankQuestion/delete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 GET /questionBankQuestion/get/vo */
export async function getQuestionBankQuestionVoById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuestionBankQuestionVOByIdParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseQuestionBankQuestionVO>(
    `${/api/}/questionBankQuestion/get/vo`,
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/list/page */
export async function listQuestionBankQuestionByPage(
  body: API.QuestionBankQuestionQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageQuestionBankQuestion>(
    `${/api/}/questionBankQuestion/list/page`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/list/page/vo */
export async function listQuestionBankQuestionVoByPage(
  body: API.QuestionBankQuestionQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageQuestionBankQuestionVO>(
    `${/api/}/questionBankQuestion/list/page/vo`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/my/list/page/vo */
export async function listMyQuestionBankQuestionVoByPage(
  body: API.QuestionBankQuestionQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageQuestionBankQuestionVO>(
    `${/api/}/questionBankQuestion/my/list/page/vo`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/remove */
export async function removeQuestionBankQuestion(
  body: API.QuestionBankQuestionRemoveRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>(
    `${/api/}/questionBankQuestion/remove`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/remove/batch */
export async function removeBathQuestionFromBank(
  body: API.QuestionBankQuestionBatchRemoveRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>(
    `${/api/}/questionBankQuestion/remove/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /questionBankQuestion/update */
export async function updateQuestionBankQuestion(
  body: API.QuestionBankQuestionUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>(
    `${/api/}/questionBankQuestion/update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}
