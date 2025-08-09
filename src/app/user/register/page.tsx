'use client'
import {  userRegister } from '@/api/userController'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { LoginForm, ProForm, ProFormText } from '@ant-design/pro-components'
import { Image, message } from 'antd'
import Link from 'antd/es/typography/Link'
import { useRouter } from 'next/navigation'

import React from 'react'



/**
 * 用户注册页面
 * @returns 
 */
const UserRegisterPage: React.FC = () => {
  const [form] = ProForm.useForm()

  const router = useRouter()

  /**
   * 提交
   * @param values 表单数据
   */
  const doSubmit = async (values: API.UserRegisterRequest) => {
    try {
      const res = await userRegister(values)
      if (res.data) {
        message.success('注册成功，请登录')
        //前往登录页
        router.replace('/user/login')
        form.resetFields()
      }
    } catch (e: any) {
      message.error("注册失败:"+ e.message)
    }
  }

  return (
    <div id="UserRegisterPage">
      <LoginForm
        form={form}
        logo={<Image src="/assets/logo.png" height={44} width={44} alt="给我一个offer" />}
        title="给我一个Offer~ 用户注册"
        subTitle="智能面试刷题网站"
        submitter={{
          searchConfig: {
            submitText: '注册',
          }
        }}
        onFinish={doSubmit}
      >
        <ProFormText
          name="userAccount"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined />,
          }}
          placeholder={'请输入账号'}
          rules={[
            {
              required: true,
              message: '请输入账号!',
            },
          ]}
        />
        <ProFormText.Password
          name="userPassword"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined />,
          }}
          placeholder={'请输入密码'}
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
            prefix: <LockOutlined />,
          }}
          placeholder={'请确认密码'}
          rules={[
            {
              required: true,
              message: '请确认密码',
            },
          ]}
        />

        <div
          style={{
            marginBlockEnd: 24,
            textAlign: 'end',
          }}
        >
          已有账号？
          <Link href={'/user/login'}>去登陆</Link>
        </div>
      </LoginForm>
    </div>
  )
}

export default UserRegisterPage
