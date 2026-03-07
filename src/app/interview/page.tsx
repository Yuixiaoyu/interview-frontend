"use client";
import "./index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UploadProps } from "antd";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  message,
  Modal,
  Progress,
  Spin,
  Typography,
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  RightOutlined,
  ScheduleOutlined,
  SmileOutlined,
  SoundOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  WarningOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { uploadFile, questionGet } from "@/api/fileController";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

const { Title, Paragraph, Text } = Typography;

// 设备测试状态类型
interface DeviceTestStatus {
  camera: 'waiting' | 'testing' | 'success' | 'error';
  microphone: 'waiting' | 'testing' | 'success' | 'error';
  lighting: 'waiting' | 'testing' | 'success' | 'warning' | 'error';
  network: 'success';
}

/**
 * AI面试页面
 * @returns InterViewPage
 */
export default function InterViewPage() {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const markdownRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHelper, setShowScrollHelper] = useState<boolean>(false);
  
  // 新增：模态框中的题目生成状态
  const [modalQuestionGenerating, setModalQuestionGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const router = useRouter();
  
  // 新增：用于存储轮询间隔ID和取消标志
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelGenerationRef = useRef(false);
  
  // 新增：设备测试相关状态
  const [deviceTestStatus, setDeviceTestStatus] = useState<DeviceTestStatus>({
    camera: 'waiting',
    microphone: 'waiting', 
    lighting: 'waiting',
    network: 'success'
  });
  
  // 新增：进度条状态
  const [currentStep, setCurrentStep] = useState(0); // 0: 上传简历, 1: 面试准备, 2: 开始面试
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // 确保在组件卸载时关闭SSE连接和清理轮询
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log("组件卸载，清理SSE连接");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // 清理轮询间隔
      if (pollIntervalRef.current) {
        console.log("组件卸载，清理轮询间隔");
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      // 清理媒体流
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream, audioStream]);

  // 滚动提示可见性控制
  const isNearBottom = useCallback((element: HTMLDivElement): boolean => {
    const threshold = 8;
    return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
  }, []);

  const updateScrollHelperVisibility = useCallback(() => {
    const container = markdownRef.current;
    if (!container) {
      setShowScrollHelper(false);
      return;
    }
    const isScrollable = container.scrollHeight > container.clientHeight + 1;
    const atBottom = isNearBottom(container);
    setShowScrollHelper(analyzing && isScrollable && !atBottom);
  }, [analyzing, isNearBottom]);

  useEffect(() => {
    updateScrollHelperVisibility();
  }, [analysisResult, showAnalysis, updateScrollHelperVisibility]);

  const handleMarkdownScroll = () => {
    updateScrollHelperVisibility();
  };

  // 新增：摄像头测试功能
  const testCamera = async () => {
    setDeviceTestStatus(prev => ({ ...prev, camera: 'testing' }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setVideoStream(stream);
      
      // 模拟测试过程
      setTimeout(() => {
        setDeviceTestStatus(prev => ({ ...prev, camera: 'success' }));
        message.success('摄像头测试成功！');
        // 停止视频流
        stream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }, 2000);
      
    } catch (error) {
      console.error('摄像头测试失败:', error);
      setDeviceTestStatus(prev => ({ ...prev, camera: 'error' }));
      message.error('摄像头测试失败，请检查摄像头权限');
    }
  };

  // 新增：麦克风测试功能
  const testMicrophone = async () => {
    setDeviceTestStatus(prev => ({ ...prev, microphone: 'testing' }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setAudioStream(stream);
      
      // 检测音频音量
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let volumeDetected = false;
      
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average > 10 && !volumeDetected) {
          volumeDetected = true;
          setDeviceTestStatus(prev => ({ ...prev, microphone: 'success' }));
          message.success('麦克风测试成功！');
          
          // 清理资源
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setAudioStream(null);
          return;
        }
        
        if (!volumeDetected) {
          requestAnimationFrame(checkVolume);
        }
      };
      
      checkVolume();
      
      // 5秒后如果还没检测到声音，认为测试失败
      setTimeout(() => {
        if (!volumeDetected) {
          setDeviceTestStatus(prev => ({ ...prev, microphone: 'error' }));
          message.error('未检测到麦克风输入，请检查麦克风权限或说话');
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setAudioStream(null);
        }
      }, 5000);
      
    } catch (error) {
      console.error('麦克风测试失败:', error);
      setDeviceTestStatus(prev => ({ ...prev, microphone: 'error' }));
      message.error('麦克风测试失败，请检查麦克风权限');
    }
  };

  // 新增：光线条件测试功能
  const testLighting = async () => {
    setDeviceTestStatus(prev => ({ ...prev, lighting: 'testing' }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        setTimeout(() => {
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let totalBrightness = 0;
            for (let i = 0; i < data.length; i += 4) {
              // 计算亮度 (RGB转灰度)
              const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
              totalBrightness += brightness;
            }
            
            const avgBrightness = totalBrightness / (data.length / 4);
            
            // 停止视频流
            stream.getTracks().forEach(track => track.stop());
            
            if (avgBrightness > 180) {
              setDeviceTestStatus(prev => ({ ...prev, lighting: 'warning' }));
              message.warning('光线过亮，建议调整灯光');
            } else if (avgBrightness < 80) {
              setDeviceTestStatus(prev => ({ ...prev, lighting: 'warning' }));
              message.warning('光线较暗，建议增加照明');
            } else {
              setDeviceTestStatus(prev => ({ ...prev, lighting: 'success' }));
              message.success('光线条件良好！');
            }
          }
        }, 1000);
      };
      
    } catch (error) {
      console.error('光线检测失败:', error);
      setDeviceTestStatus(prev => ({ ...prev, lighting: 'error' }));
      message.error('光线检测失败，请检查摄像头权限');
    }
  };

  // 新增：获取设备状态对应的Badge状态
  const getDeviceStatus = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'testing': return 'processing';
      default: return 'default';
    }
  };

  // 新增：获取设备测试按钮文本
  const getTestButtonText = (status: string, defaultText: string) => {
    switch (status) {
      case 'testing': return '测试中...';
      case 'success': return '重新测试';
      case 'error': return '重试';
      default: return defaultText;
    }
  };

  // 上传前检查文件类型
  const beforeUpload = (file: any) => {
    const isPDF = file.type === "application/pdf";
    const isDoc =
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPDF && !isDoc) {
      message.error("只支持上传 PDF 或 Word 文档!");
      return Upload.LIST_IGNORE;
    }

    // 更新文件信息
    setFileName(file.name);
    setFileSize(file.size);

    return true;
  };

  // 处理上传状态变化
  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "done") {
      message.success({
        content: `${info.file.name} 上传成功`,
        icon: <CheckCircleOutlined />,
        style: {
          marginTop: "20px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
        },
      });
      setResumeUploaded(true);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 自定义上传
  const customRequest = async ({ file, onSuccess, onError }: any) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 调用文件上传API
      const response = await uploadFile({ biz: "resume" }, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // response已经被拦截器处理过，直接返回的是服务器响应数据
      if (response && response.data) {
        const fileUrl = String(response.data);
        setFileUrl(fileUrl);
        if (onSuccess) {
          onSuccess("ok");
        }
        setResumeUploaded(true);
      } else {
        message.error("上传失败");
        if (onError) {
          onError(new Error("上传失败"));
        }
      }
    } catch (error: any) {
      message.error(error.message || "上传过程中出现错误");
      if (onError) {
        onError(error);
      }
    }
  };

  // 关闭模态框
  const handleCancel = () => {
    // 如果正在生成题目，取消生成
    if (modalQuestionGenerating) {
      handleModalCancelGeneration();
    }
    setIsModalOpen(false);
    // 重置模态框状态
    setCurrentStep(resumeUploaded ? 1 : 0);
    setModalQuestionGenerating(false);
    setGenerationProgress(0);
  };

  // 处理开始面试按钮点击
  const handleStartInterview = () => {
    showModal();
  };
  
  // 轮询检查题目生成状态
  const pollQuestionGeneration = async (): Promise<void> => {
    const maxAttempts = 60; // 最多尝试60次，每次间隔2秒，总共2分钟
    let attempts = 0;
    
    // 重置取消标志
    cancelGenerationRef.current = false;
    
    const checkQuestions = async (): Promise<boolean> => {
      try {
        const response = await questionGet();
        
        // 检查响应是否包含题目数据
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // 有题目数据，生成完成
          return true;
        }
        
        return false;
      } catch (error) {
        console.error("检查题目生成状态失败:", error);
        return false;
      }
    };
    
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        // 检查是否已取消
        if (cancelGenerationRef.current) {
          clearInterval(pollInterval);
          pollIntervalRef.current = null;
          console.log("题目生成已被用户取消");
          reject(new Error("用户取消了题目生成"));
          return;
        }
        
        attempts++;
        
        // 更新进度（渐进式增长，但不超过90%）
        setGenerationProgress((prev) => {
          const progressIncrement = Math.max(
            1,
            (90 - prev) / (maxAttempts - attempts + 1)
          );
          return Math.min(90, prev + progressIncrement);
        });
        
        try {
          const isComplete = await checkQuestions();
          
          if (isComplete) {
            // 题目生成完成，立即跳转
            clearInterval(pollInterval);
            pollIntervalRef.current = null;
            setGenerationProgress(100);
            
            if (!cancelGenerationRef.current) { // 确保未被取消
              setModalQuestionGenerating(false);
              message.success("题目生成完成，正在跳转...");
              router.push("/interview/start");
              resolve();
            }
            
            return;
          }
          
          if (attempts >= maxAttempts) {
            // 超时，停止轮询
            clearInterval(pollInterval);
            pollIntervalRef.current = null;
            setModalQuestionGenerating(false);
            reject(new Error("题目生成超时，请稍后重试"));
            return;
          }
          
        } catch (error) {
          clearInterval(pollInterval);
          pollIntervalRef.current = null;
          setModalQuestionGenerating(false);
          reject(error);
        }
      }, 2000); // 每2秒检查一次
      
      // 存储间隔ID以便后续清除
      pollIntervalRef.current = pollInterval;
    });
  };
  
  // 在模态框中开始面试的处理函数
  const handleModalStartInterview = async () => {
    if (!resumeUploaded) {
      message.warning("请先上传简历文件");
      return;
    }
    
    // 在模态框中显示生成动画
    setModalQuestionGenerating(true);
    setGenerationProgress(0);
    
    try {
      // 开始轮询检查题目生成状态
      await pollQuestionGeneration();
      
      // 生成完成后关闭模态框
      setIsModalOpen(false);
      setModalQuestionGenerating(false);
    } catch (error) {
      console.error("题目生成失败:", error);
      message.error("题目生成失败，请重试");
      setModalQuestionGenerating(false);
    }
  };
  
  // 取消模态框中的题目生成
  const handleModalCancelGeneration = () => {
    // 设置取消标志
    cancelGenerationRef.current = true;
    
    // 清除轮询间隔
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("已清除轮询间隔，停止向后端发送请求");
    }
    
    // 重置状态
    setModalQuestionGenerating(false);
    setGenerationProgress(0);
    message.info("已取消题目生成");
  };

  // 处理简历分析按钮点击
  const handleAnalyzeResume = async () => {
    if (!fileUrl) {
      message.warning("请先上传简历文件");
      return;
    }

    setAnalyzing(true);
    setAnalysisResult("");
    setShowAnalysis(true);
    setAnalysisError(false);

    try {
      // 创建SSE连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const apiUrl = `http://localhost:8811/api/analyze/fileStream?fileUrl=${encodeURIComponent(fileUrl)}`;
      const eventSource = new EventSource(apiUrl);
      eventSourceRef.current = eventSource;

      let fullText = "";
      let startReceivingData = false;

      // 监听消息
      eventSource.addEventListener("progress", (event) => {
        try {
          // 解析JSON数据
          const jsonData = JSON.parse(event.data);

          console.log("解析到的数据：", jsonData);
          
          if (jsonData && jsonData.content && (jsonData.node_is_finish==false)) {
            startReceivingData = true;
            fullText += jsonData.content;
            
            // 格式化文本，确保Markdown正确显示
            const formattedText = formatMarkdownText(fullText);
            setAnalysisResult(formattedText);
            
            // 滚动到底部
            setTimeout(() => {
              const resultElement = markdownRef.current;
              if (resultElement) {
                resultElement.scrollTop = resultElement.scrollHeight;
              }
              updateScrollHelperVisibility();
            }, 10);
          }
          
          // 如果节点完成，可以做额外处理，
          if (jsonData.node_is_finish) {
            // 将最后一次放回的数据放入的页面中
            fullText += jsonData.content;
            // 格式化文本，确保Markdown正确显示
            const formattedText = formatMarkdownText(fullText);
            setAnalysisResult(formattedText);
            // 可以在这里添加处理完成节点的逻辑
            console.log("节点完成:", jsonData.node_title);
            console.log("服务端表示传输完成");
            eventSource.close();
            eventSourceRef.current = null;
            setAnalyzing(false);
            setShowScrollHelper(false);
          }
        } catch (error) {
          console.error("解析SSE数据出错:", error);
        }
      });

      // 监听常规消息
      eventSource.onmessage = (event) => {
        const data = event.data;
        if (data === "[DONE]" || data.includes("done") || data === "undefined") {
          console.log("接收到结束信号:", data);
          eventSource.close();
          eventSourceRef.current = null;
          setAnalyzing(false);
          setShowScrollHelper(false);
        }
      };

      // 监听错误
      eventSource.onerror = (error) => {
        // 如果是流结束导致的错误，不显示错误消息
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log("SSE连接已关闭");
          eventSource.close();
          eventSourceRef.current = null;
          setAnalyzing(false);
          setShowScrollHelper(false);
          return;
        }
        
        // 如果已经接收到了数据，可能是正常结束
        if (startReceivingData && fullText.length > 0) {
          console.log("SSE连接结束，已接收数据");
          eventSource.close();
          eventSourceRef.current = null;
          setAnalyzing(false);
          setShowScrollHelper(false);
          return;
        }
        
        console.error("SSE错误:", error);
        eventSource.close();
        eventSourceRef.current = null;
        setAnalyzing(false);
        setShowScrollHelper(false);
        setAnalysisError(true);
        message.error("分析过程中出现错误，请重试");
      };

      // 监听连接关闭
      eventSource.addEventListener("close", () => {
        console.log("SSE连接关闭事件触发");
        eventSource.close();
        eventSourceRef.current = null;
        setAnalyzing(false);
        setShowScrollHelper(false);
      });
      
      // 5秒后，如果没有收到任何数据，显示提示
      const timeoutId = setTimeout(() => {
        if (!startReceivingData) {
          setAnalysisResult("正在分析中，请耐心等待...");
        }
      }, 5000);
      
      // 添加组件卸载时清理
      return () => {
        clearTimeout(timeoutId);
        if (eventSourceRef.current) {
          console.log("组件卸载，关闭SSE连接");
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    } catch (error) {
      console.error("分析简历错误:", error);
      setAnalyzing(false);
      setAnalysisError(true);
      message.error("启动分析时出现错误");
    }
  };
  
  // 格式化Markdown文本
  const formatMarkdownText = (text: string): string => {
    // 处理未完成的Markdown标记
    let formattedText = text;
    
    // 确保代码块正确闭合
    const codeBlockCount = (text.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      formattedText += "\n```";
    }
    
    // 确保列表项格式正确
    const lines = formattedText.split("\n");
    const lastLine = lines[lines.length - 1];
    if (lastLine.match(/^(\s*)[*-]\s+/) && !lastLine.trim().endsWith(".") && !lastLine.trim().endsWith("。")) {
      lines[lines.length - 1] = lastLine + "...";
      formattedText = lines.join("\n");
    }
    
    return formattedText;
  };

  // 打开文件预览
  const handleOpenPreview = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  // 计算文件大小的显示格式
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return size + " B";
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + " KB";
    } else {
      return (size / (1024 * 1024)).toFixed(2) + " MB";
    }
  };

  // 面试注意事项
  const interviewTips = [
    {
      icon: <SmileOutlined />,
      title: "保持自然表情",
      description: "微笑是最好的面试状态，避免表情僵硬",
    },
    {
      icon: <SoundOutlined />,
      title: "语速清晰适中",
      description: "保持语言清晰、有条理",
    },
    {
      icon: <VideoCameraOutlined />,
      title: "注意摄像头位置",
      description: "确保摄像头在眼睛水平位置",
    },
    {
      icon: <WarningOutlined />,
      title: "避免频繁走神",
      description: "AI会分析注意力集中程度",
    },
  ];

  // 智能面试助手步骤
  const interviewSteps = [
    {
      icon: <FileTextOutlined />,
      title: "上传简历",
      description: "上传最新简历",
      done: resumeUploaded,
    },
    {
      icon: <InfoCircleOutlined />,
      title: "准备环境",
      description: "安静、光线充足",
      done: false,
    },
    {
      icon: <VideoCameraOutlined />,
      title: "设备测试",
      description: "检查摄像头和麦克风",
      done: false,
    },
    {
      icon: <RightOutlined />,
      title: "开始面试",
      description: "进入AI模拟面试",
      done: false,
    },
  ];

  // 面试统计数据
  const statsData = [
    { title: "已完成面试", value: "1,240+", icon: <ScheduleOutlined /> },
    { title: "面试问题库", value: "5,600+", icon: <FileTextOutlined /> },
    { title: "平均准确率", value: "96%", icon: <CheckCircleOutlined /> },
  ];

  // 修改Modal打开时的逻辑，设置进度条状态
  const showModal = () => {
    setCurrentStep(resumeUploaded ? 1 : 0);
    setIsModalOpen(true);
  };

  // 新增：当所有设备测试完成时，自动进入下一步
  useEffect(() => {
    if (isModalOpen && currentStep === 1) {
      const { camera, microphone, lighting } = deviceTestStatus;
      if (camera !== 'waiting' && microphone !== 'waiting' && lighting !== 'waiting') {
        // 所有测试完成，进入下一步
        setTimeout(() => {
          setCurrentStep(2);
        }, 1000);
      }
    }
  }, [deviceTestStatus, isModalOpen, currentStep]);

  const handleScrollToUpload = () => {
    document.getElementById("resume-upload-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleScrollToJourney = () => {
    document.getElementById("journey-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const completedDeviceChecks = [
    deviceTestStatus.camera,
    deviceTestStatus.microphone,
    deviceTestStatus.lighting,
  ].filter((status) => status === "success" || status === "warning").length;

  const readinessPercent = Math.min(
    100,
    Math.round((resumeUploaded ? 38 : 8) + (completedDeviceChecks / 3) * 62)
  );

  const readinessLabel = !resumeUploaded
    ? "上传简历后解锁专属问题路径"
    : completedDeviceChecks === 3
      ? "环境已就绪，可直接开始模拟"
      : `还需完成 ${3 - completedDeviceChecks} 项设备确认`;

  const secondaryHeroAction = resumeUploaded
    ? handleAnalyzeResume
    : handleScrollToJourney;
  const secondaryHeroLabel = resumeUploaded ? "查看简历洞察" : "查看准备流程";
  const displayFileSize = fileSize ? formatFileSize(fileSize) : "--";
  
  return (
    <div id="interviewPage">
      <div className="interview-container">
        <section className="hero-panel">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="hero-kicker-dot" />
              AI Interview Studio
            </div>
            <Title level={1} className="hero-title">
              <span className="hero-title-line">用更有临场感的模拟面试，</span>
              <span className="hero-title-line hero-title-accent">把真实上场前的状态先练熟。</span>
            </Title>
            <Paragraph className="hero-description">
              上传简历后，系统会自动生成与你经历匹配的问题脚本，结合环境检测与简历洞察，帮你在正式面试前把表达节奏、镜头状态与项目叙事都调整到最佳。
            </Paragraph>
            <div className="hero-chip-list">
              <div className="hero-chip">个性化题目生成</div>
              <div className="hero-chip">多维环境就绪检测</div>
              <div className="hero-chip">实时简历洞察反馈</div>
            </div>
            <div className="hero-actions">
              <Button
                type="primary"
                className="hero-button hero-button-primary"
                onClick={resumeUploaded ? handleStartInterview : handleScrollToUpload}
              >
                {resumeUploaded ? "立即开始模拟" : "上传简历开始"}
              </Button>
              <Button
                className="hero-button hero-button-secondary"
                onClick={secondaryHeroAction}
                loading={resumeUploaded ? analyzing : false}
                disabled={resumeUploaded ? analyzing : false}
              >
                {secondaryHeroLabel}
              </Button>
            </div>
          </div>

          <div className="hero-aside">
            <div className="readiness-card">
              <div className="readiness-ring">
                <div className="readiness-core">
                  <span className="readiness-caption">面试就绪度</span>
                  <span className="readiness-value">{readinessPercent}%</span>
                  <span className="readiness-label">{readinessLabel}</span>
                </div>
              </div>

              <div className="hero-signal-list">
                {statsData.map((stat) => (
                  <div className="hero-signal-item" key={stat.title}>
                    <div className="hero-signal-icon">{stat.icon}</div>
                    <div>
                      <div className="hero-signal-value">{stat.value}</div>
                      <div className="hero-signal-title">{stat.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="main-section">
          <div className="info-section">
            <section className="section-card flow-wrapper" id="journey-panel">
              <div className="section-header">
                <div>
                  <span className="section-tag">Journey</span>
                  <div className="section-title">
                    <InfoCircleOutlined className="section-icon" />
                    <span>面试旅程</span>
                  </div>
                </div>
                <Paragraph className="section-note">
                  先同步简历，再完成环境确认，最后进入基于经历与项目背景的 AI 模拟面试。
                </Paragraph>
              </div>

              <div className="journey-grid">
                {interviewSteps.map((step, index) => (
                  <div
                    className={`journey-card ${step.done ? "is-complete" : ""}`}
                    key={step.title}
                  >
                    <div className="journey-order">{`0${index + 1}`}</div>
                    <div className={`journey-icon ${step.done ? "is-complete" : ""}`}>
                      {step.icon}
                    </div>
                    <div className="journey-body">
                      <div className="journey-title-row">
                        <span className="journey-title">{step.title}</span>
                        <span className={`journey-status ${step.done ? "done" : ""}`}>
                          {step.done ? "已完成" : "待进行"}
                        </span>
                      </div>
                      <div className="journey-description">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-card tips-wrapper">
              <div className="section-header">
                <div>
                  <span className="section-tag">Coach Notes</span>
                  <div className="section-title">
                    <WarningOutlined className="section-icon" />
                    <span>作答与镜头建议</span>
                  </div>
                </div>
                <Paragraph className="section-note">
                  提前把视线、语速和回答结构调顺，能让 AI 反馈更稳定，也更贴近真实面试节奏。
                </Paragraph>
              </div>

              <div className="advice-grid">
                {interviewTips.map((tip) => (
                  <div className="advice-card" key={tip.title}>
                    <div className="advice-icon">{tip.icon}</div>
                    <div className="advice-title">{tip.title}</div>
                    <div className="advice-description">{tip.description}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-card stats-wrapper">
              <div className="section-header compact">
                <div>
                  <span className="section-tag">Signals</span>
                  <div className="section-title small">
                    <ScheduleOutlined className="section-icon" />
                    <span>平台面试数据</span>
                  </div>
                </div>
                <Paragraph className="section-note">
                  题库与反馈样本持续迭代，帮助你更快找到正式面试中最需要强化的表达重点。
                </Paragraph>
              </div>

              <div className="stats-items">
                {statsData.map((stat) => (
                  <div className="stat-item" key={stat.title}>
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-title">{stat.title}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="upload-section" id="resume-upload-panel">
            <div className="upload-panel-top">
              <div className="upload-panel-copy">
                <span className="section-tag">Resume Sync</span>
                <div className="section-title">
                  <FileTextOutlined className="section-icon" />
                  <span>简历上传与启动台</span>
                </div>
                <Text className="upload-panel-description">
                  上传后即可解锁专属题目生成、AI 简历分析与正式模拟面试入口。
                </Text>
              </div>

              <div className="upload-readiness-badge">
                <span className="upload-readiness-label">当前状态</span>
                <strong>{resumeUploaded ? "已同步简历" : "等待上传"}</strong>
              </div>
            </div>

            {!resumeUploaded ? (
              <div className="upload-dropzone">
                <div className="upload-orbit">
                  <UploadOutlined />
                </div>
                <Upload
                  maxCount={1}
                  beforeUpload={beforeUpload}
                  onChange={handleChange}
                  customRequest={customRequest}
                  accept=".pdf,.doc,.docx"
                  className="upload-component"
                >
                  <Button icon={<UploadOutlined />} className="upload-button">
                    选择文件上传
                  </Button>
                  <Text className="upload-hint">支持 PDF、Word 文档</Text>
                </Upload>

                <div className="upload-support-grid">
                  <div className="support-card">
                    <span className="support-label">支持格式</span>
                    <strong>PDF / DOCX</strong>
                  </div>
                  <div className="support-card">
                    <span className="support-label">预计体验</span>
                    <strong>15 - 20 min</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="upload-success-card">
                <div className="upload-success-head">
                  <CheckCircleOutlined className="success-icon" />
                  <div className="success-content">
                    <Text strong className="success-text">
                      简历已同步完成
                    </Text>
                    <Text className="success-subtext">
                      AI 会基于当前简历内容生成更贴合经历的问题路径。
                    </Text>
                  </div>
                </div>

                <Progress percent={100} status="success" size="small" />

                <div className="upload-meta-grid">
                  <div className="upload-meta-item">
                    <span className="upload-meta-label">文件名称</span>
                    <strong className="upload-meta-value">{fileName}</strong>
                  </div>
                  <div className="upload-meta-item">
                    <span className="upload-meta-label">文件大小</span>
                    <strong className="upload-meta-value">{displayFileSize}</strong>
                  </div>
                </div>

                <div className="file-actions">
                  <Button
                    type="link"
                    onClick={handleOpenPreview}
                    className="preview-button"
                  >
                    查看文件
                  </Button>
                </div>
              </div>
            )}

            <div className="upload-hint-list">
              <div className="upload-hint-item">
                <InfoCircleOutlined className="info-icon" />
                <span>系统会根据项目、技能与经历关键词生成更聚焦的问题路径。</span>
              </div>
              <div className="upload-hint-item">
                <SoundOutlined className="info-icon" />
                <span>开始模拟前建议先完成设备检测，提升识别准确率与整体体验。</span>
              </div>
              <div className="upload-hint-item">
                <FileSearchOutlined className="info-icon" />
                <span>可先查看简历分析，再针对薄弱点做专项强化练习。</span>
              </div>
            </div>

            {resumeUploaded && (
              <div className="action-button-container">
                <Button
                  type="primary"
                  className="start-button"
                  onClick={handleStartInterview}
                >
                  立即开始面试
                </Button>
                <Button
                  type="primary"
                  className="analyze-button"
                  icon={<FileSearchOutlined />}
                  onClick={handleAnalyzeResume}
                  loading={analyzing}
                  disabled={analyzing}
                >
                  简历分析
                </Button>
              </div>
            )}
          </aside>
        </div>

        {showAnalysis && (
          <section className="analysis-section">
            <div className="analysis-header-strip">
              <div>
                <span className="section-tag">AI Insight</span>
                <Title level={2} className="analysis-title">
                  简历分析结果
                </Title>
              </div>
              <Text className="analysis-header-note">
                {analyzing
                  ? "洞察正在持续生成，内容会以流式方式实时补全。"
                  : "分析完成后，可据此优化项目表述、回答重点与面试叙事。"}
              </Text>
            </div>

            <Card
              title={
                <div className="analysis-card-title">
                  <FileSearchOutlined className="section-icon" />
                  <div className="analysis-card-title-copy">
                    <span className="analysis-card-title-label">智能简历洞察</span>
                    <span className="analysis-card-title-subtitle">
                      {analyzing ? "实时生成中" : "已生成完成，可继续复盘"}
                    </span>
                  </div>
                  {analyzing && <Spin size="small" style={{ marginLeft: "10px" }} />}
                </div>
              }
              className="analysis-card"
              extra={
                  <Button 
                    type="link" 
                    onClick={() => {
                      if (analyzing && eventSourceRef.current) {
                        eventSourceRef.current.close();
                      setAnalyzing(false);
                    }
                    setShowAnalysis(false);
                  }}
                  style={{ fontSize: '14px' }}
                >
                  关闭
                </Button>
              }
            >
              {!analysisResult && analyzing ? (
                <div className="analyzing-initial">
                  <Spin size="large" />
                  <p>正在开始分析简历，请稍候...</p>
                </div>
              ) : analysisResult ? (
                <div className="markdown-result-container">
                  <div className="markdown-result" ref={markdownRef} onScroll={handleMarkdownScroll}>
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    {analyzing && (
                      <div className="analyzing-indicator">
                        <Spin size="small" />
                      </div>
                    )}
                  </div>
                  {showScrollHelper && (
                    <div className="scroll-helper">向下滚动查看更多内容</div>
                  )}
                </div>
              ) : analysisError ? (
                <div className="analysis-error">
                  <Alert
                    message="分析出错"
                    description="简历分析过程中遇到错误，请稍后重试。"
                    type="error"
                    showIcon
                  />
                  <Button 
                    style={{ marginTop: '15px' }} 
                    onClick={handleAnalyzeResume}
                    type="primary"
                  >
                    重新分析
                  </Button>
                </div>
              ) : (
                <Empty description="暂无分析结果" />
              )}
            </Card>
          </section>
        )}
      </div>

      {/* 确认模态框 */}
      <Modal
        title={
          <div className="modal-title">
            <VideoCameraOutlined className="modal-icon" />
            <span>准备开始面试</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
        centered
        className="interview-modal"
      >
        <div className="modal-content">
          {/* 题目生成覆盖层 */}
          {modalQuestionGenerating && (
            <div className="modal-generating-overlay">
              <div className="generating-content">
                <Spin size="large" />
                <div className="generating-text">
                  <div className="generating-title">AI正在为您生成面试题目</div>
                  <div className="generating-subtitle">请耐心等待，题目将根据您的简历内容个性化定制</div>
                  <Progress 
                    percent={Math.floor(generationProgress)} 
                    status={generationProgress >= 100 ? "success" : "active"}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    style={{ marginTop: '16px' }}
                  />
                  <div className="progress-info">
                    <Text type="secondary">
                      {Math.floor(generationProgress)}% 已完成
                    </Text>
                  </div>
                  <Button 
                    type="link" 
                    onClick={handleModalCancelGeneration}
                    style={{ marginTop: '16px' }}
                  >
                    取消生成
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="modal-summary">
            <div className="modal-summary-copy">
              <span className="section-tag">Checklist</span>
              <p>
                开始前完成设备与环境确认，系统会根据简历内容生成本场专属问题，并在过程里持续记录你的表现信号。
              </p>
            </div>
            <div className="modal-summary-badge">
              <span>当前准备度</span>
              <strong>{readinessPercent}%</strong>
            </div>
          </div>

          {/* 进度指示器 */}
          <div className="modal-progress">
            <div className={`progress-step ${currentStep >= 0 ? 'active' : ''}`}>
              <div className="step-icon">
                {resumeUploaded ? <CheckCircleOutlined /> : <LoadingOutlined spin />}
              </div>
              <div className="step-text">上传简历</div>
            </div>
            <div className={`progress-line ${currentStep >= 1 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-icon">
                {currentStep >= 2 ? <CheckCircleOutlined /> : 
                 currentStep === 1 ? <LoadingOutlined spin /> : <InfoCircleOutlined />}
              </div>
              <div className="step-text">面试准备</div>
            </div>
            <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-icon">
                {currentStep >= 2 ? <VideoCameraOutlined /> : <VideoCameraOutlined />}
              </div>
              <div className="step-text">开始面试</div>
            </div>
          </div>
          
          {/* 环境检查 */}
          <div className="check-section">
            <div className="check-title">
              <SoundOutlined /> 环境检查
            </div>
            <div className="check-grid">
              <div className="check-item">
                <Badge status={getDeviceStatus(deviceTestStatus.camera)} text="摄像头" />
                <Button 
                  size="small" 
                  type="link" 
                  onClick={testCamera}
                  disabled={deviceTestStatus.camera === 'testing'}
                >
                  {getTestButtonText(deviceTestStatus.camera, '测试')}
                </Button>
              </div>
              <div className="check-item">
                <Badge status={getDeviceStatus(deviceTestStatus.microphone)} text="麦克风" />
                <Button 
                  size="small" 
                  type="link" 
                  onClick={testMicrophone}
                  disabled={deviceTestStatus.microphone === 'testing'}
                >
                  {getTestButtonText(deviceTestStatus.microphone, '测试')}
                </Button>
              </div>
              <div className="check-item">
                <Badge status={getDeviceStatus(deviceTestStatus.network)} text="网络连接" />
                <Progress percent={100} size="small" showInfo={false} />
              </div>
              <div className="check-item">
                <Badge status={getDeviceStatus(deviceTestStatus.lighting)} text="光线条件" />
                <Button 
                  size="small" 
                  type="link" 
                  onClick={testLighting}
                  disabled={deviceTestStatus.lighting === 'testing'}
                >
                  {getTestButtonText(deviceTestStatus.lighting, '检查')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* 面试提示卡片 */}
          <Card className="tips-card">
            <div className="tips-header">
              <WarningOutlined /> 面试注意事项
            </div>
            
            <div className="tips-columns">
              <div className="tips-column">
                <div className="tip-item">
                  <div className="tip-icon"><SmileOutlined /></div>
                  <div className="tip-info">
                    <div className="tip-title">自然表情</div>
                    <div className="tip-desc">保持微笑和自信，AI会分析您的面部表情</div>
                  </div>
                </div>
                
                <div className="tip-item">
                  <div className="tip-icon"><SoundOutlined /></div>
                  <div className="tip-info">
                    <div className="tip-title">语速清晰</div>
                    <div className="tip-desc">保持适中语速，避免口头禅和语气词</div>
                  </div>
                </div>
              </div>
              
              <div className="tips-column">
                <div className="tip-item">
                  <div className="tip-icon"><InfoCircleOutlined /></div>
                  <div className="tip-info">
                    <div className="tip-title">回答逻辑</div>
                    <div className="tip-desc">回答问题时保持条理性和逻辑性</div>
                  </div>
                </div>
                
                <div className="tip-item">
                  <div className="tip-icon"><VideoCameraOutlined /></div>
                  <div className="tip-info">
                    <div className="tip-title">注视摄像头</div>
                    <div className="tip-desc">保持专注，避免频繁走神和看向他处</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* 面试信息 */}
          <div className="interview-info">
            <div className="info-item">
              <ScheduleOutlined /> <span>面试时长：</span> 约15-20分钟
            </div>
            <div className="info-item">
              <FileTextOutlined /> <span>问题数量：</span> 10-15个问题
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-actions">
              <Button 
                onClick={handleCancel}
                disabled={modalQuestionGenerating}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                size="large" 
                className="modal-button"
                onClick={handleModalStartInterview}
                loading={modalQuestionGenerating}
                disabled={modalQuestionGenerating}
              >
                <VideoCameraOutlined /> 
                {modalQuestionGenerating ? "题目生成中..." : "开始面试"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* 全屏题目生成加载覆盖层（已移除） */}
    </div>
  );
}
