import { useEffect, useRef, useState } from "react";
import { message } from "antd";

/**
 * 管理摄像头/麦克风媒体流与开关的 Hook
 * - 负责初始化媒体权限与资源释放
 * - 提供视频/音频开关逻辑
 * - 维护音量显示数值（仅作 UI 展示）
 */
export function useMediaDevices() {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // 使用 ref 保存最新的流，确保卸载时正确释放
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // 初始化媒体设备
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        let localVideoStream: MediaStream | null = null;
        let localAudioStream: MediaStream | null = null;

        if (videoEnabled) {
          localVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setVideoStream(localVideoStream);
          videoStreamRef.current = localVideoStream;
        }

        if (audioEnabled) {
          localAudioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          setAudioStream(localAudioStream);
          audioStreamRef.current = localAudioStream;
          setVolumeLevel(75);
        }
      } catch (error) {
        // 仅提示一次
        // eslint-disable-next-line no-console
        console.error("获取媒体设备权限失败:", error);
        message.error("获取媒体设备权限失败，请检查浏览器设置");
      }
    };

    initializeMedia();

    return () => {
      try {
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("停止视频流时出错:", err);
      }

      try {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("停止音频流时出错:", err);
      }
    };
  }, []);

  // 切换视频
  const handleVideoToggle = async (checked: boolean) => {
    setVideoEnabled(checked);

    if (!checked && videoStreamRef.current) {
      videoStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      return;
    }

    if (checked && videoStreamRef.current) {
      videoStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      return;
    }

    if (checked && !videoStreamRef.current) {
      try {
        const localVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoStream(localVideoStream);
        videoStreamRef.current = localVideoStream;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("无法开启摄像头:", error);
        setVideoEnabled(false);
      }
    }
  };

  // 切换音频
  const handleAudioToggle = async (checked: boolean) => {
    setAudioEnabled(checked);
    setVolumeLevel(checked ? 75 : 0);

    if (!checked && audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      return;
    }

    if (checked && audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      return;
    }

    if (checked && !audioStreamRef.current) {
      try {
        const localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(localAudioStream);
        audioStreamRef.current = localAudioStream;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("无法开启麦克风:", error);
        setAudioEnabled(false);
        setVolumeLevel(0);
      }
    }
  };

  return {
    videoStream,
    audioStream,
    videoEnabled,
    audioEnabled,
    volumeLevel,
    handleVideoToggle,
    handleAudioToggle,
  } as const;
}


