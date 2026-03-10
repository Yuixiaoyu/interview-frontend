'use client'

import './index.css'

import { userRegister } from '@/api/userController'
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  MessageOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ProForm, ProFormText } from '@ant-design/pro-components'
import { message } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

const benefitList = [
  {
    title: '快速创建训练档案',
    description: '注册后即可保存练习记录、阶段表现与成长轨迹。',
    icon: <RocketOutlined />,
  },
  {
    title: '更智能的复盘体验',
    description: '把每一次模拟结果沉淀为可回看的结构化反馈。',
    icon: <MessageOutlined />,
  },
  {
    title: '主题一致且可信赖',
    description: '延续平台主视觉与专业感，让注册过程同样轻盈清晰。',
    icon: <SafetyCertificateOutlined />,
  },
]

const stageTags = ['建立账号', '开始练习', '沉淀记录', '持续进阶']

const UserRegisterPage: React.FC = () => {
  const [form] = ProForm.useForm()
  const router = useRouter()

  const doSubmit = async (values: API.UserRegisterRequest) => {
    try {
      const res = await userRegister(values)
      if (res.data) {
        message.success('注册成功，请登录')
        router.replace('/user/login')
        form.resetFields()
      }
    } catch (error: any) {
      message.error(`注册失败：${error?.message ?? '请稍后重试'}`)
    }
  }

  return (
    <div id="userRegisterPage">
      <div className="register-page__mesh" />
      <div className="register-page__glow register-page__glow--left" />
      <div className="register-page__glow register-page__glow--right" />

      <div className="register-page__shell">
        <section className="register-page__hero">
          <div className="register-page__badge">Create Your Interview Profile</div>
          <h1 className="register-page__title">
            从注册开始，
            <br />
            建立属于你的
            <span className="register-page__title-accent"> 面试成长空间 </span>
          </h1>
          <p className="register-page__description">
            用平台主题紫构建统一视觉语言，让用户在注册阶段就感受到专业、现代和有秩序的体验，顺滑进入后续训练与复盘流程。
          </p>

          <div className="register-page__tags">
            {stageTags.map((tag) => (
              <span key={tag} className="register-page__tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="register-page__benefits">
            {benefitList.map((item) => (
              <article key={item.title} className="register-page__benefit-card">
                <div className="register-page__benefit-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="register-page__hero-footer">
            <div className="register-page__status">
              <CheckCircleFilled />
              <span>创建账号后即可开启题库训练、模拟面试与分析复盘</span>
            </div>
            <Link href="/user/login" className="register-page__login-link">
              已有账号？立即登录
              <ArrowRightOutlined />
            </Link>
          </div>
        </section>

        <section className="register-page__panel">
          <div className="register-card">
            <div className="register-card__shine" />

            <div className="register-card__brand">
              <div className="register-card__logo-wrap">
                <Image
                  src="/assets/logo.png"
                  width={100}
                  height={100}
                  alt="AI智能模拟面试"
                  className="register-card__logo"
                />
              </div>
              <div>
                <p className="register-card__brand-label">AI智能模拟面试</p>
                <h2 className="register-card__brand-title">创建账号</h2>
              </div>
            </div>

            <div className="register-card__intro">
              <p>填写基础信息，完成后即可进入平台开始你的专属训练计划。</p>
            </div>

            <ProForm<API.UserRegisterRequest>
              form={form}
              className="register-form"
              submitter={{
                searchConfig: {
                  submitText: '创建并继续',
                },
                resetButtonProps: false,
                submitButtonProps: {
                  size: 'large',
                  block: true,
                  className: 'register-form__submit',
                },
                render: (_, doms) => <div className="register-form__submit-wrap">{doms}</div>,
              }}
              onFinish={doSubmit}
            >
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className="register-form__field-icon" />,
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
                  prefix: <LockOutlined className="register-form__field-icon" />,
                  placeholder: '请输入密码',
                  autoComplete: 'new-password',
                }}
                rules={[
                  {
                    required: true,
                    message: '请输入密码！',
                  },
                ]}
              />

              <ProFormText.Password
                name="checkPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <UserAddOutlined className="register-form__field-icon" />,
                  placeholder: '请确认密码',
                  autoComplete: 'new-password',
                }}
                rules={[
                  {
                    required: true,
                    message: '请确认密码！',
                  },
                ]}
              />
            </ProForm>

            <div className="register-card__footer">
              <span>已经有账号了？</span>
              <Link href="/user/login" className="register-card__footer-link">
                去登录
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserRegisterPage
