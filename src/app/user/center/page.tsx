"use client";

import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Progress,
  Row,
  Spin,
  Statistic,
  Tag,
  Timeline,
  Typography,
  Upload,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import { useEffect, useMemo, useState } from "react";
import CalendarChart from "@/app/user/center/components/CalendarChart";
import {
  getInterviewDetailBySessionId,
  getInterviewSession,
} from "@/api/aiInterviewController";
import { uploadFile } from "@/api/fileController";
import { getLoginUser, updateMyUser } from "@/api/userController";
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FireOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  RiseOutlined,
  RobotOutlined,
  StarOutlined,
  TrophyOutlined,
  UploadOutlined,
  UserOutlined,
  UserOutlined as UserIcon,
  VideoCameraOutlined,
} from "@ant-design/icons";
import ACCESS_ENUM from "@/access/accessEnum";
import DEFAULT_USER from "@/constants/user";
import { setLoginUser } from "@/stores/loginUser";

const { Text } = Typography;
const { TextArea } = Input;

type TabKey = "record" | "interview" | "achievements" | "skills";

const ACHIEVEMENT_TARGET = 10;
const MASTER_TARGET = 100;

const tabs: {
  key: TabKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "record",
    label: "刷题记录",
    description: "用更清晰的节奏查看刷题活跃度与近期进展。",
    icon: <BookOutlined />,
  },
  {
    key: "interview",
    label: "面试记录",
    description: "快速浏览会话档案，并进入单场面试详情复盘。",
    icon: <VideoCameraOutlined />,
  },
  {
    key: "achievements",
    label: "个人成就",
    description: "把阶段性里程碑做成更有成就感的个人勋章墙。",
    icon: <TrophyOutlined />,
  },
  {
    key: "skills",
    label: "技能分析",
    description: "根据技能强弱分布，聚焦下一阶段的提升方向。",
    icon: <RiseOutlined />,
  },
];

const formatDateTime = (
  value?: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }
) => {
  if (!value) {
    return "暂无时间";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "暂无时间";
  }
  return date.toLocaleString("zh-CN", options);
};

const normalizeTextValue = (value?: string) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.trim();
};

