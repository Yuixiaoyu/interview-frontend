import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";

// WebKit 兼容
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// 常量配置
const SAMPLE_RATE = 16000; // 采样率 16kHz
const CHANNELS = 1; // 单声道
const BUFFER_SIZE = 4096; // 缓冲区大小

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output.buffer;
}

function resampleAudio(audioBuffer: AudioBuffer): Float32Array {
  if (audioBuffer.sampleRate === SAMPLE_RATE) {
    return audioBuffer.getChannelData(0);
  }
  const sampleRateRatio = SAMPLE_RATE / audioBuffer.sampleRate;
  const newLength = Math.round(audioBuffer.length * sampleRateRatio);
  const result = new Float32Array(newLength);
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
}

type UseVoiceRecognitionOptions = {
  audioStream: MediaStream | null;
  audioEnabled: boolean;
  wsUrl?: string;
};

export function useVoiceRecognition(options: UseVoiceRecognitionOptions) {
  const { audioStream, audioEnabled, wsUrl = "ws://localhost:8811/api/asr" } = options;

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [finalRecognizedText, setFinalRecognizedText] = useState("");
  const [interimRecognizedText, setInterimRecognizedText] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentNodeRef = useRef<GainNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 连接 WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setWsConnected(true);
        message.success("语音识别服务已连接");
      };
      ws.onclose = () => {
        setWsConnected(false);
      };
      ws.onerror = () => {
        setWsConnected(false);
        message.error("语音识别服务连接失败，将使用纯文本输入模式");
      };
      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          if (result.status === "INTERIM") {
            setInterimRecognizedText(result.text || "");
          } else if (result.status === "FINAL") {
            setFinalRecognizedText((prev) => (prev + (result.text || "") + " "));
            setInterimRecognizedText("");
          } else if (result.text) {
            setInterimRecognizedText(result.text);
          }
        } catch (e) {
          // 忽略单条解析错误，避免打断识别流程
        }
      };
      // 连接超时兜底
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          message.warning("语音识别服务连接超时，请稍后重试");
        }
      }, 5000);
      ws.addEventListener("open", () => clearTimeout(connectionTimeout), { once: true });

      wsRef.current = ws;
      return ws;
    } catch (error) {
      message.error("语音识别服务不可用，将使用纯文本输入模式");
      return null;
    }
  }, [wsUrl]);

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    }
  }, []);

  const processAudioData = useCallback((audioProcessingEvent: AudioProcessingEvent) => {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;
    const inputData = inputBuffer.getChannelData(0);
    const outputData = outputBuffer.getChannelData(0);
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i];
    }
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        let sampledData = inputData;
        if (inputBuffer.sampleRate !== SAMPLE_RATE) {
          sampledData = resampleAudio(inputBuffer);
        }
        const pcmBuffer = floatTo16BitPCM(sampledData);
        wsRef.current.send(pcmBuffer);
      }
    } catch (error) {
      // 忽略 send 失败，避免不断报错
    }
  }, []);

  const start = useCallback(async () => {
    if (!audioStream || !audioEnabled) {
      message.error("麦克风未就绪，请检查权限设置");
      return;
    }
    try {
      // 重置识别文本
      setFinalRecognizedText("");
      setInterimRecognizedText("");

      const ws = connectWebSocket();
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        message.loading("正在连接语音识别服务...");
      }

      const AudioContextClass = (window as WindowWithWebkitAudio).webkitAudioContext || window.AudioContext;
      audioContextRef.current = new AudioContextClass();
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      const processor = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, CHANNELS, CHANNELS);
      processor.onaudioprocess = processAudioData;
      source.connect(processor);
      const silentNode = audioContextRef.current.createGain();
      silentNode.gain.value = 0;
      processor.connect(silentNode);
      silentNode.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      silentNodeRef.current = silentNode;
      setIsRecordingVoice(true);
      message.success("已开始语音识别");
    } catch (error) {
      message.error("语音识别启动失败");
    }
  }, [audioStream, audioEnabled, connectWebSocket, processAudioData]);

  const stop = useCallback(() => {
    try {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (silentNodeRef.current) {
        silentNodeRef.current.disconnect();
        silentNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ command: "end" }));
        setTimeout(() => closeWebSocket(), 300);
      }
      setIsRecordingVoice(false);
      message.success("语音识别已停止");
    } catch (error) {
      message.error("停止语音识别失败");
    }
  }, [closeWebSocket]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const clearRecognizedTexts = useCallback(() => {
    setFinalRecognizedText("");
    setInterimRecognizedText("");
  }, []);

  return {
    isRecordingVoice,
    wsConnected,
    finalRecognizedText,
    interimRecognizedText,
    start,
    stop,
    clearRecognizedTexts,
  } as const;
}


