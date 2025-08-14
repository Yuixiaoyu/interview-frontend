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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const grouped = useMemo(() => {
    const map: Record<string, ChatMessage[]> = {};
    messages.forEach((m) => {
      const key = formatTime(m.timestamp);
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [messages]);

  return (
    <>
      {Object.entries(grouped).map(([timeKey, msgs]) => (
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
      <div ref={messagesEndRef} />
    </>
  );
}


