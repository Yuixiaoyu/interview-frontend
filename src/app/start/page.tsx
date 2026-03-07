/**
 * 主页/起始页面
 * 目的: 展示用户学习统计、推荐题库和最新题目，提供学习入口
 * 实现: 服务器端组件，在构建时获取题库和题目数据并渲染
 */
import "./index.css";
import Link from "next/link";
import {
  AimOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleOutlined,
  FireOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { listQuestionBankVoByPage } from "@/api/questionBankController";
import { listQuestionVoByPage } from "@/api/questionController";
import QuestionBankList from "@/components/QuestionBankList";
import QuestionList from "@/components/QuestionList";

/**
 * 主页
 * @returns StartPage
 */
export default async function StartPage() {
  let questionBankList: API.QuestionBankVO[] = [];
  let questionList: API.QuestionVO[] = [];

  try {
    const res = await listQuestionBankVoByPage({
      pageSize: 16,
      sortField: "createTime",
      sortOrder: "descend",
    });
    questionBankList = res.data.records ?? [];
  } catch (e: any) {
    console.error("获取题库列表失败:", e.message);
  }

  try {
    const res = await listQuestionVoByPage({
      pageSize: 10,
      sortField: "createTime",
      sortOrder: "descend",
    });
    questionList = res.data.records ?? [];
  } catch (e: any) {
    console.error("获取题目列表失败:", e.message);
  }

  const userStats = {
    streak: 7,
    completedToday: 8,
    totalCompleted: 125,
  };

  const dailyTarget = 12;
  const paceProgress = Math.min(
    100,
    Math.round((userStats.completedToday / dailyTarget) * 100),
  );

  const heroStats = [
    {
      icon: <FireOutlined />,
      label: "连续学习",
      value: `${userStats.streak} 天`,
      note: "学习惯性已经建立",
    },
    {
      icon: <CheckCircleOutlined />,
      label: "今日完成",
      value: `${userStats.completedToday} 题`,
      note: "继续保持输出手感",
    },
    {
      icon: <RocketOutlined />,
      label: "累计沉淀",
      value: `${userStats.totalCompleted} 题`,
      note: "每一道题都在积累胜率",
    },
  ];

  const focusCards = [
    {
      icon: <AimOutlined />,
      title: "模拟面试",
      description: "切到高压对话模式，用真实节奏训练临场表达与结构化回答。",
      tag: "高沉浸",
      href: "/interview",
    },
    {
      icon: <BookOutlined />,
      title: "题库冲刺",
      description: "从精选题库快速进入状态，先把高频知识点和答题套路打稳。",
      tag: "结构化",
      href: "/banks",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "新题速递",
      description: "关注最近新增的问题，避免准备内容滞后，始终保持题感新鲜。",
      tag: "快节奏",
      href: "/questions",
    },
  ];

  const learningSignals = [
    {
      label: "推荐题库",
      value: String(questionBankList.length).padStart(2, "0"),
      note: "本次为你精选",
    },
    {
      label: "最新题目",
      value: String(questionList.length).padStart(2, "0"),
      note: "保持内容新鲜度",
    },
    {
      label: "下一步",
      value: "AI",
      note: "建议进入模拟面试",
    },
  ];

  return (
    <div id="startPage">
      <div className="start-shell max-width-content">
        <section className="start-hero">
          <div className="hero-copy">
            <span className="hero-badge">LEARNING CONTROL ROOM</span>
            <h1 className="hero-title">
              <span className="hero-title-line">把刷题这件事，</span>
              <span className="hero-title-line">做得更有节奏感。</span>
            </h1>
            <p className="hero-description">
              从推荐题库进入状态，用最新题目保持敏锐，再用 AI
              模拟面试检验表达。今天继续把你的面试战斗力往前推一格。
            </p>

            <div className="hero-stat-grid">
              {heroStats.map((item) => (
                <div key={item.label} className="hero-stat-card">
                  <div className="hero-stat-icon">{item.icon}</div>
                  <span className="hero-stat-label">{item.label}</span>
                  <strong className="hero-stat-value">{item.value}</strong>
                  <p className="hero-stat-note">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="hero-actions">
              <Link
                href="/interview"
                className="hero-button hero-button-primary"
              >
                开始模拟面试
                <ArrowRightOutlined />
              </Link>
              <Link
                href="/questions"
                className="hero-button hero-button-secondary"
              >
                继续刷题
                <ArrowRightOutlined />
              </Link>
            </div>
          </div>

          <aside className="hero-panel">
            <div className="hero-panel-top">
              <div>
                <span className="panel-kicker">TODAY&apos;S PACE</span>
                <h2 className="panel-title">学习引擎已启动</h2>
              </div>
              <span className="panel-status">稳定推进</span>
            </div>

            <p className="hero-panel-description">
              先从推荐题库快速热身，再切换到最新题目查漏补缺，最后用模拟面试验证表达与思路组织。
            </p>

            <div className="hero-progress">
              <div className="hero-progress-meta">
                <span>今日目标</span>
                <strong>{paceProgress}%</strong>
              </div>
              <div className="hero-progress-track">
                <span style={{ width: `${paceProgress}%` }} />
              </div>
              <p>
                已完成 {userStats.completedToday}/{dailyTarget}{" "}
                题，节奏不错，继续保持。
              </p>
            </div>

            <div className="hero-signal-grid">
              {learningSignals.map((item) => (
                <div key={item.label} className="hero-signal-card">
                  <span className="hero-signal-label">{item.label}</span>
                  <strong className="hero-signal-value">{item.value}</strong>
                  <p className="hero-signal-note">{item.note}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="focus-strip">
          {focusCards.map((card) => (
            <Link key={card.title} href={card.href} className="focus-card">
              <div className="focus-card-icon">{card.icon}</div>
              <span className="focus-card-tag">{card.tag}</span>
              <h2 className="focus-card-title">{card.title}</h2>
              <p className="focus-card-description">{card.description}</p>
              <span className="focus-card-link">
                立即进入
                <ArrowRightOutlined />
              </span>
            </Link>
          ))}
        </section>

        <section className="start-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">CURATED BANKS</span>
              <h2 className="section-title">推荐题库</h2>
              <p className="section-description">
                按实战密度筛过一遍的题库，适合今天先把状态拉起来，再逐步补齐短板。
              </p>
            </div>
            <Link href="/banks" className="section-link">
              浏览全部题库
              <ArrowRightOutlined />
            </Link>
          </div>

          <div className="section-frame">
            <QuestionBankList questionBankList={questionBankList} />
          </div>
        </section>

        <section className="start-section start-section-alt">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">LATEST QUESTIONS</span>
              <h2 className="section-title">最新题目</h2>
              <p className="section-description">
                跟住最近新增的问题，把知识更新和表达输出一起练到位。
              </p>
            </div>
            <Link href="/questions" className="section-link">
              查看全部题目
              <ArrowRightOutlined />
            </Link>
          </div>

          <div className="section-frame">
            <QuestionList questionList={questionList} />
          </div>
        </section>
      </div>
    </div>
  );
}
