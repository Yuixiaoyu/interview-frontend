import React from 'react';
import { Spin } from 'antd';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spin size="large" />
        <p className="loading-text">面试官正在准备中...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;