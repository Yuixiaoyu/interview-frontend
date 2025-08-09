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
  Typography
} from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import Paragraph from "antd/es/typography/Paragraph";
import { useState } from "react";
import CalendarChart from "@/app/user/center/components/CalendarChart";
import {
  BookOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FireOutlined,
  RiseOutlined,
  StarOutlined,
  TrophyOutlined,
  UserOutlined
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
    </div>
  );
}