export default function UserCenterPage() {
  const user = useSelector((state: RootState) => state.loginUser);
  const dispatch = useDispatch<AppDispatch>();
  const [profileForm] = Form.useForm<API.UserUpdateMyRequest>();

  const userStats = {
    solved: 78,
    totalQuestions: 150,
    streak: 6,
    ranking: 256,
    achievements: [
      {
        name: "初出茅庐",
        description: "完成第一题",
        icon: <StarOutlined />,
        tone: "violet",
      },
      {
        name: "坚持不懈",
        description: "连续刷题 7 天",
        icon: <FireOutlined />,
        tone: "amber",
      },
      {
        name: "思维灵活",
        description: "一次性通过困难题",
        icon: <TrophyOutlined />,
        tone: "mint",
      },
    ],
    recentActivities: [
      { title: "完成了「二叉树遍历」", time: "2 小时前" },
      { title: "解锁了「动态规划」成就", time: "昨天" },
      { title: "参加了每周编程挑战赛", time: "3 天前" },
    ],
    skills: [
      { name: "JavaScript", level: 85 },
      { name: "算法", level: 70 },
      { name: "数据结构", level: 75 },
      { name: "React", level: 80 },
    ],
  };

  const [activeTabKey, setActiveTabKey] = useState<TabKey>("record");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [interviewSessions, setInterviewSessions] = useState<API.AiSession[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [interviewDetails, setInterviewDetails] = useState<API.AiInterviewRecords[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const editingUserName = Form.useWatch("userName", profileForm);
  const editingUserAvatar = Form.useWatch("userAvatar", profileForm);
  const editingUserProfile = Form.useWatch("userProfile", profileForm);

  const completionRate = Math.round(
    (userStats.solved / userStats.totalQuestions) * 100
  );
  const achievementProgress = Math.round(
    (userStats.achievements.length / ACHIEVEMENT_TARGET) * 100
  );
  const remainingToMaster = Math.max(MASTER_TARGET - userStats.solved, 0);

  const sortedSkills = useMemo(
    () => [...userStats.skills].sort((left, right) => right.level - left.level),
    [userStats.skills]
  );
  const strongestSkill = sortedSkills[0];
  const focusSkill = sortedSkills[sortedSkills.length - 1];

  const sortedInterviewSessions = useMemo(() => {
    return [...interviewSessions].sort((left, right) => {
      const leftTime = left.createTime ? new Date(left.createTime).getTime() : 0;
      const rightTime = right.createTime ? new Date(right.createTime).getTime() : 0;
      return rightTime - leftTime;
    });
  }, [interviewSessions]);

  const latestSession = sortedInterviewSessions[0];
  const interviewSummary = useMemo(() => {
    const answeredCount = interviewDetails.filter(
      (item) => item.type === "ANSWER"
    ).length;
    const aiQuestionCount = interviewDetails.filter(
      (item) => item.type === "QUESTION"
    ).length;
    const scoredItems = interviewDetails.filter(
      (item) => typeof item.score === "number"
    );

    return {
      answeredCount,
      aiQuestionCount,
      averageScore:
        scoredItems.length > 0
          ? Math.round(
              scoredItems.reduce((sum, item) => sum + (item.score || 0), 0) /
                scoredItems.length
            )
          : 0,
    };
  }, [interviewDetails]);

  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];
  const roleLabel =
    user.userRole === ACCESS_ENUM.ADMIN ? "管理员身份" : "成长用户";
  const profilePreviewName =
    typeof editingUserName === "string"
      ? normalizeTextValue(editingUserName) || "未命名用户"
      : user.userName || "未命名用户";
  const profilePreviewAvatar =
    typeof editingUserAvatar === "string"
      ? normalizeTextValue(editingUserAvatar) || undefined
      : user.userAvatar || DEFAULT_USER.userAvatar;
  const profilePreviewBio =
    typeof editingUserProfile === "string"
      ? normalizeTextValue(editingUserProfile) ||
        "这段简介会展示在你的个人主页顶部，帮助别人更快认识你。"
      : user.userProfile ||
        "这段简介会展示在你的个人主页顶部，帮助别人更快认识你。";

  const heroMetrics = [
    {
      label: "题目完成率",
      value: `${completionRate}%`,
      note: `${userStats.solved} / ${userStats.totalQuestions} 已完成`,
      icon: <BookOutlined />,
    },
    {
      label: "连续打卡",
      value: `${userStats.streak} 天`,
      note: "保持你的学习节奏", 
      icon: <FireOutlined />,
    },
    {
      label: "当前排名",
      value: `#${userStats.ranking}`,
      note: "正在稳步提升中",
      icon: <RiseOutlined />,
    },
    {
      label: "面试档案",
      value: `${interviewSessions.length} 场`,
      note: latestSession
        ? `最近一次 ${formatDateTime(latestSession.createTime, {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "先开始第一场模拟面试吧",
      icon: <VideoCameraOutlined />,
    },
  ];

  const focusItems = [
    {
      label: "最强技能",
      value: strongestSkill?.name ?? "待解锁",
      detail: strongestSkill ? `${strongestSkill.level}% 掌握度` : "继续累积训练数据",
    },
    {
      label: "当前短板",
      value: focusSkill?.name ?? "待分析",
      detail: focusSkill ? `建议优先补强至 80%` : "完成更多题目后自动生成",
    },
  ];

  const fetchInterviewSessions = async () => {
    setLoadingInterviews(true);
    try {
      const response: any = await getInterviewSession();
      if (response.code === 20000 && response.data) {
        setInterviewSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch interview sessions:", error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const fetchInterviewDetails = async (sessionId: string) => {
    setLoadingDetails(true);
    try {
      const response: any = await getInterviewDetailBySessionId({ sessionId });
      if (response.code === 20000 && response.data) {
        setInterviewDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch interview details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setDetailModalVisible(true);
    fetchInterviewDetails(sessionId);
  };

  const handleOpenProfileEditor = () => {
    if (!user.id) {
      message.warning("请先登录后再编辑资料");
      return;
    }
    profileForm.setFieldsValue({
      userName: user.userName ?? "",
      userAvatar: user.userAvatar ?? "",
      userProfile: user.userProfile ?? "",
    });
    setProfileModalVisible(true);
  };

  const handleCloseProfileEditor = () => {
    setProfileModalVisible(false);
    profileForm.resetFields();
  };

  const beforeAvatarUpload = (file: File) => {
    const isSupportedImage =
      [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/svg+xml",
        "image/webp",
      ].includes(file.type) ||
      /\.(jpe?g|png|svg|webp)$/i.test(file.name);
    if (!isSupportedImage) {
      message.error("只支持 JPG、PNG、SVG、WEBP 格式的头像");
      return Upload.LIST_IGNORE;
    }

    const isWithinLimit = file.size / 1024 / 1024 <= 1;
    if (!isWithinLimit) {
      message.error("头像文件不能超过 1MB");
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleAvatarUpload = async ({ file, onSuccess, onError }: any) => {
    const formData = new FormData();
    formData.append("file", file as File);

    try {
      setUploadingAvatar(true);
      const response = await uploadFile({ biz: "avatar" }, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response?.data) {
        profileForm.setFieldValue("userAvatar", String(response.data));
        message.success("头像上传成功，记得保存资料");
        onSuccess?.("ok");
        return;
      }

      throw new Error("头像上传失败");
    } catch (error: any) {
      message.error(error?.message ?? "头像上传失败");
      onError?.(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResetAvatar = () => {
    profileForm.setFieldValue("userAvatar", DEFAULT_USER.userAvatar);
    message.success("已恢复为默认头像，保存后生效");
  };

  const refreshCurrentUser = async (fallbackValues?: API.UserUpdateMyRequest) => {
    try {
      const response = await getLoginUser();
      if (response.data) {
        dispatch(setLoginUser(response.data as API.LoginUserVO));
        return;
      }
    } catch (error) {
      console.error("Failed to refresh current user:", error);
    }

    if (fallbackValues) {
      dispatch(
        setLoginUser({
          ...user,
          ...fallbackValues,
        } as API.LoginUserVO)
      );
    }
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      const payload: API.UserUpdateMyRequest = {
        userName: normalizeTextValue(values.userName),
        userAvatar: normalizeTextValue(values.userAvatar),
        userProfile: normalizeTextValue(values.userProfile),
      };

      setSavingProfile(true);
      await updateMyUser(payload);
      await refreshCurrentUser(payload);
      message.success("个人资料已更新");
      handleCloseProfileEditor();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(`更新失败：${error?.message ?? "请稍后重试"}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCloseModal = () => {
    setDetailModalVisible(false);
    setCurrentSessionId("");
    setInterviewDetails([]);
  };

  useEffect(() => {
    fetchInterviewSessions();
  }, []);

  const renderRecordTab = () => {
    const overviewItems = [
      {
        label: "总完成数",
        value: `${userStats.solved} 题`,
        note: `目标 ${userStats.totalQuestions} 题`,
      },
      {
        label: "连续冲刺",
        value: `${userStats.streak} 天`,
        note: userStats.streak < 7 ? `再坚持 ${7 - userStats.streak} 天解锁新徽章` : "保持状态，继续向前",
      },
      {
        label: "下一目标",
        value: `${remainingToMaster} 题`,
        note: "距离“解题高手”更近一步",
      },
    ];

    return (
      <div className="dashboard-stack">
        <div className="overview-strip">
          {overviewItems.map((item) => (
            <div className="overview-strip__item" key={item.label}>
              <Text className="overview-strip__label">{item.label}</Text>
              <Text className="overview-strip__value">{item.value}</Text>
              <Text className="overview-strip__note">{item.note}</Text>
            </div>
          ))}
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Card bordered={false} className="dashboard-subcard dashboard-calendar-card">
              <div className="section-card-header">
                <div>
                  <Text className="section-card-eyebrow">Activity Heatmap</Text>
                  <Title level={4} className="section-card-title">
                    刷题日历
                  </Title>
                </div>
                <Text className="section-card-note">用颜色深浅感受你的训练密度</Text>
              </div>
              <div className="calendar-shell">
                <CalendarChart />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card bordered={false} className="dashboard-subcard dashboard-activity-card">
              <div className="section-card-header compact">
                <div>
                  <Text className="section-card-eyebrow">Recent Feed</Text>
                  <Title level={4} className="section-card-title">
                    最近动态
                  </Title>
                </div>
              </div>

              <List
                className="activity-list"
                itemLayout="horizontal"
                dataSource={userStats.recentActivities}
                renderItem={(item, index) => (
                  <List.Item>
                    <div className="activity-item">
                      <div className="activity-item__icon">
                        {index === 1 ? <TrophyOutlined /> : <BookOutlined />}
                      </div>
                      <div className="activity-item__content">
                        <Text className="activity-item__title">{item.title}</Text>
                        <Text className="activity-item__time">{item.time}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderInterviewTab = () => {
    const interviewOverview = [
      {
        label: "会话数量",
        value: `${interviewSessions.length} 场`,
        note: "所有 AI 模拟面试自动归档",
      },
      {
        label: "最近一次",
        value: latestSession
          ? formatDateTime(latestSession.createTime, {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "暂无记录",
        note: latestSession ? latestSession.name || "AI 模拟面试" : "开始后会自动同步",
      },
      {
        label: "复盘方式",
        value: "时间线",
        note: "点击单场会话即可查看对话详情",
      },
    ];

    return (
      <div className="dashboard-stack">
        <div className="overview-strip">
          {interviewOverview.map((item) => (
            <div className="overview-strip__item" key={item.label}>
              <Text className="overview-strip__label">{item.label}</Text>
              <Text className="overview-strip__value">{item.value}</Text>
              <Text className="overview-strip__note">{item.note}</Text>
            </div>
          ))}
        </div>

        {loadingInterviews ? (
          <Row gutter={[20, 20]}>
            {[1, 2, 3].map((item) => (
              <Col xs={24} md={12} key={item}>
                <Card bordered={false} className="interview-session-card" loading />
              </Col>
            ))}
          </Row>
        ) : sortedInterviewSessions.length === 0 ? (
          <div className="interview-empty-state">
            <VideoCameraOutlined className="interview-empty-state__icon" />
            <Title level={4}>还没有面试记录</Title>
            <Paragraph>
              开始第一场 AI 模拟面试后，这里会自动形成你的专属复盘档案。
            </Paragraph>
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {sortedInterviewSessions.map((session, index) => (
              <Col xs={24} md={12} key={session.sessionId || session.id || index}>
                <Card bordered={false} className="interview-session-card">
                  <div className="interview-session-card__badge">
                    <Text>Session {String(index + 1).padStart(2, "0")}</Text>
                  </div>

                  <div className="interview-session-card__header">
                    <div>
                      <Title level={4} className="interview-session-card__title">
                        {session.name || "AI 模拟面试"}
                      </Title>
                      <Text className="interview-session-card__subtitle">
                        会话 ID：{session.sessionId?.slice(-8) || "暂无编号"}
                      </Text>
                    </div>
                    <PlayCircleOutlined className="interview-session-card__play" />
                  </div>

                  <div className="session-chip-row">
                    <span className="session-chip">
                      <CalendarOutlined />
                      {formatDateTime(session.createTime, {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </span>
                    <span className="session-chip">
                      <ClockCircleOutlined />
                      已归档
                    </span>
                    <span className="session-chip session-chip--accent">
                      <MessageOutlined />
                      可复盘
                    </span>
                  </div>

                  <Paragraph className="interview-session-card__description">
                    回顾这场面试中的提问节奏、回答表现和得分分布，快速找到下一次提升方向。
                  </Paragraph>

                  <div className="interview-session-card__footer">
                    <Text className="interview-session-card__time">
                      {formatDateTime(session.createTime)}
                    </Text>
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      className="center-primary-button small"
                      onClick={() => handleViewDetails(session.sessionId || "")}
                    >
                      查看详情
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    );
  };

  const renderAchievementsTab = () => {
    return (
      <div className="dashboard-stack">
        <Card bordered={false} className="dashboard-subcard achievement-progress-card">
          <div className="section-card-header compact">
            <div>
              <Text className="section-card-eyebrow">Achievement Track</Text>
              <Title level={4} className="section-card-title">
                勋章解锁进度
              </Title>
            </div>
            <Text className="section-card-note">
              已解锁 {userStats.achievements.length} / {ACHIEVEMENT_TARGET}
            </Text>
          </div>
          <Progress
            percent={achievementProgress}
            strokeColor={{ "0%": "#7C3AED", "100%": "#A78BFA" }}
            trailColor="rgba(124, 58, 237, 0.08)"
            format={() => `${userStats.achievements.length} / ${ACHIEVEMENT_TARGET}`}
          />
          <div className="achievement-progress-card__footer">
            <Text>再完成 {remainingToMaster} 题，可冲刺“解题高手”目标。</Text>
          </div>
        </Card>

        <Row gutter={[20, 20]}>
          {userStats.achievements.map((achievement) => (
            <Col xs={24} md={12} xl={8} key={achievement.name}>
              <Card bordered={false} className={`achievement-card achievement-card--${achievement.tone}`}>
                <div className="achievement-card__icon">{achievement.icon}</div>
                <div>
                  <Title level={5} className="achievement-card__title">
                    {achievement.name}
                  </Title>
                  <Text className="achievement-card__description">
                    {achievement.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}

          <Col xs={24} md={12} xl={8}>
            <Card bordered={false} className="achievement-card achievement-card--locked">
              <div className="achievement-card__icon">
                <TrophyOutlined />
              </div>
              <div>
                <Title level={5} className="achievement-card__title">
                  解题高手
                </Title>
                <Text className="achievement-card__description">
                  解决 100 道题目后解锁，当前还差 {remainingToMaster} 题。
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderSkillsTab = () => {
    return (
      <div className="skill-layout">
        <Card bordered={false} className="dashboard-subcard skill-chart-card">
          <div className="section-card-header compact">
            <div>
              <Text className="section-card-eyebrow">Skill Matrix</Text>
              <Title level={4} className="section-card-title">
                技能掌握度
              </Title>
            </div>
          </div>

          <div className="skill-list">
            {sortedSkills.map((skill, index) => (
              <div className="skill-list__item" key={skill.name}>
                <div className="skill-list__header">
                  <div>
                    <Text className="skill-list__name">{skill.name}</Text>
                    <Text className="skill-list__rank">Top {index + 1}</Text>
                  </div>
                  <Text className="skill-list__level">{skill.level}%</Text>
                </div>
                <Progress
                  percent={skill.level}
                  strokeColor={
                    index === 0
                      ? { "0%": "#7C3AED", "100%": "#A78BFA" }
                      : index === sortedSkills.length - 1
                        ? { "0%": "#F59E0B", "100%": "#FB923C" }
                        : { "0%": "#6D28D9", "100%": "#8B5CF6" }
                  }
                  trailColor="rgba(124, 58, 237, 0.08)"
                  showInfo={false}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card bordered={false} className="dashboard-subcard suggestion-card">
          <div className="section-card-header compact">
            <div>
              <Text className="section-card-eyebrow">Focus Advice</Text>
              <Title level={4} className="section-card-title">
                学习建议
              </Title>
            </div>
          </div>

          <div className="suggestion-card__group">
            <div className="suggestion-card__item">
              <Text className="suggestion-card__label">优势项</Text>
              <Title level={5} className="suggestion-card__title">
                {strongestSkill?.name || "待识别"}
              </Title>
              <Paragraph>
                你在 {strongestSkill?.name || "当前强项"} 上已经形成明显优势，适合继续向更高难度题目扩展。
              </Paragraph>
            </div>

            <div className="suggestion-card__item suggestion-card__item--accent">
              <Text className="suggestion-card__label">优先提升</Text>
              <Title level={5} className="suggestion-card__title">
                {focusSkill?.name || "待分析"}
              </Title>
              <Paragraph>
                建议先补强 {focusSkill?.name || "当前短板"}，把掌握度提升到 80% 以上，整体能力会更均衡。
              </Paragraph>
            </div>
          </div>

          <div className="suggestion-card__footer">
            <Tag className="custom-tag">重点主题</Tag>
            <Text>
              用 2 周时间集中完成 {focusSkill?.name || "重点模块"} 相关训练题，再结合 1 场模拟面试做闭环复盘。
            </Text>
          </div>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTabKey) {
      case "record":
        return renderRecordTab();
      case "interview":
        return renderInterviewTab();
      case "achievements":
        return renderAchievementsTab();
      case "skills":
        return renderSkillsTab();
      default:
        return null;
    }
  };

  return (
    <div id="userCenterPage" className="max-width-content">
      <section className="center-hero">
        <div className="center-hero__glow center-hero__glow--left" />
        <div className="center-hero__glow center-hero__glow--right" />

        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={15}>
            <div className="hero-profile">
              <div className="hero-avatar-shell">
                <Avatar
                  src={user.userAvatar}
                  size={112}
                  icon={<UserOutlined />}
                  className="hero-avatar"
                />
                <span className="hero-avatar-status">
                  <CheckCircleFilled />
                </span>
              </div>

              <div className="hero-profile__content">
                <Text className="hero-eyebrow">Personal Growth Hub</Text>
                <div className="hero-title-row">
                  <Title level={1} className="hero-name">
                    {user.userName || "未命名用户"}
                  </Title>
                  <Tag className="hero-role-tag">{roleLabel}</Tag>
                </div>

                <Paragraph className="hero-bio">
                  {user.userProfile || "这里将展示你的职业标签、成长记录与阶段性成果。"}
                </Paragraph>

                <div className="hero-chip-row">
                  <span className="hero-chip">
                    <BookOutlined /> 完成率 {completionRate}%
                  </span>
                  <span className="hero-chip">
                    <FireOutlined /> 连续 {userStats.streak} 天训练
                  </span>
                  <span className="hero-chip">
                    <VideoCameraOutlined /> {interviewSessions.length} 场面试归档
                  </span>
                </div>

                <div className="hero-actions">
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    className="center-primary-button"
                    onClick={handleOpenProfileEditor}
                  >
                    编辑资料
                  </Button>
                  <Button className="center-secondary-button" icon={<RiseOutlined />}>
                    查看成长路径
                  </Button>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={9}>
            <div className="hero-metrics-grid">
              {heroMetrics.map((metric) => (
                <div className="hero-metric-card" key={metric.label}>
                  <div className="hero-metric-card__icon">{metric.icon}</div>
                  <Text className="hero-metric-card__label">{metric.label}</Text>
                  <Text className="hero-metric-card__value">{metric.value}</Text>
                  <Text className="hero-metric-card__note">{metric.note}</Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </section>

      <Row gutter={[24, 24]} className="center-main-grid">
        <Col xs={24} xl={8}>
          <div className="sidebar-stack">
            <Card bordered={false} className="side-card side-card--progress">
              <Text className="side-card__eyebrow">Progress Pulse</Text>
              <Title level={4} className="side-card__title">
                成长概览
              </Title>

              <div className="progress-ring-panel">
                <Progress
                  type="circle"
                  size={116}
                  percent={completionRate}
                  strokeColor={{ "0%": "#7C3AED", "100%": "#A78BFA" }}
                  trailColor="rgba(124, 58, 237, 0.08)"
                />

                <div className="progress-kpi-list">
                  <div className="progress-kpi-item">
                    <Text>已解题</Text>
                    <strong>{userStats.solved}</strong>
                  </div>
                  <div className="progress-kpi-item">
                    <Text>连续天数</Text>
                    <strong>{userStats.streak}</strong>
                  </div>
                  <div className="progress-kpi-item">
                    <Text>当前排名</Text>
                    <strong>#{userStats.ranking}</strong>
                  </div>
                </div>
              </div>
            </Card>

            <Card bordered={false} className="side-card">
              <Text className="side-card__eyebrow">Unlocked Badges</Text>
              <Title level={4} className="side-card__title">
                最近勋章
              </Title>

              <div className="achievement-mini-list">
                {userStats.achievements.map((achievement) => (
                  <div className="achievement-mini-item" key={achievement.name}>
                    <span className={`achievement-mini-item__icon achievement-mini-item__icon--${achievement.tone}`}>
                      {achievement.icon}
                    </span>
                    <div>
                      <Text className="achievement-mini-item__title">{achievement.name}</Text>
                      <Text className="achievement-mini-item__desc">{achievement.description}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card bordered={false} className="side-card side-card--focus">
              <Text className="side-card__eyebrow">Focus Board</Text>
              <Title level={4} className="side-card__title">
                学习焦点
              </Title>

              <div className="focus-list">
                {focusItems.map((item) => (
                  <div className="focus-list__item" key={item.label}>
                    <Text className="focus-list__label">{item.label}</Text>
                    <Text className="focus-list__value">{item.value}</Text>
                    <Text className="focus-list__detail">{item.detail}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Col>

        <Col xs={24} xl={16}>
          <Card bordered={false} className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <Text className="dashboard-card__eyebrow">Dashboard View</Text>
                <Title level={3} className="dashboard-card__title">
                  {activeTab.label}
                </Title>
                <Paragraph className="dashboard-card__description">
                  {activeTab.description}
                </Paragraph>
              </div>

              <div className="tab-switcher">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    className={`tab-switcher__button ${
                      activeTabKey === tab.key ? "is-active" : ""
                    }`}
                    onClick={() => setActiveTabKey(tab.key)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dashboard-card__body">{renderTabContent()}</div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div className="profile-edit-title">
            <span className="profile-edit-title__icon">
              <EditOutlined />
            </span>
            <div>
              <div className="profile-edit-title__row">
                <span>编辑个人资料</span>
              </div>
              <Text className="profile-edit-title__desc">
                修改头像、昵称和简介，保存后会同步更新到当前账号。
              </Text>
            </div>
          </div>
        }
        open={profileModalVisible}
        onCancel={handleCloseProfileEditor}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseProfileEditor}
            className="profile-edit-cancel"
          >
            暂不修改
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={savingProfile}
            onClick={handleSaveProfile}
            className="profile-edit-submit"
          >
            保存资料
          </Button>,
        ]}
        width={860}
        centered
        className="profile-edit-modal"
      >
        <div className="profile-edit-layout">
          <section className="profile-edit-preview">
            <Text className="profile-edit-preview__eyebrow">实时预览</Text>
            <div className="profile-edit-preview__hero">
              <Avatar
                src={profilePreviewAvatar}
                size={84}
                icon={<UserOutlined />}
                className="profile-edit-preview__avatar"
              />
              <div className="profile-edit-preview__identity">
                <Title level={3} className="profile-edit-preview__name">
                  {profilePreviewName}
                </Title>
                <Tag className="profile-edit-preview__tag">{roleLabel}</Tag>
              </div>
            </div>

            <Paragraph className="profile-edit-preview__bio">
              {profilePreviewBio}
            </Paragraph>

            <div className="profile-edit-preview__tips">
              <span className="profile-edit-preview__tip">保存后会同步更新导航头像和个人中心</span>
              <span className="profile-edit-preview__tip">更换头像后，仍需要点击“保存资料”才会生效</span>
            </div>
          </section>

          <section className="profile-edit-panel">
            <div className="profile-edit-panel__heading">
              <Text className="profile-edit-panel__eyebrow">基本信息</Text>
              <Text className="profile-edit-panel__desc">
                尽量保持信息简洁清晰，方便在站内展示你的个人形象。
              </Text>
            </div>

            <Form
              form={profileForm}
              layout="vertical"
              requiredMark={false}
              className="profile-edit-form"
            >
              <Form.Item
                label="昵称"
                name="userName"
                rules={[
                  { required: true, message: "请输入昵称" },
                  { max: 256, message: "昵称长度不能超过 256 个字符" },
                ]}
              >
                <Input
                  size="large"
                  maxLength={256}
                  showCount
                  placeholder="例如：前端求职冲刺中"
                />
              </Form.Item>

              <Form.Item
                label="头像"
                extra="支持 JPG、PNG、SVG、WEBP，单个文件不超过 1MB。"
              >
                <div className="profile-avatar-upload-card">
                  <div className="profile-avatar-upload-card__header">
                    <Text className="profile-avatar-upload-card__title">
                      直接上传本地头像文件
                    </Text>
                    <Text className="profile-avatar-upload-card__desc">
                      上传完成后，左侧预览会立即更新。
                    </Text>
                  </div>

                  <div className="profile-avatar-upload-card__actions">
                    <Upload
                      accept=".jpg,.jpeg,.png,.svg,.webp"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={beforeAvatarUpload}
                      customRequest={handleAvatarUpload}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploadingAvatar}
                        className="profile-avatar-upload-button"
                      >
                        {uploadingAvatar ? "头像上传中..." : "上传头像"}
                      </Button>
                    </Upload>

                    <Button
                      onClick={handleResetAvatar}
                      className="profile-avatar-reset-button"
                    >
                      使用默认头像
                    </Button>
                  </div>
                </div>
              </Form.Item>

              <Form.Item
                name="userAvatar"
                hidden
                rules={[{ max: 1024, message: "头像地址长度不能超过 1024 个字符" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="个人简介"
                name="userProfile"
                rules={[{ max: 512, message: "个人简介不能超过 512 个字符" }]}
              >
                <TextArea
                  rows={6}
                  maxLength={512}
                  showCount
                  placeholder="写下你的岗位方向、擅长领域，或者最近正在冲刺的目标。"
                />
              </Form.Item>
            </Form>
          </section>
        </div>
      </Modal>

      <Modal
        title={
          <div className="detail-modal-title">
            <span className="detail-modal-title__icon">
              <VideoCameraOutlined />
            </span>
            <div>
              <Text className="detail-modal-title__eyebrow">Interview Replay</Text>
              <div className="detail-modal-title__row">
                <span>面试会话详情</span>
                <Tag className="detail-modal-title__tag">
                  ID: {currentSessionId.slice(-8) || "--"}
                </Tag>
              </div>
            </div>
          </div>
        }
        open={detailModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal} className="detail-modal-close">
            关闭
          </Button>,
        ]}
        width={920}
        centered
        className="interview-detail-modal"
      >
        <div className="interview-detail-content">
          {loadingDetails ? (
            <div className="interview-detail-loading">
              <Spin size="large" />
              <Text className="interview-detail-loading__text">正在加载面试详情...</Text>
            </div>
          ) : interviewDetails.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无面试记录"
            />
          ) : (
            <div>
              <div className="interview-detail-summary">
                <div className="detail-stat-card">
                  <Statistic
                    title="对话轮次"
                    value={interviewDetails.length}
                    prefix={<MessageOutlined />}
                    valueStyle={{ color: "#7C3AED", fontSize: 22 }}
                  />
                </div>
                <div className="detail-stat-card">
                  <Statistic
                    title="用户回答"
                    value={interviewSummary.answeredCount}
                    prefix={<UserIcon />}
                    valueStyle={{ color: "#6D28D9", fontSize: 22 }}
                  />
                </div>
                <div className="detail-stat-card">
                  <Statistic
                    title="AI 提问"
                    value={interviewSummary.aiQuestionCount}
                    prefix={<RobotOutlined />}
                    valueStyle={{ color: "#10B981", fontSize: 22 }}
                  />
                </div>
                <div className="detail-stat-card">
                  <Statistic
                    title="平均得分"
                    value={interviewSummary.averageScore}
                    suffix="/100"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: "#F59E0B", fontSize: 22 }}
                  />
                </div>
              </div>

              <Timeline
                className="interview-timeline"
                items={interviewDetails.map((record, index) => {
                  const isUser = record.type === "ANSWER";
                  const isAI = record.type === "QUESTION";
                  const dotStyle = isUser
                    ? {
                        backgroundColor: "#7C3AED",
                        boxShadow: "0 10px 24px rgba(124, 58, 237, 0.24)",
                      }
                    : isAI
                      ? {
                          backgroundColor: "#10B981",
                          boxShadow: "0 10px 24px rgba(16, 185, 129, 0.22)",
                        }
                      : {
                          backgroundColor: "#F59E0B",
                          boxShadow: "0 10px 24px rgba(245, 158, 11, 0.22)",
                        };

                  return {
                    key: record.id || index,
                    dot: (
                      <Avatar
                        size="default"
                        icon={
                          isUser ? <UserIcon /> : isAI ? <RobotOutlined /> : <MessageOutlined />
                        }
                        style={{
                          ...dotStyle,
                          border: "2px solid rgba(255,255,255,0.95)",
                        }}
                      />
                    ),
                    children: (
                      <div className="timeline-item" data-type={record.type || "OTHER"}>
                        <div className="timeline-header">
                          <div>
                            <Text className="timeline-header__title">
                              {isUser
                                ? "用户回答"
                                : isAI
                                  ? "AI 面试官"
                                  : "系统消息"}
                            </Text>
                            <Text className="timeline-header__round">第 {index + 1} 轮</Text>
                          </div>

                          <div className="timeline-header__meta">
                            {typeof record.score === "number" && (
                              <Tag
                                color={
                                  record.score >= 80
                                    ? "success"
                                    : record.score >= 60
                                      ? "warning"
                                      : "error"
                                }
                              >
                                <TrophyOutlined /> {record.score} 分
                              </Tag>
                            )}

                            <Text className="timeline-header__time">
                              {formatDateTime(record.createTime, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </div>
                        </div>

                        <div className="timeline-content">
                          <Paragraph
                            ellipsis={{ rows: 4, expandable: true, symbol: "展开更多" }}
                          >
                            {record.content || "暂无内容"}
                          </Paragraph>
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
