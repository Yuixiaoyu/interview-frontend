"use server";
import "./index.css";
import Title from "antd/es/typography/Title";
import {Avatar, Button, Card, message} from "antd";
import {getQuestionBankVoById} from "@/api/questionBankController";
import QuestionList from "@/components/QuestionList";
import Meta from "antd/es/card/Meta";
import Paragraph from "antd/es/typography/Paragraph";

/**
 * 题库详情页
 * @returns  Home Page
 */
export default async function BankPage({ params }) {
  const { questionBankId } = params;
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
    return <div>获取题库失败，请刷新重试</div>;
  }

  // 获取第一道题目
  let firstQuestionId;
  if (bank.questionPage?.records && bank.questionPage.records.length > 0) {
    firstQuestionId = bank.questionPage.records[0].id;
  }

  return (
    <div id="bankPage" className="max-width-content">
      <Card>
        <Meta
          avatar={<Avatar src={bank.picture} size={72} />}
          title={
            <Title level={3} style={{ marginBottom: 0 }}>
              {bank.title}
            </Title>
          }
          description={
            <>
              <Paragraph type="secondary">{bank.description}</Paragraph>
              <Button
                type="primary"
                shape={"round"}
                href={`/bank/${questionBankId}/question/${firstQuestionId}`}
                disabled={!firstQuestionId}
              >
                开始刷题
              </Button>
            </>
          }
        />
      </Card>
      <div style={{ marginBottom: 20 }} />
      <QuestionList
        questionBankId={questionBankId}
        questionList={bank.questionPage?.records ?? []}
        cardTitle={`题目列表(${bank.questionPage?.total || 0})`}
      />
    </div>
  );
}
