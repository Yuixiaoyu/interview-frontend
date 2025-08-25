"use client";
import { useEffect, useRef, useState } from "react";
import { Button, message, Modal, Slider, Switch, Tag, Typography, Card, Avatar } from "antd";
import { AudioMutedOutlined, AudioOutlined, AudioTwoTone, CloseCircleOutlined, SendOutlined, UserOutlined, VideoCameraAddOutlined, VideoCameraFilled, VideoCameraOutlined, MailOutlined, PhoneOutlined, GithubOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { resumeGet } from "@/api/fileController";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { getAuthToken } from "@/utils/cookie";
import "./index.css";
import type { Model } from "l2d";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { useScreenRecording } from "./hooks/useScreenRecording";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import ChatMessages, { type ChatMessage } from "./components/ChatMessages";
import LoadingOverlay from "./components/LoadingOverlay";

// 为WebKit AudioContext添加类型定义
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * 开始面试页面
 */
export default function InterviewStartPage() {
  // 获取当前登录用户信息
  const loginUser = useSelector((state: RootState) => state.loginUser);
  
  // 简历数据状态
  const [resumeData, setResumeData] = useState<API.ResumeDocument | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  
  // WebSocket连接状态
  const [wsConnected, setWsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  // 消息序列号跟踪
  const [lastSeq, setLastSeq] = useState<number>(-1);
  
  // 面试得分状态
  const [interviewScore, setInterviewScore] = useState<number>(0);
  const [scoreAnimation, setScoreAnimation] = useState<boolean>(false);
  
  // 面试开始时间
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  
  // 媒体设备与开关
  const { videoStream, audioStream, videoEnabled, audioEnabled, volumeLevel, handleVideoToggle, handleAudioToggle } = useMediaDevices();

  // 录屏
  const { isRecording, start: startScreen, stop: stopScreen } = useScreenRecording();
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [showRecordingModal, setShowRecordingModal] = useState(true);

  // 语音识别
  const { isRecordingVoice, finalRecognizedText, interimRecognizedText, start: startVoice, stop: stopVoice, clearRecognizedTexts } = useVoiceRecognition({ audioStream, audioEnabled });

  // 获取简历数据
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setLoadingResume(true);
        const response = await resumeGet();
        if (response && response.data) {
          setResumeData(response.data);
          console.log("简历数据获取成功:", response.data);
        } else {
          message.warning("未找到简历数据");
        }
      } catch (error) {
        console.error("获取简历数据失败:", error);
        message.error("获取简历数据失败");
      } finally {
        setLoadingResume(false);
      }
    };
    
    fetchResumeData();
  }, []);

  // WebSocket连接逻辑
  useEffect(() => {
    const connectWebSocket = () => {
      const token = getAuthToken();
      
      if (!token) {
        console.error("未找到认证token，无法连接WebSocket");
        message.error("未找到认证信息，请重新登录");
        return;
      }
      
      setConnecting(true);
      console.log("开始连接WebSocket，token:", token);
      
      try {
        // 创建WebSocket连接，传入token参数
        const ws = new WebSocket(`ws://localhost:8811/api/interview?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log("WebSocket连接成功");
          setWsConnected(true);
          setConnecting(false);
          
          // 设置面试开始时间
          setInterviewStartTime(new Date());
          console.log("面试计时开始");
          
          message.success("面试连接已建立");
        };
        
        ws.onmessage = (event) => {
          try {
            // 检查是否是二进制数据 (TTS)
            if (event.data instanceof ArrayBuffer) {
              console.log("🎵 接收到TTS音频数据:", event.data.byteLength, "字节");
              decodeTTSAndSpeak(event.data);
              return;
            }
            
            // 处理JSON数据
            const data = JSON.parse(event.data);
            console.log("🔍 接收到WebSocket消息:", data);
            console.log("🔍 消息类型:", data.type, "问题:", data.question, "得分:", data.score, "序列号:", data.seq, "TTS:", !!data.tts);
            
            // 检查新的字段格式：question字段包含问题内容
            if (data.type === "QUESTION" && data.question && typeof data.question === 'string' && data.question.trim()) {
              // 更新序列号
              if (typeof data.seq === 'number') {
                setLastSeq(data.seq);
                console.log("✅ 更新序列号:", data.seq);
              }
              
              // 累加得分
              if (typeof data.score === 'number') {
                setInterviewScore(prev => {
                  const newScore = prev + data.score;
                  console.log("🏆 得分更新 - 本次:", data.score, "累计:", newScore);
                  
                  // 触发得分动画
                  setScoreAnimation(true);
                  setTimeout(() => setScoreAnimation(false), 1000);
                  
                  // 显示得分提示
                  if (data.score > 0) {
                    message.success(`获得 +${data.score} 分！当前总分：${newScore}`);
                  }
                  
                  return newScore;
                });
              }
              
              // 添加AI消息到对话记录
              const aiMessage: ChatMessage = {
                content: data.question,
                isAI: true,
                timestamp: new Date(),
              };
              
              console.log("📝 准备添加AI消息:", aiMessage);
              
              setMessages(prev => {
                const newMessages = [...prev, aiMessage];
                console.log("📊 消息列表更新 - 之前:", prev.length, "之后:", newMessages.length);
                console.log("📊 最新消息列表:", newMessages);
                return newMessages;
              });
              
              console.log("✅ AI消息添加完成");
              
              // 处理TTS字段（如果存在）
              if (data.tts) {
                console.log("🎵 检测到TTS字段，准备处理语音数据");
                
                // 如果TTS是base64字符串，需要转换为ArrayBuffer
                if (typeof data.tts === 'string') {
                  try {
                    // 移除可能的data URL前缀
                    const base64Data = data.tts.replace(/^data:.*,/, '');
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    decodeTTSAndSpeak(bytes.buffer);
                  } catch (error) {
                    console.error("❌ TTS base64解码失败:", error);
                  }
                } else if (data.tts instanceof ArrayBuffer) {
                  // 直接是ArrayBuffer
                  decodeTTSAndSpeak(data.tts);
                } else {
                  console.warn("⚠️ 不支持的TTS数据格式:", typeof data.tts);
                }
              }
            } else {
              console.log("⚠️ 消息不符合显示条件");
              console.log("   - 数据结构:", Object.keys(data));
              console.log("   - 类型:", data.type);
              console.log("   - 问题内容:", data.question);
              console.log("   - 得分:", data.score);
              console.log("   - 序列号:", data.seq);
            }
          } catch (error) {
            console.error("❌ 解析WebSocket消息失败:", error, "原始数据:", event.data);
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket连接错误:", error);
          setWsConnected(false);
          setConnecting(false);
          message.error("面试连接失败，请检查网络");
        };
        
        ws.onclose = (event) => {
          console.log("WebSocket连接关闭:", event.code, event.reason);
          setWsConnected(false);
          setConnecting(false);
          
          // 重置面试开始时间
          setInterviewStartTime(null);
          console.log("面试计时停止");
          
          if (event.code !== 1000) { // 非正常关闭
            message.warning("面试连接已断开");
          }
        };
        
      } catch (error) {
        console.error("创建WebSocket连接失败:", error);
        setConnecting(false);
        message.error("无法建立面试连接");
      }
    };
    
    // 页面加载后延迟连接，确保用户状态已初始化
    const timer = setTimeout(connectWebSocket, 1000);
    
    // 清理函数
    return () => {
      clearTimeout(timer);
      if (wsRef.current) {
        console.log("关闭WebSocket连接");
        wsRef.current.close(1000, "页面卸载");
        wsRef.current = null;
      }
    };
  }, []);

  // TTS音频解码和播放函数
  const decodeTTSAndSpeak = async (ttsArrayBuffer: ArrayBuffer) => {
    try {
      console.log("🎵 开始解码TTS音频数据", ttsArrayBuffer.byteLength, "字节");
      
      // 创建或获取AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioContext = audioContextRef.current;
      
      // 确保AudioContext处于运行状态
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // 解码音频数据
      const audioBuffer = await audioContext.decodeAudioData(ttsArrayBuffer);
      console.log("🎵 音频解码成功, 时长:", audioBuffer.duration.toFixed(2), "秒");
      
      // 让虚拟人说话
      if (model.current && motionSyncLoaded) {
        console.log("🗣️ 虚拟人开始说话");
        model.current.speak(audioBuffer);
      } else {
        console.warn("⚠️ 模型未就绪或MotionSync未加载，无法播放语音");
        if (!model.current) {
          console.warn("   - 模型未加载");
        }
        if (!motionSyncLoaded) {
          console.warn("   - MotionSync文件未加载");
        }
        
        // 如果模型未就绪，直接播放音频
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        console.log("🔊 直接播放音频");
      }
      
    } catch (error) {
      console.error("❌ TTS音频解码失败:", error);
      message.error("语音播放失败");
    }
  };

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // 监控消息状态变化
  useEffect(() => {
    console.log("🎯 Messages状态更新:", messages.length, "条消息");
    messages.forEach((msg, index) => {
      console.log(`🎯 消息${index + 1}:`, msg.isAI ? "AI" : "用户", "- 内容:", msg.content.substring(0, 50) + "...");
    });
  }, [messages]);

  // 面试信息（基于简历数据动态生成）
  const getInterviewInfo = () => {
    if (!resumeData?.resume) {
      return {
        position: "技术面试",
        difficulty: "中级",
        duration: "约30分钟",
        topics: ["技术基础", "项目经验"],
      };
    }
    
    const resume = resumeData.resume;
    const allSkills = [
      ...(resume.technical_skills_programming_languages || []),
      ...(resume.technical_skills_web_development || []),
      ...(resume.technical_skills_database || []),
      ...(resume.technical_skills_devops || []),
      ...(resume.technical_skills_others || [])
    ];
    
    return {
      position: resume.job_target || "技术岗位",
      difficulty: "中级",
      duration: "约30分钟",
      topics: allSkills.slice(0, 6), // 取前6个技能作为面试主题
    };
  };
  
  const interviewInfo = getInterviewInfo();

  // 面试时间计算
  const [interviewTime, setInterviewTime] = useState(0);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (interviewStartTime) {
      // 只有当面试开始时间设置后才开始计时
      timer = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - interviewStartTime.getTime()) / 1000);
        setInterviewTime(elapsedSeconds);
      }, 1000);
    } else {
      // 未开始时重置为0
      setInterviewTime(0);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [interviewStartTime]);
  
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

  // 发送用户回答
  const handleSendAnswer = () => {
    const trimmedText = userInputText.trim();
    
    // 验证输入不能为空
    if (!trimmedText) {
      message.warning("请先输入回答内容");
      return;
    }
    
    // 验证WebSocket连接
    if (!wsConnected || !wsRef.current) {
      message.error("面试连接已断开，请刷新页面重试");
      return;
    }
    
    try {
      // 构造发送数据
      const sendData = {
        seq: lastSeq + 1,
        answer: trimmedText
      };
      
      console.log("发送用户回答:", sendData);
      
      // 通过WebSocket发送
      wsRef.current.send(JSON.stringify(sendData));
      
      // 添加用户消息到对话记录
      const userMessage: ChatMessage = {
        content: trimmedText,
        isAI: false,
        timestamp: new Date(),
      };
      
      console.log("📝 准备添加用户消息:", userMessage);
      
      setMessages((prev) => {
        const newMessages = [...prev, userMessage];
        console.log("📊 用户消息添加 - 之前:", prev.length, "之后:", newMessages.length);
        console.log("📊 当前消息列表:", newMessages);
        return newMessages;
      });
      
      // 清空输入框
      setUserInputText("");
      clearRecognizedTexts();
      
      console.log("✅ 用户回答发送成功");
      
    } catch (error) {
      console.error("发送用户回答失败:", error);
      message.error("发送回答失败，请重试");
    }
  };

  // Live2D 模型加载状态
  const l2dRef = useRef<HTMLCanvasElement>(null);
  const model = useRef<Model>();
  const [modelReady, setModelReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [motionSyncLoaded, setMotionSyncLoaded] = useState(false);
  
  useEffect(() => {
    setIsModelLoading(true);
    import("l2d").then(({ init }) => {
      const l2d = init(l2dRef.current);
      l2d
        .create({ 
          path: "https://model.hacxy.cn/kei_vowels_pro/kei_vowels_pro.model3.json",
          scale: 0.3 
        })
        .then(async (res) => {
          model.current = res;
          setModelReady(true);
          
          // 加载MotionSync文件以支持口型同步
          try {
            await res.loadMotionSyncFromUrl('https://model.hacxy.cn/kei_vowels_pro/kei_vowels_pro.motionsync3.json');
            setMotionSyncLoaded(true);
            console.log("MotionSync文件加载成功");
          } catch (error) {
            console.error("MotionSync文件加载失败:", error);
          }
          
          // 延迟关闭加载动画，让用户看到完整的加载体验
          setTimeout(() => {
            setIsModelLoading(false);
          }, 1000);
          console.log("模型加载成功");
        })
        .catch((error) => {
          console.error("模型加载失败:", error);
          // 即使加载失败也要关闭loading
          setTimeout(() => {
            setIsModelLoading(false);
          }, 2000);
        });
    });
    return () => {
      model.current?.destroy();
      
      // 清理AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // 组件卸载时，若仍在录制则自动停止并保存
  useEffect(() => {
    return () => {
      if (isRecording) stopScreen();
      // 确保WebSocket连接被关闭
      if (wsRef.current) {
        wsRef.current.close(1000, "组件卸载");
        wsRef.current = null;
      }
    };
  }, [isRecording, stopScreen]);

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
    <>
      <LoadingOverlay isVisible={isModelLoading} />
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
            <div className={`status-indicator ${wsConnected ? 'connected' : connecting ? 'connecting' : 'disconnected'}`}></div>
            <div className="header-text">
              {connecting ? "连接中..." : wsConnected ? "已连接" : "未连接"}
            </div>
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
              <div className="stat-label">当前得分</div>
              <div className={`stat-value ${scoreAnimation ? 'score-animated' : ''}`}>
                {interviewScore}分
              </div>
            </div>
          </div>
        </div>

        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-title">面试对话记录</div>
          </div>

          <div className="conversation-container">
            {messages.length === 0 ? (
              <div className="empty-chat">
                {connecting ? (
                  <div className="empty-chat-message">
                    <Typography.Text type="secondary">正在连接面试系统...</Typography.Text>
                  </div>
                ) : wsConnected ? (
                  <div className="empty-chat-message">
                    <Typography.Text type="secondary">面试连接已建立，等待AI面试官提问...</Typography.Text>
                  </div>
                ) : (
                  <div className="empty-chat-message">
                    <Typography.Text type="secondary">面试连接失败，请刷新页面重试</Typography.Text>
                  </div>
                )}
              </div>
            ) : (
              <ChatMessages messages={messages} />
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="输入你的回答..."
              disabled={!audioEnabled || !wsConnected}
              value={userInputText}
              onChange={(e) => setUserInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAnswer();
                }
              }}
            />
            <div
              className={`voice-button ${isRecordingVoice ? "recording" : ""} ${!audioEnabled ? "disabled" : ""}`}
              onClick={isRecordingVoice ? stopVoice : startVoice}
              title={isRecordingVoice ? "点击停止语音识别" : "点击开始语音输入"}
            >
              <AudioTwoTone twoToneColor={isRecordingVoice ? "#ff4d4f" : audioEnabled ? "#4f6ef2" : "#999"} />
            </div>
            <div 
              className={`send-button ${!userInputText.trim() || !wsConnected ? 'disabled' : ''}`} 
              onClick={handleSendAnswer}
              title={!wsConnected ? "面试连接已断开" : !userInputText.trim() ? "请输入回答内容" : "发送回答"}
            >
              <SendOutlined />
            </div>
          </div>
        </div>

        <div className="tools-panel">
          <div className="tools-section">
            <div className="section-title">个人信息</div>
            {loadingResume ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Typography.Text type="secondary">加载简历信息中...</Typography.Text>
              </div>
            ) : resumeData?.resume ? (
              <Card size="small" className="user-info-card">
                <div className="user-basic-info">
                  <Avatar 
                    size={48} 
                    src={loginUser.userAvatar} 
                    icon={!loginUser.userAvatar && <UserOutlined />}
                    className="user-avatar" 
                  />
                  <div className="user-details">
                    <div className="user-name">
                      {resumeData.resume.basic_info_name || loginUser.userName || "用户"}
                    </div>
                    <div className="user-position">
                      {resumeData.resume.job_target || "求职者"}
                    </div>
                  </div>
                </div>
                
                <div className="contact-info">
                  {resumeData.resume.basic_info_email && (
                    <div className="contact-item">
                      <MailOutlined style={{ fontSize: '12px', color: '#666' }} />
                      <Typography.Text style={{ fontSize: '12px' }}>
                        {resumeData.resume.basic_info_email}
                      </Typography.Text>
                    </div>
                  )}
                  {resumeData.resume.basic_info_phone && (
                    <div className="contact-item">
                      <PhoneOutlined style={{ fontSize: '12px', color: '#666' }} />
                      <Typography.Text style={{ fontSize: '12px' }}>
                        {resumeData.resume.basic_info_phone}
                      </Typography.Text>
                    </div>
                  )}
                  {resumeData.resume.basic_info_github && (
                    <div className="contact-item">
                      <GithubOutlined style={{ fontSize: '12px', color: '#666' }} />
                      <Typography.Text style={{ fontSize: '12px' }}>
                        GitHub
                      </Typography.Text>
                    </div>
                  )}
                  {resumeData.resume.basic_info_location && (
                    <div className="contact-item">
                      <EnvironmentOutlined style={{ fontSize: '12px', color: '#666' }} />
                      <Typography.Text style={{ fontSize: '12px' }}>
                        {resumeData.resume.basic_info_location}
                      </Typography.Text>
                    </div>
                  )}
                </div>
                
                {resumeData.resume.education && resumeData.resume.education.length > 0 && (
                  <div className="education-info">
                    <Typography.Text strong style={{ fontSize: '12px' }}>教育背景</Typography.Text>
                    <div style={{ marginTop: '4px' }}>
                      <Typography.Text style={{ fontSize: '11px', color: '#666' }}>
                        {resumeData.resume.education[0].university} - {resumeData.resume.education[0].major}
                      </Typography.Text>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Typography.Text type="secondary">暂无简历信息</Typography.Text>
              </div>
            )}
          </div>

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
              <div className="score-display">
                <Typography.Text strong style={{ color: '#4f6ef2', fontSize: '14px' }}>
                  当前得分：{interviewScore}分
                </Typography.Text>
              </div>
            </div>

            <Button type="primary" danger className="control-button" icon={<CloseCircleOutlined />} onClick={handleEndInterview}>
              结束面试
            </Button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}