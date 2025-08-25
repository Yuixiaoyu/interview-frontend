import { useEffect, useMemo, useRef } from "react";
import { Avatar } from "antd";
import { RobotOutlined, UserOutlined } from "@ant-design/icons";

export type ChatMessage = {
  content: string;
  isAI: boolean;
  timestamp: Date;
};

function formatTime(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("💬 ChatMessages组件收到消息更新:", messages.length, "条消息");
    console.log("💬 消息详情:", messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const grouped = useMemo(() => {
    const map: Record<string, ChatMessage[]> = {};
    messages.forEach((m, index) => {
      const key = formatTime(m.timestamp);
      if (!map[key]) map[key] = [];
      map[key].push({ ...m, originalIndex: index }); // 添加原始索引避免key冲突
    });
    console.log("💬 消息分组结果:", map);
    return map;
  }, [messages]);

  return (
    <>
      {Object.entries(grouped).map(([timeKey, msgs]) => (
        <div key={timeKey} className="message-group">
          <div className="message-time">{timeKey}</div>
          {msgs.map((msg, index) => (
            <div
              key={`${timeKey}-${index}-${(msg as any).originalIndex || index}-${msg.timestamp.getTime()}`}
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
      <div ref={messagesEndRef} />
    </>
  );
}


