"use client";
import { useEffect, useRef, useState } from "react";
import { Button, message, Modal, Slider, Switch, Tag, Typography } from "antd";
import { AudioMutedOutlined, AudioOutlined, AudioTwoTone, CloseCircleOutlined, SendOutlined, UserOutlined, VideoCameraAddOutlined, VideoCameraFilled, VideoCameraOutlined } from "@ant-design/icons";
import "./index.css";
import type { Model } from "l2d";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { useScreenRecording } from "./hooks/useScreenRecording";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import ChatMessages, { type ChatMessage } from "./components/ChatMessages";

const { Title, Text } = Typography;

// 为WebKit AudioContext添加类型定义
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * 开始面试页面
 */
export default function InterviewStartPage() {
  // 媒体设备与开关
  const { videoStream, audioStream, videoEnabled, audioEnabled, volumeLevel, handleVideoToggle, handleAudioToggle } = useMediaDevices();

  // 录屏
  const { isRecording, start: startScreen, stop: stopScreen } = useScreenRecording();
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [showRecordingModal, setShowRecordingModal] = useState(true);

  // 语音识别
  const { isRecordingVoice, finalRecognizedText, interimRecognizedText, start: startVoice, stop: stopVoice, clearRecognizedTexts } = useVoiceRecognition({ audioStream, audioEnabled });

  // 输入框内容
  const [userInputText, setUserInputText] = useState("");
  useEffect(() => {
    setUserInputText(finalRecognizedText + interimRecognizedText);
  }, [finalRecognizedText, interimRecognizedText]);

  // 视频元素
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!videoRef.current) return;
    if (videoEnabled && videoStream) {
      videoRef.current.srcObject = videoStream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [videoEnabled, videoStream]);

  // 对话记录
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: "你好，我是AI面试官。今天我将对你进行Web前端开发工程师岗位的面试。请做好准备，我们即将开始。",
      isAI: true,
      timestamp: new Date(),
    },
    {
      content: "首先，请简单介绍一下你的前端开发经验和技术栈。",
      isAI: true,
      timestamp: new Date(Date.now() + 1000),
    },
  ]);

  // 面试信息
  const interviewInfo = {
    position: "Web前端开发工程师",
    difficulty: "中级",
    duration: "约30分钟",
    topics: ["HTML/CSS", "JavaScript", "React", "性能优化", "工程化"],
  };

  // 面试时间
  const [interviewTime, setInterviewTime] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setInterviewTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatInterviewTime = () => {
    const minutes = Math.floor(interviewTime / 60).toString().padStart(2, "0");
    const seconds = (interviewTime % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds} / 30:00`;
  };

  // 录制确认
  const handleRecordingConfirm = () => {
    setShowRecordingModal(false);
    if (recordingEnabled) {
      setTimeout(() => startScreen(videoStream, audioStream), 300);
    } else {
      message.info("您已选择不录制面试过程");
    }
  };

  // 手动开始录屏
  const handleStartRecording = () => {
    if (!isRecording) startScreen(videoStream, audioStream);
  };

  // 语音消息发送
  const handleVoiceMessageSend = () => {
    if (!userInputText.trim()) {
      message.info("请先录入或输入内容");
      return;
    }
    const userResponse: ChatMessage = {
      content: userInputText.trim(),
      isAI: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userResponse]);
    setUserInputText("");
    clearRecognizedTexts();
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        content: "感谢您的回答，这个回答非常全面。下一个问题是：您是如何解决前端性能优化问题的？",
        isAI: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1500);
  };

  // Live2D 模型
  const l2dRef = useRef<HTMLCanvasElement>(null);
  const model = useRef<Model>();
  useEffect(() => {
    import("l2d").then(({ init }) => {
      const l2d = init(l2dRef.current);
      l2d
        .create({ path: "https://model.hacxy.cn/kei_vowels_pro/kei_vowels_pro.model3.json" })
        .then((res) => {
          model.current = res;
        });
    });
    return () => {
      model.current?.destroy();
    };
  }, []);

  // 组件卸载时，若仍在录制则自动停止并保存
  useEffect(() => {
    return () => {
      if (isRecording) stopScreen();
    };
  }, [isRecording, stopScreen]);

  const { Title, Text } = Typography;

  const handleEndInterview = () => {
    if (isRecording) {
      Modal.confirm({
        title: "结束面试",
        content: "面试录制尚未结束，确定要结束面试吗？录制的视频将自动保存。",
        okText: "确认结束",
        cancelText: "取消",
        onOk: () => {
          stopScreen();
          message.success("面试已结束");
        },
      });
    } else {
      Modal.confirm({
        title: "结束面试",
        content: "确定要结束当前面试吗？",
        okText: "确认结束",
        cancelText: "取消",
        onOk: () => message.success("面试已结束"),
      });
    }
  };

  return (
    <div className="interview-start-container">
      <Modal
        title="面试录制设置"
        open={showRecordingModal}
        onOk={handleRecordingConfirm}
        onCancel={() => {
          setRecordingEnabled(false);
          setShowRecordingModal(false);
          message.info("您已选择不录制面试过程");
        }}
        okText="确认"
        cancelText="取消"
        closable={false}
        maskClosable={false}
      >
        <div style={{ marginBottom: "20px" }}>
          <p>是否要录制本次面试过程？录制的视频将在面试结束后自动下载到您的设备。</p>
          <div style={{ display: "flex", alignItems: "center", marginTop: "15px" }}>
            <Switch checked={recordingEnabled} onChange={(checked) => setRecordingEnabled(checked)} style={{ marginRight: "10px" }} />
            <span>{recordingEnabled ? "开启录制" : "关闭录制"}</span>
          </div>
          <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>提示：录制的视频将保存在您的浏览器默认下载位置</p>
          {recordingEnabled && (
            <div style={{ backgroundColor: "#f6f6f6", padding: "10px", borderRadius: "4px", marginTop: "10px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                <strong>注意</strong>：录制开始时，您需要选择要共享的内容（整个屏幕、应用窗口或浏览器标签页）。 为了获得最佳效果，建议选择“整个屏幕”或当前浏览器窗口。
              </p>
            </div>
          )}
        </div>
      </Modal>

      <div className="layout-container">
        <div className="ai-panel">
          <div className="ai-header">
            <div className="status-indicator"></div>
            <div className="header-text">已连接</div>
            {isRecording && (
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                录制中
              </div>
            )}
          </div>

          <div className="ai-avatar-container">
            <div className="ai-avatar-placeholder">
              <canvas ref={l2dRef} />
            </div>

            <div className="ai-info">
              <div className="ai-title">AI面试官</div>
              <div className="ai-subtitle">技术面试专家</div>
            </div>
          </div>

          <div className="interview-stats">
            <div className="stat-item">
              <div className="stat-label">已用时间</div>
              <div className="stat-value">{formatInterviewTime()}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">得分</div>
              <div className="stat-value">0/5</div>
            </div>
          </div>
        </div>

        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-title">面试对话记录</div>
            <div className="chat-actions"></div>
          </div>

          <div className="conversation-container">
            <ChatMessages messages={messages} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="输入你的回答..."
              disabled={!audioEnabled}
              value={userInputText}
              onChange={(e) => setUserInputText(e.target.value)}
            />
            <div
              className={`voice-button ${isRecordingVoice ? "recording" : ""} ${!audioEnabled ? "disabled" : ""}`}
              onClick={isRecordingVoice ? stopVoice : startVoice}
              title={isRecordingVoice ? "点击停止语音识别" : "点击开始语音输入"}
            >
              <AudioTwoTone twoToneColor={isRecordingVoice ? "#ff4d4f" : audioEnabled ? "#4f6ef2" : "#999"} />
            </div>
            <div className="send-button" onClick={handleVoiceMessageSend}>
              <SendOutlined />
            </div>
          </div>
        </div>

        <div className="tools-panel">
          <div className="tools-section">
            <div className="section-title">设备控制</div>

            <div className="device-control">
              <div className="device-label">麦克风</div>
              <Switch
                checked={audioEnabled}
                onChange={handleAudioToggle}
                checkedChildren={<AudioOutlined />}
                unCheckedChildren={<AudioMutedOutlined />}
                size="small"
              />
            </div>

            <div className="device-control">
              <div className="device-label">摄像头</div>
              <Switch
                checked={videoEnabled}
                onChange={handleVideoToggle}
                checkedChildren={<VideoCameraOutlined />}
                unCheckedChildren={<VideoCameraAddOutlined />}
                size="small"
              />
            </div>

            <div className="device-control">
              <div className="device-label">录制面试</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {!isRecording && recordingEnabled ? (
                  <Button type="primary" size="small" icon={<VideoCameraFilled />} onClick={handleStartRecording}>
                    开始录制
                  </Button>
                ) : isRecording ? (
                  <Button danger size="small" onClick={stopScreen}>
                    停止录制
                  </Button>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                    录制已关闭
                  </Typography.Text>
                )}
              </div>
            </div>

            <div className="user-video-container">
              <video ref={videoRef} autoPlay muted playsInline className={`user-video ${!videoEnabled ? "hidden" : ""}`} />
              {!videoEnabled && (
                <div className="video-placeholder">
                  <UserOutlined style={{ fontSize: 40 }} />
                  <div>摄像头已关闭</div>
                </div>
              )}
            </div>

            <div className="volume-control">
              <div className="volume-header">
                <div className="volume-label">音量</div>
                <div className="volume-value">{volumeLevel}%</div>
              </div>
              <Slider value={volumeLevel} disabled />
            </div>
          </div>

          <div className="tools-section">
            <div className="section-title">面试信息</div>
            <div className="interview-info-list">
              <div className="info-item">
                <div className="info-label">岗位名称</div>
                <div className="info-value">{interviewInfo.position}</div>
              </div>
              <div className="info-item">
                <div className="info-label">技术面试</div>
                <Tag color="blue" className="small-tag">{interviewInfo.difficulty}</Tag>
              </div>
              <div className="info-item">
                <div className="info-label">时长限制</div>
                <div className="info-value">{interviewInfo.duration}</div>
              </div>
              <div className="info-item">
                <div className="info-label">测评分数</div>
                <div className="info-value">5</div>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>面试主题</div>
            <div className="topic-tags">
              {interviewInfo.topics.map((topic, index) => (
                <Tag key={index} color="blue" className="small-tag">
                  {topic}
                </Tag>
              ))}
            </div>
          </div>

          <div className="tools-section">
            <div className="section-title">实时提示</div>
            <div className="realtime-info">
              <div className="time-counter">{formatInterviewTime()}</div>
            </div>

            <Button type="primary" danger className="control-button" icon={<CloseCircleOutlined />} onClick={handleEndInterview}>
              结束面试
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}