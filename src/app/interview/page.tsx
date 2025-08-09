"use client";
import "./index.css";
import { useRef, useState, useEffect } from "react";
import type { UploadProps } from "antd";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  List,
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
import Link from "next/link";
import { uploadFile } from "@/api/fileController";
import ReactMarkdown from "react-markdown";

const { Title, Paragraph, Text } = Typography;

// 预览文件类型定义
interface PreviewFileType {
  fileName: string;
  publicFileUrl: string;
}

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
  const [previewFile, setPreviewFile] = useState<PreviewFileType | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // 新增：设备测试相关状态
  const [deviceTestStatus, setDeviceTestStatus] = useState<DeviceTestStatus>({
    camera: 'waiting',
    microphone: 'waiting', 
    lighting: 'waiting',
    network: 'success'
  });
  
  // 新增：进度条状态
  const [currentStep, setCurrentStep] = useState(0); // 0: 上传简历, 1: 面试准备, 2: 开始面试
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // 确保在组件卸载时关闭SSE连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log("组件卸载，清理SSE连接");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
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
      const response = await uploadFile({ biz: "interview" }, formData, {
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

        // 设置预览文件
        setPreviewFile({
          fileName: file.name,
          publicFileUrl: fileUrl,
        });
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
    setIsModalOpen(false);
  };

  // 处理开始面试按钮点击
  const handleStartInterview = () => {
    showModal();
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
              const resultElement = document.querySelector('.markdown-result');
              if (resultElement) {
                resultElement.scrollTop = resultElement.scrollHeight;
              }
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
          return;
        }
        
        // 如果已经接收到了数据，可能是正常结束
        if (startReceivingData && fullText.length > 0) {
          console.log("SSE连接结束，已接收数据");
          eventSource.close();
          eventSourceRef.current = null;
          setAnalyzing(false);
          return;
        }
        
        console.error("SSE错误:", error);
        eventSource.close();
        eventSourceRef.current = null;
        setAnalyzing(false);
        setAnalysisError(true);
        message.error("分析过程中出现错误，请重试");
      };

      // 监听连接关闭
      eventSource.addEventListener("close", () => {
        console.log("SSE连接关闭事件触发");
        eventSource.close();
        eventSourceRef.current = null;
        setAnalyzing(false);
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

  // 关闭预览模态框
  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  // 打开预览模态框
  const handleOpenPreview = () => {
    if (fileUrl && fileName) {
      setPreviewFile({
        fileName: fileName,
        publicFileUrl: fileUrl,
      });
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

  return (
    <div id="interviewPage">
      <div className="interview-container">
        {/* 头部区域 */}
        <div className="interview-header">
          <Badge.Ribbon text="智能推荐" color="#7C3AED">
            <Title level={3}>AI 智能模拟面试</Title>
          </Badge.Ribbon>
          <Paragraph className="interview-subtitle">
            利用人工智能技术，模拟真实面试场景，提供专业反馈，助你成功应对各类技术面试
          </Paragraph>
        </div>

        {/* 主要内容区域 */}
        <div className="main-section">
          {/* 左侧：步骤和提示区 */}
          <div className="info-section">
            {/* 面试流程 */}
            <div className="flow-wrapper">
              <div className="section-title">
                <InfoCircleOutlined className="section-icon" />
                <span>面试流程</span>
              </div>

              <div className="flow-steps">
                {interviewSteps.map((step, index) => (
                  <div className="flow-step" key={index}>
                    <div
                      className={`flow-step-icon ${step.done ? "step-done" : ""}`}
                    >
                      {step.icon}
                    </div>
                    <div className="flow-step-info">
                      <div className="flow-step-title">{step.title}</div>
                      <div className="flow-step-desc">{step.description}</div>
                    </div>
                    {index < interviewSteps.length - 1 && (
                      <div className="flow-step-arrow">
                        <RightOutlined />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 面试须知 */}
            <div className="tips-wrapper">
              <div className="section-title">
                <WarningOutlined className="section-icon" />
                <span>面试须知</span>
              </div>

              <div className="tips-list">
                {interviewTips.map((tip, index) => (
                  <div className="tip-item" key={index}>
                    <div className="tip-icon">{tip.icon}</div>
                    <div className="tip-content">
                      <div className="tip-title">{tip.title}</div>
                      <div className="tip-description">{tip.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 数据统计 */}
            <div className="stats-wrapper">
              <div className="section-title small">
                <InfoCircleOutlined className="section-icon" />
                <span>面试数据</span>
              </div>

              <div className="stats-items">
                {statsData.map((stat, index) => (
                  <div className="stat-item" key={index}>
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-title">{stat.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：上传和操作区 */}
          <div className="upload-section">
            <div className="section-title">
              <FileTextOutlined className="section-icon" />
              <span>简历上传</span>
            </div>

            <div className="info-message">
              <InfoCircleOutlined className="info-icon" />
              <Text className="info-text">
                AI将根据您的简历内容生成个性化面试问题
              </Text>
            </div>

            {!resumeUploaded ? (
              <div className="upload-wrapper">
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
                  <Text type="secondary" className="upload-hint">
                    支持 PDF、Word 文档
                  </Text>
                </Upload>
              </div>
            ) : (
              <div className="upload-success">
                <CheckCircleOutlined className="success-icon" />
                <div className="success-content">
                  <Text strong className="success-text">
                    简历上传成功!
                  </Text>
                  <Progress percent={100} status="success" size="small" />
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
          </div>
        </div>

        {/* 简历分析结果区域 */}
        {showAnalysis && (
          <div className="analysis-section">
            <Card
              title={
                <div className="section-title">
                  <FileSearchOutlined className="section-icon" />
                  <span>简历分析结果 {analyzing && <Spin size="small" style={{ marginLeft: '10px' }} />}</span>
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
                  <div className="markdown-result">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    {analyzing && (
                      <div className="analyzing-indicator">
                        <Spin size="small" />
                      </div>
                    )}
                  </div>
                  <div className="scroll-helper">向下滚动查看更多内容</div>
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
          </div>
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
              <Button onClick={handleCancel}>取消</Button>
              <Link href="/interview/start">
                <Button type="primary" size="large" className="modal-button">
                  <VideoCameraOutlined /> 开始面试
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
