"use server";
import "./index.css";
import Title from "antd/es/typography/Title";
import {Card, Col, Divider, Flex, Row, Statistic, message, Tag} from "antd";
import Link from "next/link";
import {listQuestionBankVoByPage} from "@/api/questionBankController";
import {listQuestionVoByPage} from "@/api/questionController";
import QuestionBankList from "@/components/QuestionBankList";
import QuestionList from "@/components/QuestionList";
import { BookOutlined, FireOutlined, RocketOutlined } from "@ant-design/icons";

/**
 * 主页
 * @returns StartPage
 */
export default async function StartPage() {

    let questionBankList = [];
    let questionList = [];

    try{
        const res = await listQuestionBankVoByPage({
            pageSize: 16,
            sortField: "createTime",
            sortOrder: "descend"
        })
        questionBankList = res.data.records ?? [];
    }catch (e:any) {
        message.error("获取题库列表失败:"+e.message)
    }

    try{
        const res = await listQuestionVoByPage({
            pageSize: 10,
            sortField: "createTime",
            sortOrder: "descend"
        })
        questionList = res.data.records ?? [];
    }catch (e:any)  {
        message.error("获取题目列表失败:"+e.message)
    }

    // 模拟用户数据
    const userStats = {
        streak: 7,
        completedToday: 8,
        totalCompleted: 125
    };

    return (
        <div id="startPage" className="max-width-content">
            {/* 欢迎区域 */}
            <div className="welcome-banner">
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} md={16}>
                        <div className="welcome-content">
                            <Title level={2} className="welcome-title">开始你的学习之旅 👋</Title>
                            <p className="welcome-description">
                                今天是你坚持学习的第 <span className="highlight-text">{userStats.streak}</span> 天，
                                已完成 <span className="highlight-text">{userStats.completedToday}</span> 道题目
                            </p>
                            <div className="welcome-actions">
                                <Link href="/interview" className="action-button primary">
                                    开始模拟面试
                                </Link>
                                <Link href="/questions" className="action-button secondary">
                                    继续刷题
                                </Link>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card className="stats-card">
                            <Statistic 
                                title="总刷题数" 
                                value={userStats.totalCompleted} 
                                prefix={<FireOutlined className="stats-icon" />}
                                suffix="题"
                            />
                            <div className="stats-tags">
                                <Tag color="success">连续{userStats.streak}天</Tag>
                                <Tag color="processing">今日已刷{userStats.completedToday}题</Tag>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 题库部分 */}
            <div className="content-section">
                <div className="section-header">
                    <Flex justify="space-between" align="center">
                        <div className="header-title">
                            <BookOutlined className="section-icon" />
                            <Title level={3} style={{margin:0}}>推荐题库</Title>
                        </div>
                        <Link href="/banks" className="view-more">
                            查看全部 <span className="arrow">→</span>
                        </Link>
                    </Flex>
                </div>
                <div className="section-content">
                    <QuestionBankList questionBankList={questionBankList} />
                </div>
            </div>

            <Divider className="content-divider" />

            {/* 题目部分 */}
            <div className="content-section">
                <div className="section-header">
                    <Flex justify="space-between" align="center">
                        <div className="header-title">
                            <RocketOutlined className="section-icon" />
                            <Title level={3} style={{margin:0}}>最新题目</Title>
                        </div>
                        <Link href="/questions" className="view-more">
                            查看全部 <span className="arrow">→</span>
                        </Link>
                    </Flex>
                </div>
                <div className="section-content">
                    <QuestionList questionList={questionList} />
                </div>
            </div>
        </div>
    );
}
