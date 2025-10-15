"use server";
import "./index.css";
import Title from "antd/es/typography/Title";
import {message} from "antd";
import {listQuestionVoByPage, searchQuestionVoByPage} from "@/api/questionController";
import QuestionTable from "@/components/QuestionTable";

/**
 * 题目列表页
 * @returns
 */
export default async function QuestionsPage({searchParams}) {

  //获取url查询参数
  const {q:searchText} = searchParams;
  //题目列表和总数
  let questionList= [] ;
  let total = 0;

  try{
    // 如果有搜索参数，使用搜索API；否则使用列表API
    const res = searchText
      ? await searchQuestionVoByPage({
          searchText,
          pageSize: 16,
          sortField: "_score",
          sortOrder: "descend"
        })
      : await listQuestionVoByPage({
          pageSize: 16,
          sortField: "createTime",
          sortOrder: "descend"
        });

    questionList = res.data.records ?? [];
    total  = res.data.total ?? 0;
  }catch (e:any) {
    message.error("获取题目列表失败:"+e.message)
  }


  return (
      <div id="questionsPage" className="max-width-content">
        <Title level={3}>题目大全</Title>
        <QuestionTable defaultQuestionList={questionList}  defaultTotal={total} defaultSearchParams={{
          title: searchText
        }} />
      </div>
  );
}
