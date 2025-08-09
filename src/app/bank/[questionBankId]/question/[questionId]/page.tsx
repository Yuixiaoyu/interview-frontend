"use server";
import "./index.css";
import Title from "antd/es/typography/Title";
import {Flex, Menu, message,} from "antd";
import Link from "next/link";
import {getQuestionBankVoById,} from "@/api/questionBankController";
import {getQuestionVoById,} from "@/api/questionController";
import Sider from "antd/es/layout/Sider";
import {Content} from "antd/es/layout/layout";
import QuestionDetail from "@/components/QuestionDetail";

/**
 * 题库题目详情页
 * @returns  Home Page
 */
export default async function BankQuestionPage({ params }) {
  const { questionBankId, questionId } = params;
  // 获取题库详情
  let bank: API.QuestionBankVO = undefined;
  try {
    const res = await getQuestionBankVoById({
      id: questionBankId,
      needQueryQuestionList: true,
      pageSize: 200,
    });
    bank = res.data ?? [];
  } catch (e: any) {
    message.error("获取题库列表失败:" + e.message);
  }
  if (!bank) {
    return <div>获取题库详情失败，请刷新重试</div>;
  }


  // 获取题目详情
  let question: API.QuestionVO = undefined;
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
  // 题目菜单列表
  const questionMenuItemList = (bank.questionPage?.records ||[]).map(q=>{
    return {
      label: <Link href={`/bank/${bank.id}/question/${q.id}`}>{q.title}</Link>,
      key: q.id,
    }
  })

  return (
    <div id="bankQuestionPage">
      <Flex gap={22}>
        <Sider width={220} theme="light" style={{ padding: "24px 0" }}>
          <Title level={4} style={{ padding: "0 20px" }}>
            {bank.title}
          </Title>
          <Menu items={questionMenuItemList} selectedKeys={[question.id]}/>
        </Sider>
        <Content>
          <QuestionDetail question={question} />
        </Content>
      </Flex>
    </div>
  );
}
