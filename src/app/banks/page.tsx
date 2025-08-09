"use server";
import "./index.css";
import Title from "antd/es/typography/Title";
import {message} from "antd";
import {listQuestionBankVoByPage} from "@/api/questionBankController";
import QuestionBankList from "@/components/QuestionBankList";

/**
 * 题库列表页
 * @returns
 */
export default async function BanksPage() {

    let questionBankList = [];

    try{
        const res = await listQuestionBankVoByPage({
            pageSize: 200, //题库全获取，方便网站收录
            sortField: "createTime",
            sortOrder: "descend"
        })
        questionBankList = res.data.records ?? [];
    }catch (e:any) {
        message.error("获取题库列表失败:"+e.message)
    }


    return (
    <div id="banksPage" className="max-width-content">
        <Title level={3}>题库大全</Title>
      <QuestionBankList questionBankList={questionBankList} />
    </div>
  );
}
