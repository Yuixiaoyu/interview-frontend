import {
  FireOutlined,
  RadarChartOutlined,
  ReadOutlined,
  SearchOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import "./index.css";
import { listQuestionVoByPage, searchQuestionVoByPage } from "@/api/questionController";
import QuestionTable from "@/components/QuestionTable";

interface QuestionsPageProps {
  searchParams?: {
    q?: string | string[];
  };
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("zh-CN").format(value);
};

/**
 * 题目列表页
 */
export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const searchText = Array.isArray(searchParams?.q)
    ? searchParams?.q[0] ?? ""
    : searchParams?.q ?? "";

  let questionList: API.QuestionVO[] = [];
  let total = 0;
  let errorText = "";

  try {
    const res = searchText
      ? await searchQuestionVoByPage({
          searchText,
          pageSize: 16,
          sortField: "_score",
          sortOrder: "descend",
        })
      : await listQuestionVoByPage({
          pageSize: 16,
          sortField: "createTime",
          sortOrder: "descend",
        });

    questionList = res.data.records ?? [];
    total = res.data.total ?? 0;
  } catch (error) {
    errorText = error instanceof Error ? error.message : "请稍后再试";
  }

  const uniqueTags = Array.from(
    new Set(questionList.flatMap((question) => question.tagList ?? []).filter(Boolean)),
  );
  const featuredTags = uniqueTags.slice(0, 6);
  const spotlightQuestion = questionList[0];

  const stats = [
    {
      icon: <ReadOutlined />,
      label: "题库总量",
      value: formatNumber(total),
      hint: "覆盖高频面试真题与专项练习",
    },
    {
      icon: <SearchOutlined />,
      label: searchText ? "命中结果" : "当前展示",
      value: formatNumber(questionList.length),
      hint: searchText ? "围绕关键词进行精准检索" : "默认按最新题目排序浏览",
    },
    {
      icon: <TagsOutlined />,
      label: "高频标签",
      value: formatNumber(uniqueTags.length),
      hint: featuredTags.length > 0 ? featuredTags.slice(0, 3).join(" · ") : "算法 · Java · 前端",
    },
  ];

  const highlights = [
    {
      icon: <ThunderboltOutlined />,
      title: "快速定位",
      description: "关键词检索、分页浏览一步完成，练题路径更顺滑。",
    },
    {
      icon: <RadarChartOutlined />,
      title: "结构化筛选",
      description: "按标签聚合题目方向，方便切换不同面试专题。",
    },
    {
      icon: <FireOutlined />,
      title: "高频优先",
      description: "最新题目优先展示，帮助你更快捕捉近期热门考点。",
    },
  ];

  return (
    <div id="questionsPage">
      <div className="questions-aurora questions-aurora-left" />
      <div className="questions-aurora questions-aurora-right" />
      <div className="questions-grid" />

      <div className="questions-shell">
        <section className="questions-hero-panel">
          <div className="questions-hero-copy">
            <span className="questions-kicker">
              <FireOutlined />
              智能题库 · Modern Explorer
            </span>
            <h1 className="questions-title">题目大全</h1>
            <p className="questions-description">
              将高频面试题、专项标签与关键词检索整合进一个清晰、克制又有质感的探索界面，帮助你更快找到值得练习的题目。
            </p>

            <div className="questions-status-row">
              <span className="questions-status-pill">
                <span className="questions-status-dot" />
                支持关键词与标签联动检索
              </span>
              <span className="questions-query-pill">
                {searchText ? `当前关键词：${searchText}` : "当前模式：浏览全部题目"}
              </span>
            </div>

            <div className="questions-tag-strip">
              {featuredTags.length > 0 ? (
                featuredTags.map((tag) => (
                  <span key={tag} className="questions-tag-chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="questions-tag-chip questions-tag-chip-muted">算法</span>
              )}
            </div>
          </div>

          <aside className="questions-hero-aside">
            <div className="questions-spotlight-card">
              <div className="questions-spotlight-label">精选聚焦</div>
              {spotlightQuestion ? (
                <>
                  <h2 className="questions-spotlight-title">{spotlightQuestion.title}</h2>
                  <p className="questions-spotlight-text">
                    从当前题集中优先挑出一题开始练习，降低选择成本，快速进入面试状态。
                  </p>
                  <div className="questions-spotlight-tags">
                    {(spotlightQuestion.tagList ?? []).slice(0, 4).map((tag) => (
                      <span key={tag} className="questions-spotlight-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link href={`/question/${spotlightQuestion.id}`} className="questions-spotlight-link">
                    查看这道题
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="questions-spotlight-title">题库正在刷新中</h2>
                  <p className="questions-spotlight-text">
                    当前暂无可展示题目，你仍然可以通过下方筛选区域继续检索，或者稍后重新刷新页面。
                  </p>
                </>
              )}
            </div>
          </aside>
        </section>

        <section className="questions-stats-grid" aria-label="题库概览">
          {stats.map((stat) => (
            <article key={stat.label} className="questions-stat-card">
              <div className="questions-stat-icon">{stat.icon}</div>
              <div className="questions-stat-content">
                <span className="questions-stat-label">{stat.label}</span>
                <strong className="questions-stat-value">{stat.value}</strong>
                <span className="questions-stat-hint">{stat.hint}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="questions-content-panel">
          <div className="questions-section-heading">
            <div>
              <span className="questions-section-badge">
                <SearchOutlined />
                结构化检索
              </span>
              <h2 className="questions-section-title">在统一视图里完成筛选、浏览与跳转</h2>
              <p className="questions-section-description">
                保留高效的数据表格能力，同时强化视觉层次与主题色表达，让题库页面既易用，也更有品质感。
              </p>
            </div>
            <div className="questions-highlight-list">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="questions-highlight-item">
                  <div className="questions-highlight-icon">{highlight.icon}</div>
                  <div>
                    <div className="questions-highlight-title">{highlight.title}</div>
                    <div className="questions-highlight-description">{highlight.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorText ? (
            <div className="questions-error-banner">题目列表加载失败：{errorText}</div>
          ) : null}

          <div className="questions-table-shell">
            <QuestionTable
              defaultQuestionList={questionList}
              defaultTotal={total}
              defaultSearchParams={{
                searchText,
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
