import { useCallback, useRef, useState } from "react";
import { message } from "antd";

/**
 * 管理屏幕录制（包含可选的麦克风音频合流）
 */
export function useScreenRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const saveRecording = useCallback(() => {
    const chunks = recordedChunksRef.current;
    if (!chunks.length) {
      message.error("没有录制数据可供保存");
      return;
    }
    try {
      const blob = new Blob(chunks, { type: "video/webm" });
      if (blob.size === 0) {
        message.error("录制的视频数据为空，无法保存");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      const fileName = `面试录屏-${new Date().toISOString().slice(0, 19).replace("T", "-").replace(/:/g, "-")}.webm`;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      recordedChunksRef.current = [];
      message.success({
        content: (
          <div>
            <div>录屏已保存到您的下载文件夹</div>
            <div style={{ fontSize: "12px", color: "#666" }}>文件名: {fileName}</div>
          </div>
        ),
        duration: 5,
      });
    } catch (error) {
      message.error("保存录屏失败，请检查浏览器设置是否允许下载");
    }
  }, []);

  const stop = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.requestData();
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      message.info("面试录屏已结束，正在准备下载...");
      setTimeout(() => saveRecording(), 500);
    }
  }, [saveRecording]);

  const start = useCallback(async (videoStream: MediaStream | null, audioStream: MediaStream | null) => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];

      let combinedStream: MediaStream;
      let audioContext: AudioContext | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;

      if (audioStream && audioStream.getAudioTracks().length > 0) {
        try {
          audioContext = new AudioContext();
          audioDestination = audioContext.createMediaStreamDestination();
          const audioSource = audioContext.createMediaStreamSource(audioStream);
          audioSource.connect(audioDestination);
          combinedStream = new MediaStream([screenTrack, ...audioDestination.stream.getAudioTracks()]);
        } catch (audioError) {
          // eslint-disable-next-line no-console
          console.warn("无法处理音频，将只录制屏幕:", audioError);
          combinedStream = new MediaStream([screenTrack]);
        }
      } else {
        combinedStream = new MediaStream([screenTrack]);
      }

      recordingStreamRef.current = combinedStream;
      recordedChunksRef.current = [];

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

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 2500000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current = [...recordedChunksRef.current, event.data];
        }
      };

      mediaRecorder.onstop = () => {
        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }
      };

      mediaRecorder.start(500);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      message.success("面试录屏已开始");

      screenTrack.onended = () => {
        stop();
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("录屏失败:", error);
      message.error("录屏功能启动失败");
    }
  }, [stop]);

  return {
    isRecording,
    start,
    stop,
  } as const;
}


