/**
 * 面试开始页面
 * 
 * 功能说明：
 * 1. 虚拟人选择：页面加载后显示选择对话框，提供三个Live2D虚拟面试官（Xisitina、Shizuku、Hibiki）供用户选择
 * 2. 实时面试：通过WebSocket与后端建立连接，实现AI面试官与用户的实时对话
 * 3. 语音交互：支持语音识别输入用户回答，AI面试官回答时播放TTS语音并实现口型同步
 * 4. 设备控制：支持摄像头、麦克风开关，音量监控
 * 5. 录制功能：可选择录制整个面试过程，结束后自动下载
 * 6. 得分系统：实时显示面试得分和用时
 * 
 * 实现方式：
 * - 使用l2d库加载和渲染Live2D虚拟人模型
 * - 初始加载完成后先显示虚拟人选择器，用户选择后才加载主模型和建立WebSocket连接
 * - WebSocket接收AI问题和TTS音频数据，通过AudioContext解码后让虚拟人播放
 * - 使用Web Speech API实现语音识别，将用户语音转为文字
 * - 使用MediaRecorder API录制屏幕和音频
 * - 所有状态通过React Hooks管理，确保UI与数据同步
 */

"use client";
import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  message,
  Modal,
  Slider,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  AudioMutedOutlined,
  AudioOutlined,
  AudioTwoTone,
  CloseCircleOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  MailOutlined,
  PhoneOutlined,
  SendOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
  VideoCameraFilled,
  VideoCameraOutlined,
} from "@ant-design/icons";
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
 * 开始面试页面组件
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
  const wsInitializedRef = useRef(false); // 标记WebSocket是否已初始化过

  // 消息序列号跟踪
  const [lastSeq, setLastSeq] = useState<number>(-1);

  // 面试得分状态
  const [interviewScore, setInterviewScore] = useState<number>(0);
  const [scoreAnimation, setScoreAnimation] = useState<boolean>(false);
  const interviewScoreRef = useRef<number>(0); // 保存最新得分的ref

  // 面试开始时间
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(
    null,
  );

  // 媒体设备与开关
  const {
    videoStream,
    audioStream,
    videoEnabled,
    audioEnabled,
    volumeLevel,
    handleVideoToggle,
    handleAudioToggle,
  } = useMediaDevices();

  // 录屏
  const {
    isRecording,
    start: startScreen,
    stop: stopScreen,
  } = useScreenRecording();
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingSettingCompleted, setRecordingSettingCompleted] = useState(false);

  // 语音识别
  const {
    isRecordingVoice,
    finalRecognizedText,
    interimRecognizedText,
    start: startVoice,
    stop: stopVoice,
    clearRecognizedTexts,
  } = useVoiceRecognition({ audioStream, audioEnabled });

  // Live2D 模型加载状态
  const l2dRef = useRef<HTMLCanvasElement>(null);
  const model = useRef<Model>();
  const [modelReady, setModelReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [motionSyncLoaded, setMotionSyncLoaded] = useState(false);
  
  // 虚拟人选择对话框
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModelPath, setSelectedModelPath] = useState<string | null>(null);
  const modelSelectorRef = useRef<HTMLCanvasElement>(null);
  const previewModels = useRef<Model[]>([]);

  // 对话记录
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 获取简历数据
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setLoadingResume(true);
        const response: any = await resumeGet();
        if (response && response.data) {
          setResumeData(response.data );
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
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // 解码音频数据
      const audioBuffer = await audioContext.decodeAudioData(ttsArrayBuffer);
      console.log(
        "🎵 音频解码成功, 时长:",
        audioBuffer.duration.toFixed(2),
        "秒",
      );

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

  // WebSocket连接逻辑 - 只有在选择了模型且录屏设置完成后才连接
  useEffect(() => {
    // 调试日志
    console.log("🔍 WebSocket连接条件检查:", {
      selectedModelPath: !!selectedModelPath,
      recordingSettingCompleted,
      showRecordingModal,
      wsInitialized: wsInitializedRef.current,
    });
    
    // 如果已经初始化过，不再重复连接
    if (wsInitializedRef.current) {
      console.log("⏭️ WebSocket已初始化，跳过重复连接");
      return;
    }
    
    // 如果还没有选择模型或录屏设置未完成，不连接WebSocket
    if (!selectedModelPath || !recordingSettingCompleted) {
      console.log("⏸️ WebSocket连接等待中...");
      return;
    }
    
    console.log("✅ WebSocket连接条件满足，准备连接...");
    wsInitializedRef.current = true; // 标记为已初始化
    
    const connectWebSocket = () => {
      const token = getAuthToken();

      if (!token) {
        console.error("未找到认证token，无法连接WebSocket");
        console.log("请检查Cookie中是否有以下任一token: token, authToken, access_token, jwt_token");
        message.error({
          content: "未找到认证信息，请先登录系统",
          duration: 5,
        });
        setConnecting(false);
        return;
      }

      setConnecting(true);
      console.log("开始连接WebSocket，token:", token);

      try {
        // 创建WebSocket连接，传入token参数
        const ws = new WebSocket(
          `ws://localhost:8811/api/interview?token=${encodeURIComponent(token)}`,
        );
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
              console.log(
                "🎵 接收到TTS音频数据:",
                event.data.byteLength,
                "字节",
              );
              decodeTTSAndSpeak(event.data);
              return;
            }

            // 处理JSON数据
            const data = JSON.parse(event.data);
            console.log("🔍 接收到WebSocket消息:", data);
            console.log(
              "🔍 消息类型:",
              data.type,
              "问题:",
              data.question,
              "得分:",
              data.score,
              "序列号:",
              data.seq,
              "TTS:",
              !!data.tts,
            );

            // 处理面试结束消息
            if (data.type === "DONE") {
              console.log("🎉 收到面试结束消息，最终得分:", interviewScoreRef.current);
              
              // 停止录屏（如果正在录制）
              if (isRecording) {
                console.log("⏹️ 自动停止录屏");
                stopScreen();
              }
              
              // 延迟显示对话框，确保录屏已保存
              setTimeout(() => {
                Modal.success({
                  title: "🎉 面试已结束",
                  content: (
                    <div>
                      <p style={{ fontSize: "14px", marginBottom: "15px" }}>
                        恭喜你完成本次面试！
                      </p>
                      <div style={{ 
                        backgroundColor: "#f0f5ff", 
                        padding: "15px", 
                        borderRadius: "8px",
                        textAlign: "center",
                        marginBottom: "15px"
                      }}>
                        <div style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>
                          最终得分
                        </div>
                        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4f6ef2" }}>
                          {interviewScoreRef.current} 分
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: "#666" }}>
                        {data.msg || "感谢您的参与，面试记录已保存。"}
                      </p>
                      {isRecording && (
                        <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
                          💾 面试录制已自动保存到下载文件夹
                        </p>
                      )}
                    </div>
                  ),
                  okText: "返回面试中心",
                  width: 450,
                  onOk: () => {
                    // 跳转到面试中心页面
                    window.location.href = "/interview";
                  },
                });
              }, isRecording ? 1000 : 100); // 如果正在录制，等待1秒让录屏保存
              
              return; // 处理完DONE消息后直接返回
            }

            // 检查新的字段格式：question字段包含问题内容
            if (
              data.type === "QUESTION" &&
              data.question &&
              typeof data.question === "string" &&
              data.question.trim()
            ) {
              // 更新序列号
              if (typeof data.seq === "number") {
                setLastSeq(data.seq);
                console.log("✅ 更新序列号:", data.seq);
              }

              // 累加得分
              if (typeof data.score === "number") {
                setInterviewScore((prev) => {
                  const newScore = prev + data.score;
                  interviewScoreRef.current = newScore; // 更新ref
                  console.log(
                    "🏆 得分更新 - 本次:",
                    data.score,
                    "累计:",
                    newScore,
                  );

                  // 触发得分动画
                  setScoreAnimation(true);
                  setTimeout(() => setScoreAnimation(false), 1000);

                  // 显示得分提示
                  if (data.score > 0) {
                    message.success(
                      `获得 +${data.score} 分！当前总分：${newScore}`,
                    );
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

              setMessages((prev) => {
                const newMessages = [...prev, aiMessage];
                console.log(
                  "📊 消息列表更新 - 之前:",
                  prev.length,
                  "之后:",
                  newMessages.length,
                );
                console.log("📊 最新消息列表:", newMessages);
                return newMessages;
              });

              console.log("✅ AI消息添加完成");

              // 处理TTS字段（如果存在）
              if (data.tts) {
                console.log("🎵 检测到TTS字段，准备处理语音数据");

                // 如果TTS是base64字符串，需要转换为ArrayBuffer
                if (typeof data.tts === "string") {
                  try {
                    // 移除可能的data URL前缀
                    const base64Data = data.tts.replace(/^data:.*,/, "");
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
            console.error(
              "❌ 解析WebSocket消息失败:",
              error,
              "原始数据:",
              event.data,
            );
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket连接错误:", error);
          setWsConnected(false);
          setConnecting(false);
          message.error({
            content: "面试连接失败，请确认：1. 后端服务已启动 2. 运行在 localhost:8811 3. 已登录",
            duration: 5,
          });
        };

        ws.onclose = (event) => {
          console.log("WebSocket连接关闭:", event.code, event.reason);
          setWsConnected(false);
          setConnecting(false);

          // 重置面试开始时间
          setInterviewStartTime(null);
          console.log("面试计时停止");

          // 1000 表示正常关闭（包括面试结束），不显示警告
          // 其他状态码表示异常关闭，需要提示用户
          if (event.code !== 1000) {
            message.warning({
              content: "面试连接意外断开，请检查网络后重新开始面试",
              duration: 5,
            });
          } else if (event.reason && event.reason !== "组件卸载") {
            // 正常关闭但有原因说明（例如后端主动关闭）
            console.log("✅ WebSocket正常关闭，原因:", event.reason);
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

    // 清理函数 - 只在组件真正卸载时执行
    return () => {
      clearTimeout(timer);
      // 注意：这里不关闭WebSocket，只清理定时器
      // WebSocket会在组件最终卸载时由下面的useEffect清理
    };
  }, [selectedModelPath, recordingSettingCompleted]); // 依赖selectedModelPath和录屏设置完成状态
  
  // 单独的清理effect，只在组件卸载时执行
  useEffect(() => {
    return () => {
      console.log("🧹 组件卸载，清理WebSocket连接");
      if (wsRef.current) {
        wsRef.current.close(1000, "组件卸载");
        wsRef.current = null;
      }
      wsInitializedRef.current = false;
    };
  }, []); // 空依赖数组，只在组件挂载和卸载时执行

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

  // 监控消息状态变化
  useEffect(() => {
    console.log("🎯 Messages状态更新:", messages.length, "条消息");
    messages.forEach((msg, index) => {
      console.log(
        `🎯 消息${index + 1}:`,
        msg.isAI ? "AI" : "用户",
        "- 内容:",
        msg.content.substring(0, 50) + "...",
      );
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
      ...(resume.technical_skills_others || []),
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
        const elapsedSeconds = Math.floor(
          (now.getTime() - interviewStartTime.getTime()) / 1000,
        );
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
    const minutes = Math.floor(interviewTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (interviewTime % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds} / 30:00`;
  };

  // 录制确认
  const handleRecordingConfirm = () => {
    console.log("📌 用户确认录屏设置, recordingEnabled:", recordingEnabled);
    setShowRecordingModal(false);
    setRecordingSettingCompleted(true); // 标记录屏设置已完成，允许WebSocket连接
    console.log("✅ 录屏设置已完成，允许WebSocket连接");
    
    if (recordingEnabled) {
      // 延迟启动录屏，避免与WebSocket连接冲突
      console.log("⏰ 将在1.5秒后启动录屏");
      setTimeout(() => startScreen(videoStream, audioStream), 1500);
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
        answer: trimmedText,
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
        console.log(
          "📊 用户消息添加 - 之前:",
          prev.length,
          "之后:",
          newMessages.length,
        );
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

  // 初始加载：显示选择器
  useEffect(() => {
    setIsModelLoading(true);
    
    // 延迟关闭加载动画，然后显示选择对话框
    setTimeout(() => {
      setIsModelLoading(false);
      setShowModelSelector(true);
    }, 1000);
    
    return () => {
      model.current?.destroy();

      // 清理AudioContext
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // 清理预览模型
      previewModels.current.forEach(m => m?.destroy());
    };
  }, []);
  
  // 加载选中的模型
  useEffect(() => {
    if (!selectedModelPath) return;
    
    setIsModelLoading(true);
    import("l2d").then(({ init }) => {
      const l2d = init(l2dRef.current);
      l2d
        .create({
          path: selectedModelPath,
          scale: 0.3,
        })
        .then(async (res) => {
          model.current = res;
          setModelReady(true);

          // 加载MotionSync文件以支持口型同步
          try {
            // 尝试加载motionsync文件（如果存在）
            const motionSyncPath = selectedModelPath.replace(/\.model3?\.json$/, '.motionsync3.json');
            // 使用类型断言，因为l2d库的类型定义可能不完整
            if (typeof (res as any).loadMotionSyncFromUrl === 'function') {
              await (res as any).loadMotionSyncFromUrl(motionSyncPath);
              setMotionSyncLoaded(true);
              console.log("MotionSync文件加载成功");
            } else {
              console.warn("当前l2d版本不支持loadMotionSyncFromUrl方法");
              setMotionSyncLoaded(false);
            }
          } catch (error) {
            console.warn("MotionSync文件加载失败（可能不存在）:", error);
            setMotionSyncLoaded(false);
          }

          // 延迟关闭加载动画
          setTimeout(() => {
            setIsModelLoading(false);
          }, 1000);
          console.log("模型加载成功");
        })
        .catch((error) => {
          console.error("模型加载失败:", error);
          message.error("模型加载失败，请重试");
          setTimeout(() => {
            setIsModelLoading(false);
          }, 2000);
        });
    });
  }, [selectedModelPath]);

  // 组件卸载时，若仍在录制则自动停止并保存
  useEffect(() => {
    return () => {
      if (isRecording) stopScreen();
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

  // 处理模型选择
  const handleModelSelect = (modelPath: string) => {
    console.log("📌 用户选择了虚拟面试官:", modelPath);
    setSelectedModelPath(modelPath);
    setShowModelSelector(false);
    
    // 清理预览模型
    previewModels.current.forEach(m => m?.destroy());
    previewModels.current = [];
    
    message.success("已选择虚拟面试官，正在加载...");
    
    // 显示录屏确认对话框
    setTimeout(() => {
      console.log("📌 显示录屏设置对话框");
      setShowRecordingModal(true);
    }, 500);
  };
  
  // 加载预览模型
  const loadPreviewModels = async () => {
    try {
      const { init } = await import("l2d");
      const l2d = init(modelSelectorRef.current);
      
      const modelConfigs = [
        {
          path: "https://model.hacxy.cn/platelet_2/model.json",
          position: [-60, 20],
          scale: 0.18,
          name: "platelet_2"
        },
        {
          path: "https://model.hacxy.cn/shizuku/shizuku.model.json",
          position: [250, 20],
          scale: 0.18,
          name: "Shizuku"
        },
        {
          path: "https://model.hacxy.cn/hibiki/hibiki.model.json",
          position: [500, 20],
          scale: 0.18,
          name: "Hibiki"
        }
      ];
      
      for (const config of modelConfigs) {
        try {
          const model = await l2d.create({
            path: config.path,
            position: config.position as [number, number],
            scale: config.scale,
          });
          previewModels.current.push(model);
          console.log(`${config.name} 预览模型加载成功`);
        } catch (error) {
          console.error(`${config.name} 预览模型加载失败:`, error);
        }
      }
    } catch (error) {
      console.error("预览模型加载失败:", error);
    }
  };
  
  // 当选择器打开时加载预览模型
  useEffect(() => {
    if (showModelSelector && modelSelectorRef.current) {
      loadPreviewModels();
    }
  }, [showModelSelector]);

  return (
    <>
      <LoadingOverlay isVisible={isModelLoading} />
      <div className="interview-start-container">
        {/* 虚拟人选择对话框 */}
        <Modal
          title="选择您的AI面试官"
          open={showModelSelector}
          footer={null}
          closable={false}
          maskClosable={false}
          width={800}
          centered
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <Typography.Text type="secondary">
              请选择一位虚拟面试官陪伴您完成本次面试
            </Typography.Text>
          </div>
          
          <div style={{ height: "500px", marginBottom: "20px", position: "relative" }}>
            <canvas 
              ref={modelSelectorRef} 
              style={{ 
                width: "100%", 
                height: "100%",
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
                backgroundColor: "#fafafa"
              }} 
            />
          </div>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-around", 
            gap: "16px" 
          }}>
            <Button
              type="primary"
              size="large"
              style={{ flex: 1 }}
              onClick={() => handleModelSelect("https://model.hacxy.cn/platelet_2/model.json")}
            >
              选择 platelet_2
            </Button>
            <Button
              type="primary"
              size="large"
              style={{ flex: 1 }}
              onClick={() => handleModelSelect("https://model.hacxy.cn/shizuku/shizuku.model.json")}
            >
              选择 Shizuku
            </Button>
            <Button
              type="primary"
              size="large"
              style={{ flex: 1 }}
              onClick={() => handleModelSelect("https://model.hacxy.cn/hibiki/hibiki.model.json")}
            >
              选择 Hibiki
            </Button>
          </div>
        </Modal>
        
        <Modal
          title="面试录制设置"
          open={showRecordingModal}
          onOk={handleRecordingConfirm}
          onCancel={() => {
            console.log("📌 用户取消录屏设置");
            setRecordingEnabled(false);
            setShowRecordingModal(false);
            setRecordingSettingCompleted(true); // 取消时也标记为完成，允许WebSocket连接
            console.log("✅ 录屏设置已完成（取消），允许WebSocket连接");
            message.info("您已选择不录制面试过程");
          }}
          okText="确认"
          cancelText="取消"
          closable={false}
          maskClosable={false}
        >
          <div style={{ marginBottom: "20px" }}>
            <p>
              是否要录制本次面试过程？录制的视频将在面试结束后自动下载到您的设备。
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "15px",
              }}
            >
              <Switch
                checked={recordingEnabled}
                onChange={(checked) => setRecordingEnabled(checked)}
                style={{ marginRight: "10px" }}
              />
              <span>{recordingEnabled ? "开启录制" : "关闭录制"}</span>
            </div>
            <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
              提示：录制的视频将保存在您的浏览器默认下载位置
            </p>
            {recordingEnabled && (
              <div
                style={{
                  backgroundColor: "#f6f6f6",
                  padding: "10px",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              >
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  <strong>注意</strong>
                  ：录制开始时，您需要选择要共享的内容（整个屏幕、应用窗口或浏览器标签页）。
                  为了获得最佳效果，建议选择“整个屏幕”或当前浏览器窗口。
                </p>
              </div>
            )}
          </div>
        </Modal>

        <div className="layout-container">
          <div className="ai-panel">
            <div className="ai-header">
              <div
                className={`status-indicator ${wsConnected ? "connected" : connecting ? "connecting" : "disconnected"}`}
              ></div>
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
                <div
                  className={`stat-value ${scoreAnimation ? "score-animated" : ""}`}
                >
                  {interviewScore}分
                </div>
              </div>
            </div>
          </div>

          <div className="chat-area">
            <div className="chat-header">
              <div className="chat-heading">
                <span className="chat-badge">INTERVIEW CONTROL ROOM</span>
                <div className="chat-title">
                  <span>面试对话，</span>
                  <span>实时记录。</span>
                </div>
              </div>
            </div>

            <div className="conversation-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  {connecting ? (
                    <div className="empty-chat-message">
                      <Typography.Text type="secondary">
                        正在连接面试系统...
                      </Typography.Text>
                    </div>
                  ) : wsConnected ? (
                    <div className="empty-chat-message">
                      <Typography.Text type="secondary">
                        面试连接已建立，等待AI面试官提问...
                      </Typography.Text>
                    </div>
                  ) : (
                    <div className="empty-chat-message">
                      <Typography.Text type="secondary">
                        面试连接失败，请刷新页面重试
                      </Typography.Text>
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
                placeholder={!wsConnected ? "等待连接..." : !audioEnabled ? "请先开启麦克风" : "输入你的回答..."}
                disabled={!wsConnected}
                value={userInputText}
                onChange={(e) => setUserInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAnswer();
                  }
                }}
              />
              <div
                className={`voice-button ${isRecordingVoice ? "recording" : ""} ${!audioEnabled || !wsConnected ? "disabled" : ""}`}
                onClick={audioEnabled && wsConnected ? (isRecordingVoice ? stopVoice : startVoice) : undefined}
                title={
                  !wsConnected ? "请等待连接" : !audioEnabled ? "请先开启麦克风" : isRecordingVoice ? "点击停止语音识别" : "点击开始语音输入"
                }
              >
                <AudioTwoTone
                  twoToneColor={
                    isRecordingVoice
                      ? "#ff4d4f"
                      : audioEnabled
                        ? "#4f6ef2"
                        : "#999"
                  }
                />
              </div>
              <div
                className={`send-button ${!userInputText.trim() || !wsConnected ? "disabled" : ""}`}
                onClick={handleSendAnswer}
                title={
                  !wsConnected
                    ? "面试连接已断开"
                    : !userInputText.trim()
                      ? "请输入回答内容"
                      : "发送回答"
                }
              >
                <SendOutlined />
              </div>
            </div>
          </div>

          <div className="tools-panel">
            <div className="tools-section">
              <div className="section-title">个人信息</div>
              {loadingResume ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Typography.Text type="secondary">
                    加载简历信息中...
                  </Typography.Text>
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
                        {resumeData.resume.basic_info_name ||
                          loginUser.userName ||
                          "用户"}
                      </div>
                      <div className="user-position">
                        {resumeData.resume.job_target || "求职者"}
                      </div>
                    </div>
                  </div>

                  <div className="contact-info">
                    {resumeData.resume.basic_info_email && (
                      <div className="contact-item">
                        <MailOutlined
                          style={{ fontSize: "12px", color: "#666" }}
                        />
                        <Typography.Text style={{ fontSize: "12px" }}>
                          {resumeData.resume.basic_info_email}
                        </Typography.Text>
                      </div>
                    )}
                    {resumeData.resume.basic_info_phone && (
                      <div className="contact-item">
                        <PhoneOutlined
                          style={{ fontSize: "12px", color: "#666" }}
                        />
                        <Typography.Text style={{ fontSize: "12px" }}>
                          {resumeData.resume.basic_info_phone}
                        </Typography.Text>
                      </div>
                    )}
                    {resumeData.resume.basic_info_github && (
                      <div className="contact-item">
                        <GithubOutlined
                          style={{ fontSize: "12px", color: "#666" }}
                        />
                        <Typography.Text style={{ fontSize: "12px" }}>
                          GitHub
                        </Typography.Text>
                      </div>
                    )}
                    {resumeData.resume.basic_info_location && (
                      <div className="contact-item">
                        <EnvironmentOutlined
                          style={{ fontSize: "12px", color: "#666" }}
                        />
                        <Typography.Text style={{ fontSize: "12px" }}>
                          {resumeData.resume.basic_info_location}
                        </Typography.Text>
                      </div>
                    )}
                  </div>

                  {resumeData.resume.education &&
                    resumeData.resume.education.length > 0 && (
                      <div className="education-info">
                        <Typography.Text strong style={{ fontSize: "12px" }}>
                          教育背景
                        </Typography.Text>
                        <div style={{ marginTop: "4px" }}>
                          <Typography.Text
                            style={{ fontSize: "11px", color: "#666" }}
                          >
                            {resumeData.resume.education[0].university} -{" "}
                            {resumeData.resume.education[0].major}
                          </Typography.Text>
                        </div>
                      </div>
                    )}
                </Card>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Typography.Text type="secondary">
                    暂无简历信息
                  </Typography.Text>
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
                    <Button
                      type="primary"
                      size="small"
                      icon={<VideoCameraFilled />}
                      onClick={handleStartRecording}
                    >
                      开始录制
                    </Button>
                  ) : isRecording ? (
                    <Button danger size="small" onClick={stopScreen}>
                      停止录制
                    </Button>
                  ) : (
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: "12px" }}
                    >
                      录制已关闭
                    </Typography.Text>
                  )}
                </div>
              </div>

              <div className="user-video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`user-video ${!videoEnabled ? "hidden" : ""}`}
                />
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
                  <Tag color="blue" className="small-tag">
                    {interviewInfo.difficulty}
                  </Tag>
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

              <div className="section-title" style={{ marginTop: 16 }}>
                面试主题
              </div>
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
                  <Typography.Text
                    strong
                    style={{ color: "#4f6ef2", fontSize: "14px" }}
                  >
                    当前得分：{interviewScore}分
                  </Typography.Text>
                </div>
              </div>

              <Button
                type="primary"
                danger
                className="control-button"
                icon={<CloseCircleOutlined />}
                onClick={handleEndInterview}
              >
                结束面试
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
