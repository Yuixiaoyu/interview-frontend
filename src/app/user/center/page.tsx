"use client";
import "./index.css";
import Title from "antd/es/typography/Title";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  List,
  Progress,
  Row,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  Modal,
  Spin,
  Timeline,
  Empty
} from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import Paragraph from "antd/es/typography/Paragraph";
import { useState, useEffect } from "react";
import CalendarChart from "@/app/user/center/components/CalendarChart";
import { getInterviewSession, getInterviewDetailBySessionId } from "@/api/aiInterviewController";
import {
  BookOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FireOutlined,
  RiseOutlined,
  StarOutlined,
  TrophyOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  MessageOutlined,
  RobotOutlined,
  UserOutlined as UserIcon
} from "@ant-design/icons";
import ACCESS_ENUM from "@/access/accessEnum";

const { Text } = Typography;

interface UserCenterPageProps {
  searchParams?: Record<string, string>;
}

/**
 * 用户中心页
 * @returns
 */
export default function UserCenterPage({ searchParams }: UserCenterPageProps) {
  /**
   * 获取登陆用户信息
   */
  const loginUser = useSelector((state: RootState) => state.loginUser);

  const user = loginUser;

  // 模拟用户统计数据
  const userStats = {
    solved: 78,
    totalQuestions: 150,
    streak: 6,
    ranking: 256,
    achievements: [
      { name: "初出茅庐", description: "完成第一题", icon: <StarOutlined /> },
      { name: "坚持不懈", description: "连续刷题7天", icon: <FireOutlined /> },
      { name: "思维灵活", description: "一次性通过困难题", icon: <TrophyOutlined /> },
    ],
    recentActivities: [
      { title: "完成了「二叉树遍历」", time: "2小时前" },
      { title: "解锁了「动态规划」成就", time: "昨天" },
      { title: "参加了每周编程挑战赛", time: "3天前" },
    ],
    skills: [
      { name: "JavaScript", level: 85 },
      { name: "算法", level: 70 },
      { name: "数据结构", level: 75 },
      { name: "React", level: 80 },
    ]
  };

  // 控制菜单栏的tab高亮
  const [activeTabKey, setActiveTabKey] = useState<string>("record");
  
  // 面试会话数据状态
  const [interviewSessions, setInterviewSessions] = useState<API.AiSession[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  
  // 面试详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [interviewDetails, setInterviewDetails] = useState<API.AiInterviewRecords[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // 获取面试会话列表
  const fetchInterviewSessions = async () => {
    setLoadingInterviews(true);
    try {
      const response: any = await getInterviewSession();
      console.log(response.data)
      if (response.code === 20000 && response.data) {
        setInterviewSessions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch interview sessions:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };
  
  // 获取面试详情
  const fetchInterviewDetails = async (sessionId: string) => {
    setLoadingDetails(true);
    try {
      const response: any = await getInterviewDetailBySessionId({ sessionId });
      console.log('面试详情:', response.data);
      if (response.code === 20000 && response.data) {
        setInterviewDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch interview details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // 处理查看详情点击事件
  const handleViewDetails = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setDetailModalVisible(true);
    fetchInterviewDetails(sessionId);
  };
  
  // 关闭详情模态框
  const handleCloseModal = () => {
    setDetailModalVisible(false);
    setCurrentSessionId('');
    setInterviewDetails([]);
  };
  
  // 页面加载时获取面试会话数据
  useEffect(() => {
    fetchInterviewSessions();
  }, []);

  return (
    <div id="userCenterPage" className="max-width-content">
      <Row gutter={[24, 24]}>
        {/* 用户基本信息卡片 */}
        <Col xs={24} md={8}>
          <Card 
            className="user-profile-card"
            cover={
              <div className="profile-header">
                <div className="profile-avatar">
                  <Badge 
                    count={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
                    offset={[-8, 8]}
                  >
                    <Avatar 
                      src={user.userAvatar} 
                      size={100} 
                      icon={<UserOutlined />}
                      style={{
                        border: '4px solid #fff',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Badge>
                </div>
              </div>
            }
            actions={[
              <Tooltip title="编辑资料" key="edit">
                <Button type="text" icon={<EditOutlined />}>编辑资料</Button>
              </Tooltip>,
            ]}
          >
            <Card.Meta
              title={
                <Title level={3} className="user-name">
                  {user.userName}
                  <Tag color="blue" className="user-role-tag">
                    {user.userRole === ACCESS_ENUM.ADMIN ? '管理员' : '用户'}
                  </Tag>
                </Title>
              }
              description={
                <div className="user-info">
                  <Paragraph type="secondary" className="user-bio">
                    {user.userProfile || "这个用户很懒，还没有填写个人简介..."}
                  </Paragraph>
                  <Divider />
                  <Row gutter={[16, 16]} className="user-stats">
                    <Col span={8}>
                      <Statistic 
                        title="已解题" 
                        value={userStats.solved} 
                        suffix={`/${userStats.totalQuestions}`}
                        valueStyle={{ fontSize: '18px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="连续天数" 
                        value={userStats.streak}
                        valueStyle={{ fontSize: '18px' }}
                        prefix={<FireOutlined style={{ color: '#ff7875' }} />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="排名" 
                        value={userStats.ranking}
                        valueStyle={{ fontSize: '18px' }}
                        prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                      />
                    </Col>
                  </Row>
                </div>
              }
            />
          </Card>
        </Col>

        {/* 主要内容区域 */}
        <Col xs={24} md={16}>
          <Card
            className="content-card"
            tabList={[
              {
                key: "record",
                label: "刷题记录",
                icon: <BookOutlined />,
              },
              {
                key: "interview",
                label: "面试记录",
                icon: <VideoCameraOutlined />,
              },
              {
                key: "achievements",
                label: "个人成就",
                icon: <TrophyOutlined />,
              },
              {
                key: "skills",
                label: "技能分析",
                icon: <RiseOutlined />,
              },
            ]}
            activeTabKey={activeTabKey}
            onTabChange={(key) => setActiveTabKey(key)}
          >
            {/* 刷题记录 */}
            {activeTabKey === "record" && (
              <div className="tab-content">
                <Title level={4}>刷题日历</Title>
                <div className="calendar-container">
                  <CalendarChart />
                </div>
                <Divider />
                <Title level={4}>最近活动</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={userStats.recentActivities}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<BookOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                        title={item.title}
                        description={item.time}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 面试记录 */}
            {activeTabKey === "interview" && (
              <div className="tab-content">
                <div className="interview-header">
                  <Title level={4}>
                    <VideoCameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    面试会话记录
                  </Title>
                  <Text type="secondary">
                    共 {interviewSessions.length} 次面试记录
                  </Text>
                </div>
                
                {loadingInterviews ? (
                  <div className="interview-loading">
                    <Row gutter={[16, 16]}>
                      {[1, 2, 3].map(i => (
                        <Col xs={24} sm={12} lg={8} key={i}>
                          <Card loading={true} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : interviewSessions.length === 0 ? (
                  <div className="interview-empty">
                    <div style={{ 
                      background: 'linear-gradient(135deg, #e6f7ff, #f6ffed)',
                      borderRadius: '50%',
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 24
                    }}>
                      <VideoCameraOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                    </div>
                    <Title level={4} type="secondary" style={{ marginBottom: 8 }}>
                      还没有面试记录
                    </Title>
                    <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, display: 'block' }}>
                      开始您的第一次AI面试，获得专业的技能评估
                    </Text>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<PlayCircleOutlined />}
                        style={{
                          borderRadius: '8px',
                          height: '48px',
                          paddingLeft: '24px',
                          paddingRight: '24px',
                          fontSize: '16px',
                          fontWeight: 500
                        }}
                        onClick={() => {
                          // 这里可以添加开始面试的逻辑
                          console.log('开始新面试');
                        }}
                      >
                        开始面试
                      </Button>
                      <Button 
                        size="large"
                        icon={<BookOutlined />}
                        style={{
                          borderRadius: '8px',
                          height: '48px',
                          paddingLeft: '24px',
                          paddingRight: '24px',
                          fontSize: '16px'
                        }}
                      >
                        了解更多
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Row gutter={[16, 16]}>
                    {interviewSessions.map((session, index) => (
                      <Col xs={24} sm={12} lg={8} key={session.id || index}>
                        <Card
                          className="interview-card"
                          hoverable
                          cover={
                            <div className="interview-card-cover">
                              <div className="interview-card-overlay">
                                <PlayCircleOutlined className="play-icon" />
                              </div>
                              <div className="interview-card-status">
                                <CheckCircleFilled />
                                <span>已完成</span>
                              </div>
                            </div>
                          }
                          actions={[
                            <Tooltip title="查看详情" key="view">
                              <Button 
                                type="text" 
                                icon={<EyeOutlined />}
                                onClick={() => handleViewDetails(session.sessionId || '')}
                                style={{ color: '#1890ff', fontWeight: 500 }}
                              >
                                查看详情
                              </Button>
                            </Tooltip>
                          ]}
                        >
                          <Card.Meta
                            title={
                              <div className="interview-card-title">
                                <Text strong ellipsis={{ tooltip: true }} style={{ fontSize: '16px' }}>
                                  {session.name || `面试会话 #${session.id}`}
                                </Text>
                              </div>
                            }
                            description={
                              <div className="interview-card-description">
                                <div className="interview-card-info">
                                  <div className="info-item">
                                    <CalendarOutlined style={{ color: '#1890ff' }} />
                                    <span>
                                      {session.createTime 
                                        ? new Date(session.createTime).toLocaleDateString('zh-CN') 
                                        : '未知日期'
                                      }
                                    </span>
                                  </div>
                                  <div className="info-item">
                                    <ClockCircleOutlined style={{ color: '#52c41a' }} />
                                    <span>
                                      {session.createTime 
                                        ? new Date(session.createTime).toLocaleTimeString('zh-CN', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          }) 
                                        : '未知时间'
                                      }
                                    </span>
                                  </div>
                                  <div className="info-item">
                                    <MessageOutlined style={{ color: '#722ed1' }} />
                                    <span>预计 5-8 题</span>
                                  </div>
                                </div>
                                <div className="interview-card-id">
                                  <div className="interview-stats">
                                    <div className="stat-item">
                                      <TrophyOutlined style={{ color: '#faad14' }} />
                                      <span>优秀</span>
                                    </div>
                                    <div className="stat-item">
                                      <FireOutlined style={{ color: '#ff4d4f' }} />
                                      <span>25分钟</span>
                                    </div>
                                  </div>
                                  <Tag color="processing" size="small">
                                    {session.sessionId?.slice(-8) || '无ID'}
                                  </Tag>
                                </div>
                              </div>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            )}

            {/* 成就系统 */}
            {activeTabKey === "achievements" && (
              <div className="tab-content">
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <Progress 
                      percent={30} 
                      strokeColor={{ 
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }} 
                      format={() => '解锁成就 3/10'}
                    />
                  </Col>
                  {userStats.achievements.map((achievement, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                      <Card className="achievement-card">
                        <div className="achievement-icon">{achievement.icon}</div>
                        <div className="achievement-content">
                          <Title level={5}>{achievement.name}</Title>
                          <Text type="secondary">{achievement.description}</Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                  <Col xs={24} sm={12} md={8}>
                    <Card className="achievement-card locked">
                      <div className="achievement-icon locked"><TrophyOutlined /></div>
                      <div className="achievement-content">
                        <Title level={5}>解题高手</Title>
                        <Text type="secondary">解决100道题目</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* 技能分析 */}
            {activeTabKey === "skills" && (
              <div className="tab-content">
                <Title level={4}>技能掌握度</Title>
                <Row gutter={[16, 24]}>
                  {userStats.skills.map((skill, index) => (
                    <Col span={24} key={index}>
                      <div className="skill-item">
                        <div className="skill-header">
                          <Text strong>{skill.name}</Text>
                          <Text>{skill.level}%</Text>
                        </div>
                        <Progress percent={skill.level} strokeColor="#1890ff" />
                      </div>
                    </Col>
                  ))}
                </Row>
                <Divider />
                <Title level={4}>学习建议</Title>
                <Card className="suggestion-card">
                  <Text>
                    根据您的技能分布，建议您可以加强对<Tag color="orange">算法</Tag>的学习，
                    这将有助于提高您的整体编程能力。
                  </Text>
                  <div className="suggestion-action">
                    <Button type="primary">查看学习路线</Button>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </Col>
      </Row>
      
      {/* 面试详情模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <VideoCameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>面试会话详情</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              ID: {currentSessionId.slice(-8)}
            </Tag>
          </div>
        }
        open={detailModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            关闭
          </Button>
        ]}
        width={800}
        centered
        className="interview-detail-modal"
      >
        <div className="interview-detail-content">
          {loadingDetails ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">正在加载面试详情...</Text>
              </div>
            </div>
          ) : interviewDetails.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无面试记录"
            />
          ) : (
                          <div>
                <div className="interview-detail-header">
                  <Row gutter={[16, 16]} align="middle" justify="center">
                    <Col>
                      <Statistic 
                        title="对话轮次" 
                        value={interviewDetails.length} 
                        prefix={<MessageOutlined />}
                        valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                      />
                    </Col>
                    <Col>
                      <Statistic 
                        title="用户回答" 
                        value={interviewDetails.filter(item => item.type === 'ANSWER').length} 
                        prefix={<UserIcon />}
                        valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                      />
                    </Col>
                    <Col>
                      <Statistic 
                        title="AI提问" 
                        value={interviewDetails.filter(item => item.type === 'QUESTION').length} 
                        prefix={<RobotOutlined />}
                        valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                      />
                    </Col>
                    <Col>
                      <Statistic 
                        title="平均得分" 
                        value={
                          interviewDetails.filter(item => item.score).length > 0 
                            ? Math.round(
                                interviewDetails
                                  .filter(item => item.score)
                                  .reduce((sum, item) => sum + (item.score || 0), 0) / 
                                interviewDetails.filter(item => item.score).length
                              )
                            : 0
                        } 
                        suffix="/100"
                        prefix={<TrophyOutlined />}
                        valueStyle={{ color: '#faad14', fontSize: '20px' }}
                      />
                    </Col>
                  </Row>
                </div>
                <Timeline
                  className="interview-timeline"
                  items={interviewDetails.map((record, index) => {
                    const isUser = record.type === 'ANSWER';
                    const isAI = record.type === 'QUESTION';
                    return {
                      key: record.id || index,
                      dot: isUser ? (
                        <Avatar 
                          size="default" 
                          icon={<UserIcon />} 
                          style={{ 
                            backgroundColor: '#1890ff',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                          }}
                        />
                      ) : isAI ? (
                        <Avatar 
                          size="default" 
                          icon={<RobotOutlined />} 
                          style={{ 
                            backgroundColor: '#52c41a',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                          }}
                        />
                      ) : (
                        <Avatar 
                          size="default" 
                          icon={<MessageOutlined />} 
                          style={{ 
                            backgroundColor: '#faad14',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 8px rgba(250, 173, 20, 0.3)'
                          }}
                        />
                      ),
                      children: (
                        <div 
                          className="timeline-item" 
                          data-type={record.type || 'OTHER'}
                        >
                          <div className="timeline-header">
                            <div>
                              <Text strong style={{ fontSize: '15px' }}>
                                {isUser ? '🙋‍♂️ 用户回答' : isAI ? '🤖 AI面试官' : '💬 系统消息'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '13px', marginLeft: 8 }}>
                                第 {index + 1} 轮
                              </Text>
                            </div>
                            <div className="timeline-meta">
                              {record.score && (
                                <Tag 
                                  color={record.score >= 80 ? 'success' : record.score >= 60 ? 'warning' : 'error'}
                                  style={{ borderRadius: '12px', fontWeight: 500 }}
                                >
                                  <TrophyOutlined style={{ marginRight: 4 }} />
                                  {record.score} 分
                                </Tag>
                              )}
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {record.createTime 
                                  ? new Date(record.createTime).toLocaleString('zh-CN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '未知时间'
                                }
                              </Text>
                            </div>
                          </div>
                          <div className="timeline-content">
                            <Paragraph 
                              style={{ 
                                marginBottom: 0, 
                                fontSize: '14px',
                                whiteSpace: 'pre-wrap'
                              }}
                              ellipsis={{ 
                                rows: 4, 
                                expandable: true, 
                                symbol: '展开更多'
                              }}
                            >
                              {record.content || '暂无内容'}
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
