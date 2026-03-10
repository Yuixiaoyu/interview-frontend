'use client'

import './index.css'

import { userLogin } from '@/api/userController'
import { AppDispatch } from '@/stores'
import { setLoginUser } from '@/stores/loginUser'
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ProForm, ProFormText } from '@ant-design/pro-components'
import { message } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useDispatch } from 'react-redux'

const capabilityList = [
  {
    title: '沉浸式模拟',
    description: '围绕真实岗位场景展开问答，让练习更像一次完整面试。',
    icon: <ThunderboltOutlined />,
  },
  {
    title: '结构化反馈',
    description: '聚焦表达、思路与亮点提炼，帮助你更快找到提升方向。',
    icon: <RadarChartOutlined />,
  },
  {
    title: '安全进入',
    description: '延续平台主题色与专业感，登录体验保持清晰、稳重、可信赖。',
    icon: <SafetyCertificateOutlined />,
  },
]

const workflowTags = ['题库训练', '模拟问答', '智能追问', '结果复盘']

const UserLoginPage: React.FC = () => {
  const [form] = ProForm.useForm()
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const doSubmit = async (values: API.UserLoginRequest) => {
    try {
      const res = await userLogin(values)
      if (res.data) {
        message.success('登录成功')
        dispatch(setLoginUser(res.data as API.LoginUserVO))
        router.replace('/')
        form.resetFields()
      }
    } catch (error: any) {
      message.error(`登录失败：${error?.message ?? '请稍后重试'}`)
    }
  }

  return (
    <div id="userLoginPage">
      <div className="login-page__mesh" />
      <div className="login-page__glow login-page__glow--left" />
      <div className="login-page__glow login-page__glow--right" />

      <div className="login-page__shell">
        <section className="login-page__hero">
          <div className="login-page__badge">AI Interview Studio</div>
          <h1 className="login-page__title">
            让每一次登录，
            <br />
            都像进入你的
            <span className="login-page__title-accent"> 面试指挥台 </span>
          </h1>
          <p className="login-page__description">
            以平台主题紫为核心，重新打造更现代、更有层次的登录体验。进入系统前，用户就能感受到专业、轻盈和准备就绪的状态。
          </p>

          <div className="login-page__tags">
            {workflowTags.map((tag) => (
              <span key={tag} className="login-page__tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="login-page__capabilities">
            {capabilityList.map((item) => (
              <article key={item.title} className="login-page__capability-card">
                <div className="login-page__capability-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="login-page__hero-footer">
            <div className="login-page__status">
              <CheckCircleFilled />
              <span>登录后即可继续题库训练、模拟面试与结果分析</span>
            </div>
            <Link href="/user/register" className="login-page__register-link">
              还没有账号？立即注册
              <ArrowRightOutlined />
            </Link>
          </div>
        </section>

        <section className="login-page__panel">
          <div className="login-card">
            <div className="login-card__shine" />

            <div className="login-card__brand">
              <div className="login-card__logo-wrap">
                <Image
                  src="/assets/logo.png"
                  width={100}
                  height={100}
                  alt="AI智能模拟面试"
                  className="login-card__logo"
                />
              </div>
              <div>
                <p className="login-card__brand-label">AI智能模拟面试</p>
                <h2 className="login-card__brand-title">欢迎回来</h2>
              </div>
            </div>

            <div className="login-card__intro">
              <p>输入账号和密码，继续你的专属训练流程。</p>
            </div>

            <ProForm<API.UserLoginRequest>
              form={form}
              className="login-form"
              submitter={{
                searchConfig: {
                  submitText: '进入面试台',
                },
                resetButtonProps: false,
                submitButtonProps: {
                  size: 'large',
                  block: true,
                  className: 'login-form__submit',
                },
                render: (_, doms) => <div className="login-form__submit-wrap">{doms}</div>,
              }}
              onFinish={doSubmit}
            >
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className="login-form__field-icon" />,
                  placeholder: '请输入账号',
                  autoComplete: 'username',
                  allowClear: true,
                }}
                rules={[
                  {
                    required: true,
                    message: '请输入账号！',
                  },
                ]}
              />

              <ProFormText.Password
                name="userPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className="login-form__field-icon" />,
                  placeholder: '请输入密码',
                  autoComplete: 'current-password',
                }}
                rules={[
                  {
                    required: true,
                    message: '请输入密码！',
                  },
                ]}
              />
            </ProForm>

            <div className="login-card__footer">
              <span>第一次来到这里？</span>
              <Link href="/user/register" className="login-card__footer-link">
                创建新账号
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserLoginPage
