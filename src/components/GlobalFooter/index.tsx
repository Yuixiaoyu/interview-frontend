
import React from 'react'
import './index.css'


/**
 * 全局底部栏组件
 * @returns 
 */
export default function GlobalFooter() {

  const currentYear = new Date().getFullYear()

  return (
    <div
      className='global-footer'
      style={{
        textAlign: 'center',
        paddingBlockStart: 12,
      }}
    >
      <div>© {currentYear} 给我一个Offer</div>
      <div
        style={{
          fontSize: 16,
          color: '#3b64d4',
          fontWeight: 'bold',
          marginTop: 8,
        }}
      >
      作者： 给我一个Offer团队
    </div>
    </div>
  )
}
