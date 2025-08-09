"use server";
import "./index.css";
import {message,} from "antd";
import {getQuestionVoById,} from "@/api/questionController";
import QuestionDetail from "@/components/QuestionDetail";

/**
 * 题目详情页
 * @returns  QuestionPage
 */
export default async function QuestionPage({ params }) {
  const { questionId } = params;

  // 获取题目详情
  let question = undefined;
  try {
    const res = await getQuestionVoById({
      id: questionId,
    });
    question = res.data ?? [];
  } catch (e: any) {
    message.error("获取题目详情失败:" + e.message);
  }
  if (!question) {
    return <div>获取题目详情失败，请刷新重试</div>;
  }

  return (
    <div id="questionPage">
      <QuestionDetail question={question} />
    </div>
  );
}
