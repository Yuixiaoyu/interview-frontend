import { updateQuestion } from "@/api/questionController";
import {Button, Form, message, Modal, Select} from "antd";
import React, { useEffect, useState } from "react";
import {
  addQuestionBankQuestion,
  listQuestionBankQuestionByPage,
  removeQuestionBankQuestion, saveBathQuestionToBank,
} from "@/api/questionBankQuestionController";
import { listQuestionBankVoByPage } from "@/api/questionBankController";
import {list} from "postcss";

interface Props {
  questionIdList?: number[];
  visible: boolean;
  onSubmit: ()=>void;
  onCancel: () => void;
}



/**
 * 批量向题库添加题目弹窗
 * @param props
 * @constructor
 */
const BatchAddQuestionsToBankModal: React.FC<Props> = (props) => {
  const { questionIdList=[], visible, onCancel ,onSubmit} = props;

  const [form] = Form.useForm();

  const [questionBankList, setQuestionBankList] = useState<
    API.QuestionBankVO[]
  >([]);


  /**
   * 提交
   *
   * @param row
   */
  const doSubmit = async (value: API.QuestionBankQuestionAddRequest) => {
    const hide = message.loading("正在操作");
    const questionBankId = value.questionBankId;

    if (!questionBankId) return ;


    try {
      await saveBathQuestionToBank({
        questionBankId,
        questionIdList,
      });
      hide();
      message.success("操作成功");
      onSubmit?.();
    } catch (error: any) {
      hide();
      message.error("操作失败，" + error.message);
    }
  };


  // 获取题库列表
  const getQuestionBankList = async () => {
    try {
      const res = await listQuestionBankVoByPage({
        pageSize: 200, //题库不多，全量获取
        sortField: "createTime",
        sortOrder: "descend",
      });
      setQuestionBankList(res.data?.records ?? []);
    } catch (e: any) {
      message.error("获取题库列表失败," + e.message);
    }
  };

  useEffect(() => {
    getQuestionBankList();
  }, []);

  return (
    <Modal
      destroyOnClose
      title={"批量向题库添加题目"}
      open={visible}
      footer={null}
      onCancel={() => {
        onCancel?.();
      }}
    >
      <Form form={form} style={{ marginTop: 24 }} onFinish={doSubmit}>
        <Form.Item label={"选择题库"} name={"questionBankIdList"}>
          <Select
            style={{ width: "100%" }}
            placeholder="请选择所属题库"
            options={questionBankList.map((questionBank) => {
              return {
                label: questionBank.title,
                value: questionBank.id,
              };
            })}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">提交</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default BatchAddQuestionsToBankModal;
