import React, { useEffect, useState } from 'react';
import { Spin, Progress, Typography, Card } from 'antd';
import { 
  FileTextOutlined, 
  RobotOutlined, 
  CheckCircleOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import './QuestionGeneratingOverlay.css';

const { Text, Title } = Typography;

interface QuestionGeneratingOverlayProps {
  isVisible: boolean;
  onCancel?: () => void;
}

const QuestionGeneratingOverlay: React.FC<QuestionGeneratingOverlayProps> = ({ 
  isVisible, 
  onCancel 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // 生成步骤
  const steps = [
    { icon: <FileTextOutlined />, text: '正在分析简历内容...' },
    { icon: <RobotOutlined />, text: 'AI正在生成面试题目...' },
    { icon: <CheckCircleOutlined />, text: '题目生成完成，准备跳转...' }
  ];

  // 友好提示信息
  const tips = [
    '我们的AI正在根据您的简历内容精心准备面试题目',
    '题目将涵盖您的技能经验和项目背景',
    '请耐心等待，这通常需要30-60秒的时间',
    '生成的题目将更贴合您的实际情况'
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      setTimeElapsed(0);
      return;
    }

    // 时间计数器
    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // 进度条动画
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          return prev; // 在90%处停止，等待实际完成
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 1000);

    // 步骤切换
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 10000); // 每10秒切换一个步骤

    return () => {
      clearInterval(timeInterval);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isVisible]);

  // 完成时设置进度为100%
  const handleComplete = () => {
    setProgress(100);
    setCurrentStep(steps.length - 1);
  };

  // 暴露完成方法给父组件
  React.useImperativeHandle(React.createRef(), () => ({
    complete: handleComplete
  }));

  if (!isVisible) return null;

  return (
    <div className="question-generating-overlay">
      <div className="overlay-backdrop" />
      <div className="overlay-content">
        <Card className="generating-card">
          {/* 头部 */}
          <div className="generating-header">
            <div className="header-icon">
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} 
                size="large" 
              />
            </div>
            <Title level={3} className="header-title">
              AI正在为您生成面试题目
            </Title>
            <Text type="secondary" className="header-subtitle">
              请耐心等待，我们正在根据您的简历制定个性化面试方案
            </Text>
          </div>

          {/* 进度条 */}
          <div className="progress-section">
            <Progress 
              percent={Math.floor(progress)} 
              status={progress >= 100 ? "success" : "active"}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              showInfo={false}
            />
            <div className="progress-info">
              <Text className="progress-text">
                {Math.floor(progress)}% 已完成
              </Text>
              <Text type="secondary" className="time-elapsed">
                已用时 {timeElapsed} 秒
              </Text>
            </div>
          </div>

          {/* 当前步骤 */}
          <div className="current-step">
            <div className="step-icon">
              {steps[currentStep]?.icon}
            </div>
            <Text className="step-text">
              {steps[currentStep]?.text}
            </Text>
          </div>

          {/* 友好提示 */}
          <div className="tips-section">
            <div className="tips-title">
              <Text strong>💡 温馨提示</Text>
            </div>
            <div className="tips-list">
              {tips.map((tip, index) => (
                <div key={index} className="tip-item">
                  <span className="tip-dot">•</span>
                  <Text type="secondary">{tip}</Text>
                </div>
              ))}
            </div>
          </div>

          {/* 底部操作 */}
          {onCancel && (
            <div className="overlay-footer">
              <Text 
                type="secondary" 
                className="cancel-link"
                onClick={onCancel}
              >
                取消生成
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default QuestionGeneratingOverlay;