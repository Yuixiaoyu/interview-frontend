"use client";
import { useState, useEffect, useRef } from "react";
import { Layout, Upload, Button, Spin, Typography, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { uploadFile } from "@/api/fileController";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactECharts from "echarts-for-react";
import "./index.css";

const { Dragger } = Upload;
const { Content } = Layout;
const { Title, Text } = Typography;

export default function Analyze() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // 清理EventSource连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 处理文件上传
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await uploadFile(
        { biz: "viewVideo" } as API.uploadFileParams, // 传入必要的参数
        formData, // body
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data) {
        setFileUrl(response.data as string); // 确保类型转换正确
        message.success("文件上传成功");
        onSuccess(response, file);
      } else {
        message.error("文件上传失败");
        onError(new Error("文件上传失败"));
      }
    } catch (error) {
      console.error("上传出错:", error);
      message.error("上传过程中发生错误");
      onError(error);
    } finally {
      setUploadLoading(false);
    }
  };

  // 开始分析
  const startAnalyze = () => {
    if (!fileUrl) {
      message.warning("请先上传文件");
      return;
    }

    // 重置前一次分析的结果
    setResult("");
    setAnalyzing(true);

    // 关闭前一个连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // 创建SSE连接
    const url = `http://localhost:8811/api/analyze/videoStream?url=${encodeURIComponent(fileUrl)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const newData = event.data;
      
      // 过滤掉```markdown或```标记
      if (newData === "```markdown" || newData === "```") {
        // 不添加这些标记到结果中
        return;
      }
      
      // 无论数据是否为空，都添加数据内容，然后添加一个换行符
      setResult((prevResult) => prevResult + (newData || "") + "\n");
    };

    eventSource.onerror = (error) => {
      console.error("SSE错误:", error);
      message.error("分析过程中发生错误");
      eventSource.close();
      setAnalyzing(false);
    };

    eventSource.addEventListener("complete", () => {
      eventSource.close();
      setAnalyzing(false);
      message.success("分析完成");
    });
  };

  // 获取雷达图配置
  const getRadarOption = () => {
    return {
      title: {
        text: '面试表现评分',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        },
        left: 'center',
        top: 0
      },
      grid: {
        top: 50
      },
      radar: {
        indicator: [
          { name: '语言逻辑', max: 100 },
          { name: '专业知识', max: 100 },
          { name: '技能匹配', max: 100 },
          { name: '眼神交流', max: 100 },
          { name: '面部表情', max: 100 }
        ],
        center: ['50%', '60%'],  // 将雷达图中心点下移
        radius: '70%',           // 调整雷达图大小
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#333',
          fontSize: 14,
          padding: [0, 15]      // 增加轴名称与图的距离
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.3)'],
            shadowColor: 'rgba(0, 0, 0, 0.05)',
            shadowBlur: 5
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(211, 211, 211, 0.8)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(211, 211, 211, 0.8)'
          }
        }
      },
      series: [{
        name: '面试评分',
        type: 'radar',
        data: [
          {
            value: [85, 78, 90, 82, 75],
            name: '评分',
            areaStyle: {
              color: 'rgba(64, 169, 255, 0.6)'
            },
            lineStyle: {
              width: 2,
              color: '#1890ff'
            },
            itemStyle: {
              color: '#1890ff'
            },
            symbolSize: 6
          }
        ]
      }]
    };
  };

  // 分割内容，将"最终分析结果"及以后的内容单独处理
  const splitContent = (content: string) => {
    const finalResultIndex = content.indexOf('[最终分析结果]');
    
    if (finalResultIndex === -1) {
      // 如果没有找到"最终分析结果"标记，则全部作为原始文本显示
      return {
        rawContent: content,
        markdownContent: ''
      };
    }
    
    // 分割内容
    const rawContent = content.substring(0, finalResultIndex);
    const markdownContent = content.substring(finalResultIndex);
    
    return {
      rawContent,
      markdownContent
    };
  };

  // 处理markdown内容，确保表格正确显示
  const processMarkdownContent = (content: string) => {
    if (!content) return '';
    
    // 修复表格格式，避免额外的换行
    let processedContent = content;
    
    // 首先处理表格行，确保每行表格的格式正确且没有额外的换行
    const tableRowRegex = /\|(.*?)\|(.*?)\|(.*?)\|/g;
    processedContent = processedContent.replace(tableRowRegex, (match, col1, col2, col3) => {
      // 去除列内容中的换行符
      const cleanCol1 = col1.trim().replace(/\r?\n/g, ' ');
      const cleanCol2 = col2.trim().replace(/\r?\n/g, ' ');
      const cleanCol3 = col3.trim().replace(/\r?\n/g, ' ');
      
      return `|${cleanCol1}|${cleanCol2}|${cleanCol3}|`;
    });
    
    // 确保表格分隔行格式正确
    processedContent = processedContent.replace(/\|\s*-+\s*\|\s*-+\s*\|\s*-+\s*\|/g, '| --- | --- | --- |');
    
    // 确保列表项有正确的缩进
    processedContent = processedContent.replace(/^(\s*[-*+]\s+)/gm, '  $1');
    
    return processedContent;
  };

  return (
    <Layout className="videoAnalyzePage">
      <Layout>
        {/* 左侧上传区域 */}
        <Content className="upload-section">
          <div className="upload-container">
            <div className="upload-header">
              <Title level={3}>视频上传</Title>
              <div className="upload-subtitle">上传视频文件进行智能分析</div>
            </div>
            
            <Dragger
              name="file"
              multiple={false}
              customRequest={handleUpload}
              showUploadList={true}
              disabled={uploadLoading}
              accept="video/*"
              className="upload-dragger"
            >
              <div className="upload-inner">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽视频文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持单个视频文件上传，请确保文件格式正确
                </p>
              </div>
            </Dragger>

            {fileUrl && (
              <div className="analyze-button-container">
                <Button
                  type="primary"
                  onClick={startAnalyze}
                  loading={analyzing}
                  size="large"
                  className="analyze-button"
                >
                  {analyzing ? "分析中..." : "开始分析"}
                </Button>
              </div>
            )}
          </div>
        </Content>

        {/* 右侧分析结果区域 */}
        <Content className="result-section">
          <div className="result-container">
            <div className="result-header">
              <Title level={3}>分析结果</Title>
              <div className="result-subtitle">视频内容智能分析报告</div>
            </div>
            
            <div className="result-content">
              {analyzing && !result && (
                <div className="loading-container">
                  <div className="loading-animation">
                    <Spin tip="正在分析中..." size="large" />
                  </div>
                  <Text className="loading-text">请稍候，AI正在分析视频内容...</Text>
                </div>
              )}

              {result && (
                <div className="markdown-result">
                  {/* 分割内容，分别处理 */}
                  {(() => {
                    const { rawContent, markdownContent } = splitContent(result);
                    return (
                      <>
                        {rawContent && (
                          <div className="raw-content-section">
                            <div className="section-title">实时分析进度</div>
                            <pre className="raw-markdown">{rawContent}</pre>
                          </div>
                        )}
                        {markdownContent && (
                          <div className="markdown-content-section">
                            <div className="section-title">最终分析结果</div>
                            
                            {/* 雷达图组件 */}
                            <div className="radar-chart-container" style={{ height: '450px', marginBottom: '20px' }}>
                              <ReactECharts 
                                option={getRadarOption()} 
                                style={{ height: '100%', width: '100%' }}
                              />
                            </div>
                            
                            <div className="markdown-formatted">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  table: ({node, ...props}) => (
                                    <table className="markdown-table" {...props} />
                                  ),
                                  tr: ({node, ...props}) => (
                                    <tr className="markdown-table-row" {...props} />
                                  ),
                                  td: ({node, ...props}) => (
                                    <td className="markdown-table-cell" {...props} />
                                  ),
                                  th: ({node, ...props}) => (
                                    <th className="markdown-table-header" {...props} />
                                  )
                                }}
                              >
                                {processMarkdownContent(markdownContent)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {!analyzing && !result && (
                <div className="empty-result">
                  <div className="empty-icon">📊</div>
                  <Text className="empty-text">
                    请上传视频并点击&quot;开始分析&quot;按钮开始智能分析
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
