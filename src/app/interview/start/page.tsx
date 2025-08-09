"use client";
import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
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
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
  VideoCameraFilled,
  VideoCameraOutlined,
} from "@ant-design/icons";
import "./index.css";
import type { Model } from "l2d";

const { Title, Text } = Typography;

// 为WebKit AudioContext添加类型定义
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * 开始面试页面
 */
export default function InterviewStartPage() {
  // 视频流和音频流状态
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // PCM录音相关
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentNodeRef = useRef<GainNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [userInputText, setUserInputText] = useState(""); // 用户输入的文本
  const [finalRecognizedText, setFinalRecognizedText] = useState(""); // 最终识别的文本
  const [interimRecognizedText, setInterimRecognizedText] = useState(""); // 临时识别的文本

  // 音频配置常量
  const SAMPLE_RATE = 16000; // 采样率 16kHz
  const CHANNELS = 1;      // 单声道
  const BUFFER_SIZE = 4096; // 缓冲区大小

  // 录屏相关状态
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(true); // 默认启用录制
  const [showRecordingModal, setShowRecordingModal] = useState(true); // 显示录制确认对话框
  const recordingStream = useRef<MediaStream | null>(null);

  // 视频元素引用
  const videoRef = useRef<HTMLVideoElement>(null);

  // 消息框引用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 对话记录
  const [messages, setMessages] = useState<
    Array<{
      content: string;
      isAI: boolean;
      timestamp: Date;
    }>
  >([
    {
      content:
        "你好，我是AI面试官。今天我将对你进行Web前端开发工程师岗位的面试。请做好准备，我们即将开始。",
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
    const timer = setInterval(() => {
      setInterviewTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化时间显示
  const formatInterviewTime = () => {
    const minutes = Math.floor(interviewTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (interviewTime % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds} / 30:00`;
  };

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 处理录制确认
  const handleRecordingConfirm = () => {
    setShowRecordingModal(false);
    if (recordingEnabled) {
      // 延迟一小段时间再开始录制，避免与对话框动画冲突
      setTimeout(() => {
        startScreenRecording(videoStream, audioStream);
      }, 300);
    } else {
      message.info("您已选择不录制面试过程");
    }
  };

  // 开始录屏
  const startScreenRecording = async (
    videoStreamObj: MediaStream | null,
    audioStreamObj: MediaStream | null,
  ) => {
    try {
      // 获取屏幕流
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // 合并音频流（如果有）
      let combinedStream: MediaStream;
      const screenTrack = displayStream.getVideoTracks()[0];

      // 创建一个独立的音频上下文来处理音频
      let audioContext: AudioContext | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;

      // 如果有音频流，使用音频上下文处理
      if (audioStreamObj && audioStreamObj.getAudioTracks().length > 0) {
        try {
          audioContext = new AudioContext();
          audioDestination = audioContext.createMediaStreamDestination();
          const audioSource =
            audioContext.createMediaStreamSource(audioStreamObj);
          audioSource.connect(audioDestination);

          // 合并屏幕视频和音频
          combinedStream = new MediaStream([
            screenTrack,
            ...audioDestination.stream.getAudioTracks(),
          ]);
        } catch (audioError) {
          console.warn("无法处理音频，将只录制屏幕:", audioError);
          combinedStream = new MediaStream([screenTrack]);
        }
      } else {
        combinedStream = new MediaStream([screenTrack]);
      }

      recordingStream.current = combinedStream;

      // 清空之前可能存在的录制数据
      setRecordedChunks([]);

      // 尝试使用不同的MIME类型，提高兼容性
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "";
          }
        }
      }

      // 创建MediaRecorder实例
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 2500000, // 设置较高的比特率
      });

      // 存储录制的数据
      recorder.ondataavailable = (event) => {
        console.log("收到数据块:", event.data.size);
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      // 录制结束时保存视频
      recorder.onstop = () => {
        console.log("MediaRecorder已停止");
        // 在onstop事件中不再直接调用saveRecording，
        // 而是在stopScreenRecording函数中调用

        // 关闭音频上下文
        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }
      };

      // 开始录制，每500毫秒生成一个数据块
      recorder.start(500);
      setMediaRecorder(recorder);
      setIsRecording(true);
      message.success("面试录屏已开始");

      // 监听屏幕共享结束事件
      screenTrack.onended = () => {
        console.log("屏幕共享已结束");
        stopScreenRecording();
      };
    } catch (error) {
      console.error("录屏失败:", error);
      message.error("录屏功能启动失败");
    }
  };

  // 手动开始录屏
  const handleStartRecording = () => {
    if (!isRecording) {
      startScreenRecording(videoStream, audioStream);
    }
  };

  // 停止录屏
  const stopScreenRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      // 先收集最后的数据片段
      mediaRecorder.requestData();

      // 然后停止录制
      mediaRecorder.stop();
      setIsRecording(false);

      // 停止所有轨道
      if (recordingStream.current) {
        recordingStream.current.getTracks().forEach((track) => track.stop());
      }

      message.info("面试录屏已结束，正在准备下载...");

      // 确保数据已收集完毕后再保存
      setTimeout(() => {
        saveRecording();
      }, 500);
    }
  };

  // 保存录制的视频
  const saveRecording = () => {
    if (recordedChunks.length === 0) {
      message.error("没有录制数据可供保存");
      return;
    }

    try {
      console.log("保存录制数据，数据块数量:", recordedChunks.length);

      // 创建Blob对象
      const blob = new Blob(recordedChunks, {
        type: "video/webm",
      });

      console.log("创建的Blob大小:", blob.size);

      if (blob.size === 0) {
        message.error("录制的视频数据为空，无法保存");
        return;
      }

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      const fileName = `面试录屏-${new Date().toISOString().slice(0, 19).replace("T", "-").replace(/:/g, "-")}.webm`;
      a.download = fileName;

      // 触发下载
      a.click();

      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 提示用户视频已保存
      message.success({
        content: (
          <div>
            <div>录屏已保存到您的下载文件夹</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              文件名: {fileName}
            </div>
          </div>
        ),
        duration: 5,
      });

      // 清空录制的数据块
      setRecordedChunks([]);
    } catch (error) {
      console.error("保存录屏失败:", error);
      message.error("保存录屏失败，请检查浏览器设置是否允许下载");
    }
  };

  // 用于监听临时文本和最终文本的变化，并更新显示的输入文本
  useEffect(() => {
    // 在开发环境下输出调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('最终识别文本:', finalRecognizedText);
      console.log('临时识别文本:', interimRecognizedText);
    }
    
    // 将语音识别结果更新到输入框
    setUserInputText(finalRecognizedText + interimRecognizedText);
  }, [finalRecognizedText, interimRecognizedText]);

  // 创建WebSocket连接
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接，无需重复连接');
      return wsRef.current;
    }
    
    try {
      // WebSocket服务端地址
      const ws = new WebSocket('ws://localhost:8811/api/asr');
      
      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        setWsConnected(true);
        message.success('语音识别服务已连接');
      };
      
      ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        setWsConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        setWsConnected(false);
        message.error('语音识别服务连接失败，将使用纯文本输入模式');
      };
      
      ws.onmessage = (event) => {
        // 处理从服务器返回的识别结果
        try {
          const result = JSON.parse(event.data);
          
          // 在开发环境下输出收到的消息
          if (process.env.NODE_ENV === 'development') {
            console.log('收到WebSocket消息:', result);
          }
          
          // 根据识别状态处理文本
          if (result.status === 'INTERIM') {
            // 临时结果：仅更新临时文本状态
            setInterimRecognizedText(result.text);
          } else if (result.status === 'FINAL') {
            // 最终结果：更新最终文本，清空临时文本
            setFinalRecognizedText(prev => prev + result.text + ' ');
            setInterimRecognizedText('');
          } else if (result.text) {
            // 兼容没有状态字段的旧版本响应
            // 不再更新输入框，而是直接更新临时识别文本
            setInterimRecognizedText(result.text);
          }
        } catch (e) {
          console.error('处理语音识别结果出错:', e);
        }
      };
      
      // 设置连接超时
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          console.log('WebSocket连接超时');
          message.warning('语音识别服务连接超时，请稍后重试');
        }
      }, 5000);

      // 注册一次性事件监听，清除超时计时器
      ws.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
      }, { once: true });
      
      wsRef.current = ws;
      return ws;
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      message.error('语音识别服务不可用，将使用纯文本输入模式');
      return null;
    }
  };
  
  // 关闭WebSocket连接
  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    }
  };

  // 初始化获取媒体设备权限
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // 获取视频流
        let videoStreamObj = null;
        if (videoEnabled) {
          videoStreamObj = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setVideoStream(videoStreamObj);

          if (videoRef.current) {
            videoRef.current.srcObject = videoStreamObj;
          }
        }

        // 获取音频流权限，但默认不启用录音
        let audioStreamObj = null;
        if (audioEnabled) {
          audioStreamObj = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          setAudioStream(audioStreamObj);

          // 设置初始音量值
          setVolumeLevel(audioEnabled ? 75 : 0);
        }

        // 不再自动开始录屏，而是等待用户确认
      } catch (error) {
        console.error("获取媒体设备权限失败:", error);
        message.error("获取媒体设备权限失败，请检查浏览器设置");
      }
    };

    initializeMedia();

    // 组件卸载时清理资源
    return () => {
      // 停止录制
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try {
          mediaRecorder.requestData();
          mediaRecorder.stop();

          if (recordedChunks.length > 0) {
            setTimeout(() => {
              saveRecording();
            }, 500);
          }
        } catch (err) {
          console.error("停止录制时出错:", err);
        }
      }

      // 停止PCM录音
      stopVoiceRecognition();

      // 停止所有轨道
      if (recordingStream.current) {
        try {
          recordingStream.current.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.error("停止录制流轨道时出错:", err);
        }
      }

      // 停止视频流
      if (videoStream) {
        try {
          videoStream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.error("停止视频流时出错:", err);
        }
      }

      // 停止音频流
      if (audioStream) {
        try {
          audioStream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.error("停止音频流时出错:", err);
        }
      }
      
      // 关闭音频上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => {
          console.error("关闭音频上下文出错:", err);
        });
      }
      
      // 关闭WebSocket连接
      closeWebSocket();
    };
  }, []);

  // Float32数组转换为16位PCM Buffer
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  };

  // 重采样函数 - 将任意采样率转换为16kHz
  const resampleAudio = (audioBuffer: AudioBuffer): Float32Array => {
    // 如果已经是16kHz，直接返回
    if (audioBuffer.sampleRate === SAMPLE_RATE) {
      return audioBuffer.getChannelData(0);
    }
    
    // 计算重采样后的长度
    const sampleRateRatio = SAMPLE_RATE / audioBuffer.sampleRate;
    const newLength = Math.round(audioBuffer.length * sampleRateRatio);
    
    // 创建结果数组
    const result = new Float32Array(newLength);
    
    // 使用简单的线性差值进行重采样
    const channelData = audioBuffer.getChannelData(0);
    let offsetResult = 0;
    
    for (let i = 0; i < newLength; i++) {
      const indexOriginal = i / sampleRateRatio;
      const index1 = Math.floor(indexOriginal);
      const index2 = Math.ceil(indexOriginal);
      
      const fraction = indexOriginal - index1;
      
      if (index2 < channelData.length) {
        result[offsetResult++] = channelData[index1] * (1 - fraction) + channelData[index2] * fraction;
      } else {
        result[offsetResult++] = channelData[index1];
      }
    }
    
    return result;
  };

  // 处理音频数据转换为PCM并发送
  const processAudioData = (audioProcessingEvent: AudioProcessingEvent) => {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;
    
    // 获取输入数据
    const inputData = inputBuffer.getChannelData(0);
    
    // 复制数据到输出
    const outputData = outputBuffer.getChannelData(0);
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i];
    }
    
    try {
      // 仅当WebSocket连接可用时发送数据
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // 重采样到16kHz并确保是单声道
        let sampledData = inputData;
        if (inputBuffer.sampleRate !== SAMPLE_RATE) {
          sampledData = resampleAudio(inputBuffer);
        }
        
        // 将float32数据转换为16位PCM
        const pcmBuffer = floatTo16BitPCM(sampledData);
        wsRef.current.send(pcmBuffer);
      }
    } catch (error) {
      console.error('处理音频数据出错:', error);
    }
  };

  // 开始语音识别
  const startVoiceRecognition = async () => {
    if (!audioStream || !audioEnabled) {
      message.error("麦克风未就绪，请检查权限设置");
      return;
    }
    
    try {
      // 重置识别文本状态和输入框
      setFinalRecognizedText('');
      setInterimRecognizedText('');
      setUserInputText('');
      

      
      // 首先连接WebSocket
      const ws = connectWebSocket();
      
      // 即使WebSocket连接失败，我们也继续进行本地音频处理
      // 这样用户至少可以看到音频被采集（即使没有语音识别）
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        message.loading('正在连接语音识别服务...');
        // 即使连接失败，在一秒后仍启动音频处理
        setTimeout(() => {
          startAudioProcessing();
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            message.warning('无法连接到语音识别服务，将只进行录音');
          }
        }, 1000);
      } else {
        // WebSocket连接已建立，直接启动音频处理
        startAudioProcessing();
      }
    } catch (error) {
      console.error("开始语音识别失败:", error);
      message.error("开始语音识别失败");
    }
  };
  
  // 启动音频处理
  const startAudioProcessing = () => {
    try {
      // 初始化音频上下文
      const AudioContextClass = (window as WindowWithWebkitAudio).webkitAudioContext || window.AudioContext;
      audioContextRef.current = new AudioContextClass();
      
      // 创建音频源
      const source = audioContextRef.current.createMediaStreamSource(audioStream!);
      
      // 创建脚本处理器
      const processor = audioContextRef.current.createScriptProcessor(
        BUFFER_SIZE, 
        CHANNELS,  // 输入声道数
        CHANNELS   // 输出声道数
      );
      
      // 设置音频处理事件
      processor.onaudioprocess = processAudioData;
      
      // 连接音频流 - 只连接到处理器，不连接到destination以避免回声
      source.connect(processor);
      
      // 创建一个静音节点，连接处理器以保持处理器活跃
      // 这是因为ScriptProcessorNode需要连接到某个地方才能工作，但我们不希望声音输出
      const silentNode = audioContextRef.current.createGain();
      silentNode.gain.value = 0; // 将增益设为0，完全静音
      processor.connect(silentNode);
      silentNode.connect(audioContextRef.current.destination);
      
      // 保存引用以便后续关闭
      processorRef.current = processor;
      silentNodeRef.current = silentNode;
      
      // 更新状态
      setIsRecordingVoice(true);
      message.success("已开始语音识别");
    } catch (error) {
      console.error("创建音频处理流程失败:", error);
      message.error("语音识别启动失败");
    }
  };

  // 停止语音识别
  const stopVoiceRecognition = () => {
    try {
      // 断开音频处理
      if (processorRef.current) {
        // 断开所有连接
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      
      // 断开静音节点
      if (silentNodeRef.current) {
        silentNodeRef.current.disconnect();
        silentNodeRef.current = null;
      }
      
      // 关闭音频上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => {
          console.error("关闭音频上下文出错:", err);
        });
        audioContextRef.current = null;
      }
      
      // 发送结束信号并关闭WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ command: "end" }));
        // 短暂延迟后关闭连接，确保结束信号发送完成
        setTimeout(() => {
          closeWebSocket();
        }, 500);
      }
      

      
      // 清空识别状态（但保持输入框中的内容）
      // 注意：不清空识别文本，让内容保留在输入框中
      // setFinalRecognizedText("");
      // setInterimRecognizedText("");
      
      // 更新状态
      setIsRecordingVoice(false);
      message.success("语音识别已停止");
    } catch (error) {
      console.error("停止语音识别失败:", error);
      message.error("停止语音识别失败");
    }
  };

  // 处理语音消息发送
  const handleVoiceMessageSend = () => {
    // 只处理输入框中的文本
    if (!userInputText.trim()) {
      message.info("请先录入或输入内容");
      return;
    }
    
    // 用户消息
    const userResponse = {
      content: userInputText.trim(),
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userResponse]);
    
    // 清空输入框和语音识别状态
    setUserInputText("");
    setFinalRecognizedText("");
    setInterimRecognizedText("");
    
    // 模拟AI回复
    setTimeout(() => {
      const aiResponse = {
        content: "感谢您的回答，这个回答非常全面。下一个问题是：您是如何解决前端性能优化问题的？",
        isAI: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1500);
  };

  // 处理视频开关变化
  const handleVideoToggle = async (checked: boolean) => {
    setVideoEnabled(checked);

    if (!checked && videoStream) {
      // 关闭视频流，但不停止轨道
      videoStream.getVideoTracks().forEach((track) => {
        track.enabled = false; // 禁用轨道而不是停止它
      });

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } else if (checked && videoStream) {
      // 重新启用视频流
      videoStream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });

      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
    } else if (checked && !videoStream) {
      // 重新打开视频流
      try {
        const video = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setVideoStream(video);

        if (videoRef.current) {
          videoRef.current.srcObject = video;
        }
      } catch (error) {
        console.error("无法开启摄像头:", error);
        setVideoEnabled(false);
      }
    }
  };

  // 处理音频开关变化
  const handleAudioToggle = async (checked: boolean) => {
    setAudioEnabled(checked);

    // 根据音频开关状态更新音量值
    setVolumeLevel(checked ? 75 : 0);

    if (!checked && audioStream) {
      // 关闭音频流，但不影响录制
      audioStream.getAudioTracks().forEach((track) => {
        track.enabled = false; // 禁用轨道而不是停止它
      });
    } else if (checked && audioStream) {
      // 重新启用音频流
      audioStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    } else if (checked && !audioStream) {
      // 重新打开音频流
      try {
        const audio = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setAudioStream(audio);
      } catch (error) {
        console.error("无法开启麦克风:", error);
        setAudioEnabled(false);
        setVolumeLevel(0);
      }
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  // 渲染消息组件
  const renderMessages = () => {
    // 按日期分组消息
    const groupedMessages: { [key: string]: typeof messages } = {};

    messages.forEach((message) => {
      const timeKey = formatTime(message.timestamp);
      if (!groupedMessages[timeKey]) {
        groupedMessages[timeKey] = [];
      }
      groupedMessages[timeKey].push(message);
    });

    // 渲染分组后的消息
    return (
      <>
        {Object.entries(groupedMessages).map(([timeKey, msgs]) => (
          <div key={timeKey} className="message-group">
            <div className="message-time">{timeKey}</div>
            {msgs.map((msg, index) => (
              <div
                key={`${timeKey}-${index}`}
                className={`message-item ${msg.isAI ? "ai-message" : "user-message"}`}
              >
                <div className="message-content-wrapper">
                  <Avatar
                    size="small"
                    icon={msg.isAI ? <RobotOutlined /> : <UserOutlined />}
                    className={`message-avatar ${msg.isAI ? "ai-avatar" : "user-avatar"}`}
                  />
                  <div className="message-bubble">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

      </>
    );
  };

  const l2dRef = useRef<HTMLCanvasElement>(null);
  const model = useRef<Model>();
  useEffect(() => {
    import("l2d").then(({ init }) => {
      const l2d = init(l2dRef.current);
      l2d
        .create({
          path: "https://model.hacxy.cn/kei_vowels_pro/kei_vowels_pro.model3.json",
        })
        .then((res) => {
          model.current = res;
        });
    });

    return () => {
      model.current?.destroy();
    };
  }, []);

  // 在结束面试按钮中添加确认
  const handleEndInterview = () => {
    // 如果正在录制，先停止录制
    if (isRecording) {
      Modal.confirm({
        title: "结束面试",
        content: "面试录制尚未结束，确定要结束面试吗？录制的视频将自动保存。",
        okText: "确认结束",
        cancelText: "取消",
        onOk: () => {
          stopScreenRecording();
          // 这里可以添加其他结束面试的逻辑，比如跳转页面
          message.success("面试已结束");
        },
      });
    } else {
      Modal.confirm({
        title: "结束面试",
        content: "确定要结束当前面试吗？",
        okText: "确认结束",
        cancelText: "取消",
        onOk: () => {
          // 这里可以添加其他结束面试的逻辑，比如跳转页面
          message.success("面试已结束");
        },
      });
    }
  };

  return (
    <div className="interview-start-container">
      {/* 录制确认对话框 */}
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
          <p>
            是否要录制本次面试过程？录制的视频将在面试结束后自动下载到您的设备。
          </p>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "15px" }}
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
                为了获得最佳效果，建议选择&ldquo;整个屏幕&rdquo;或当前浏览器窗口。
              </p>
            </div>
          )}
        </div>
      </Modal>

      <div className="layout-container">
        {/* 左侧AI面板 */}
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
              <div className="stat-value">00:46</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">得分</div>
              <div className="stat-value">0/5</div>
            </div>
          </div>
        </div>

        {/* 中间对话区域 */}
        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-title">面试对话记录</div>
            <div className="chat-actions"></div>
          </div>

          <div className="conversation-container">
            {renderMessages()}
            <div ref={messagesEndRef} />
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
              className={`voice-button ${isRecordingVoice ? "recording" : ""} ${(!audioEnabled) ? "disabled" : ""}`}
              onClick={isRecordingVoice ? stopVoiceRecognition : startVoiceRecognition}
              title={isRecordingVoice ? "点击停止语音识别" : "点击开始语音输入"}
            >
              <AudioTwoTone twoToneColor={isRecordingVoice ? "#ff4d4f" : audioEnabled ? "#4f6ef2" : "#999"} />
            </div>
            <div
              className="send-button"
              onClick={handleVoiceMessageSend}
            >
              <SendOutlined />
            </div>
          </div>
        </div>

        {/* 右侧工具栏 */}
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
                  <Button
                    type="primary"
                    size="small"
                    icon={<VideoCameraFilled />}
                    onClick={handleStartRecording}
                  >
                    开始录制
                  </Button>
                ) : isRecording ? (
                  <Button danger size="small" onClick={stopScreenRecording}>
                    停止录制
                  </Button>
                ) : (
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    录制已关闭
                  </Text>
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
  );
}