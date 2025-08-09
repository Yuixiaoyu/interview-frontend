"use client";
import { Avatar, Card, List, Typography } from "antd";
import "./index.css";
import Link from "next/link";
import Title from "antd/es/typography/Title";
import TagList from "@/components/TagList";
import MdViewer from "@/components/MdViewer";
import useAddUserSignInRecord from "@/hooks/useAddUserSignInRecord";

interface Props {
  question: API.QuestionVO;
}

/**
 * 题目详情卡片
 * @param props
 * @constructor
 */
const QuestionDetail = (props: Props) => {
  const { question } = props;

  // 执行签到
  useAddUserSignInRecord()

  return (
    <div className="question-detail">
        <Card>
            <Title level={1} style={{fontSize: 24}}>
                {question.title}
            </Title>
            <TagList tagList={question.tagList} />
            <div style={{marginBottom: "14px"}} />
            <MdViewer value={question.content} />
        </Card>
        <div style={{marginBottom: "14px"}} />
        <Card title={"参考答案"}>
            <MdViewer value={question.answer} />
        </Card>
    </div>
  );
};

export default QuestionDetail;
