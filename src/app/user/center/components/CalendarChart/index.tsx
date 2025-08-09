import "bytemd/dist/index.css";
import "highlight.js/styles/vs.css";
import "./index.css";
import "github-markdown-css/github-markdown-light.css";
import React, {useEffect, useState} from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import {getUserSignInRecord} from "@/api/userController";
import {message} from "antd";

interface Props {}

/**
 * 刷题记录图
 * @param props
 * @constructor
 */
const CalendarChart = (props: Props) => {
  const {} = props;

  //签到日期列表([1,15])表示第一天和第十五天有签到记录
  const [dataList,setDataList] = useState<number[]>([])

  // 计算图表需要的数据
  const year = new Date().getFullYear();

  const fetchDataList = async ()=>{
    try {
      const res = await  getUserSignInRecord({
        year,
      })
      setDataList(res.data)
    }catch (e){
      message.error("获取签到记录失败："+e.message)
    }
  };

  useEffect(()=>{
    fetchDataList()
  },[]);




  const optionsData = dataList.map((dayOfYear) => {
    //计算日期字符串
    const dateStr = dayjs(`${year}-01-01`)
        .add(dayOfYear - 1, "day")
        .format("YYYY-MM-DD");
    return [dateStr, 1];
  });

  // 图表配置
  const options = {
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        // 颜色从灰色到浅绿色
        color: ["#cbc9c9", "#00c707"],
      },
    },
    calendar: {
      range: year,
      left: 20,
      // 单元格自动宽度，高度为 16 像素
      cellSize: ['auto', 16],
      yearLabel: {
        position: "top",
        formatter: `${year} 年刷题记录`,
      }
    },
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data: optionsData,
    },
  };


  return <ReactECharts className={"calendar-chart"} option={options} />;
};

export default CalendarChart;
