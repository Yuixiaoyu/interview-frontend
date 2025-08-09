import "bytemd/dist/index.css";
import "highlight.js/styles/vs.css";
import "github-markdown-css/github-markdown-light.css";
import { useEffect, useState } from "react";
import { addUserSignIn } from "@/api/userController";
import { message } from "antd";

const SIGN_IN_KEY = 'user_sign_in_record';

interface SignInRecord {
  date: string;
  timestamp: number;
}

/**
 * 添加用户刷题记录钩子
 * @param props
 * @constructor
 */
const useAddUserSignInRecord = () => {
  const [loading, setLoading] = useState<boolean>(false);

  // 获取今天结束时间的时间戳（第二天零点）
  const getTodayEndTimestamp = (): number => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime();
  };

  // 检查是否已经签到
  const checkIfAlreadySignedIn = (): boolean => {
    const storedRecord = localStorage.getItem(SIGN_IN_KEY);
    if (!storedRecord) {
      return false;
    }

    try {
      const record: SignInRecord = JSON.parse(storedRecord);
      const today = new Date().toISOString().split('T')[0];
      
      // 检查是否是今天的记录
      if (record.date === today) {
        // 检查记录是否在今天内（今天结束时间之前）
        const now = Date.now();
        const todayEnd = getTodayEndTimestamp();
        if (now < todayEnd) {
          return true;
        }
      }
    } catch (e) {
      return false;
    }

    // 如果记录已过期或不是今天的，删除它
    localStorage.removeItem(SIGN_IN_KEY);
    return false;
  };

  // 保存签到记录
  const saveSignInRecord = () => {
    const record: SignInRecord = {
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
    localStorage.setItem(SIGN_IN_KEY, JSON.stringify(record));
  };

  // 请求后端执行签到
  const doFetch = async () => {
    // 如果已经签到，直接返回
    if (checkIfAlreadySignedIn()) {
      return;
    }

    setLoading(true);
    try {
      await addUserSignIn({});
      // 签到成功后保存记录
      saveSignInRecord();
    } catch (e: any) {
      message.error("签到失败：" + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    doFetch();
  }, []);

  return { loading };
};

export default useAddUserSignInRecord;
