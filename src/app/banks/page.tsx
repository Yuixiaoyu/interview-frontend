/**
 * 题库列表页面
 * 目的: 展示所有题库列表，支持 SEO 优化（静态生成）
 * 实现: 服务器端组件，在构建时获取题库数据并渲染
 */
import "./index.css";
import Link from "next/link";
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CompassOutlined,
  ReadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { listQuestionBankVoByPage } from "@/api/questionBankController";
import QuestionBankList from "@/components/QuestionBankList";

/**
 * 题库列表页
 * @returns
 */
export default async function BanksPage() {
  let questionBankList: API.QuestionBankVO[] = [];

  try {
    const res = await listQuestionBankVoByPage({
      pageSize: 200,
      sortField: "createTime",
      sortOrder: "descend",
    });
    questionBankList = res.data.records ?? [];
  } catch (e: any) {
    console.error("获取题库列表失败:", e.message);
  }

  const totalBanks = questionBankList.length;
  const describedBanks = questionBankList.filter(
    (item) => item.description,
  )?.length;
  const coveredBanks = questionBankList.filter((item) => item.picture)?.length;
  const featuredTitles = questionBankList
    .slice(0, 5)
    .map((item) => item.title)
    .filter(Boolean);

  const metrics = [
    {
      icon: <AppstoreOutlined />,
      label: "收录题库",
      value: String(totalBanks).padStart(2, "0"),
      note: "按最新内容持续扩充",
    },
    {
      icon: <ReadOutlined />,
      label: "含简介题库",
      value: String(describedBanks).padStart(2, "0"),
      note: "方便快速识别学习方向",
    },
    {
      icon: <BookOutlined />,
      label: "带封面题库",
      value: String(coveredBanks).padStart(2, "0"),
      note: "浏览体验更直观清晰",
    },
  ];

  const modes = [
    {
      icon: <CompassOutlined />,
      title: "按方向选题库",
      description: "前后端、算法、系统设计等方向可快速进入对应专题。",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "按节奏刷重点",
      description: "从高频题开始建立答题框架，再逐步扩展知识边界。",
    },
    {
      icon: <BookOutlined />,
      title: "按专题做沉淀",
      description: "把零散知识装进成体系的题库里，学习路径更有秩序。",
    },
  ];

  return (
    <div id="banksPage">
      <div className="banks-shell max-width-content">
        <section className="banks-hero">
          <span className="banks-badge">QUESTION BANK DIRECTORY</span>
          <h1 className="banks-title">
            <span>把题库按主题整理好，</span>
            <span>刷题路径就更清晰。</span>
          </h1>
          <p className="banks-subtitle">
            从精选专题切入，用结构化的方式推进刷题节奏。先选方向，再挑题库，最后把知识点练成稳定输出。
          </p>

          <div className="banks-actions">
            <Link href="/start" className="banks-button banks-button-primary">
              返回学习台
              <ArrowRightOutlined />
            </Link>
            <Link
              href="/questions"
              className="banks-button banks-button-secondary"
            >
              查看全部题目
              <ArrowRightOutlined />
            </Link>
          </div>

          {featuredTitles.length > 0 ? (
            <div className="banks-tags">
              {featuredTitles.map((title) => (
                <span key={title} className="banks-tag">
                  {title}
                </span>
              ))}
            </div>
          ) : null}

          <div className="banks-metrics">
            {metrics.map((item) => (
              <div key={item.label} className="banks-metric-card">
                <div className="banks-metric-icon">{item.icon}</div>
                <span className="banks-metric-label">{item.label}</span>
                <strong className="banks-metric-value">{item.value}</strong>
                <p className="banks-metric-note">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="banks-mode-strip">
          {modes.map((item) => (
            <div key={item.title} className="banks-mode-card">
              <div className="banks-mode-icon">{item.icon}</div>
              <h2 className="banks-mode-title">{item.title}</h2>
              <p className="banks-mode-description">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="banks-section">
          <div className="banks-section-header">
            <span className="banks-section-eyebrow">ALL BANKS</span>
            <h2 className="banks-section-title">题库大全</h2>
            <p className="banks-section-description">
              按主题挑选更适合当前阶段的题库，从“会看”过渡到“会讲”，把每一次练习都变成可复用的经验积累。
            </p>
          </div>

          <div className="banks-grid-frame">
            <QuestionBankList
              questionBankList={questionBankList}
              descriptionRows={2}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
