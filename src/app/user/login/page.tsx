'use client'
import { userLogin } from '@/api/userController'
import { AppDispatch } from '@/stores'
import { setLoginUser } from '@/stores/loginUser'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { LoginForm, ProForm, ProFormText } from '@ant-design/pro-components'
import { Image, message, theme } from 'antd'
import Link from 'antd/es/typography/Link'
import { useRouter } from 'next/navigation'

import React from 'react'
import { useDispatch } from 'react-redux'

type LoginType = 'phone' | 'account'

const UserLoginPage: React.FC = () => {
  const [form] = ProForm.useForm()

  const dispath = useDispatch<AppDispatch>()
  const router = useRouter()

  /**
   * 提交
   * @param values 表单数据
   */
  const doSubmit = async (values: API.UserLoginRequest) => {
    try {
      const res = await userLogin(values)
      if (res.data) {
        message.success('登录成功')
        dispath(setLoginUser(res.data as API.LoginUserVO))
        router.replace('/')
        form.resetFields()
      }
    } catch (e: any) {
      message.error("登录失败:"+ e.message)
    }
  }

  return (
    <div id="userLoginPage">
      <LoginForm
        form={form}
        logo={<Image src="/assets/logo.png" height={44} width={44} alt="给我一个offer" />}
        title="智面星图AI评测平台 用户登陆"
        // subTitle="给我一个Offer团队开发~ "
        subTitle="智眸识才团队开发~ "
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

        <div
          style={{
            marginBlockEnd: 24,
            textAlign: 'end',
          }}
        >
          还没有账号？
          <Link href={'/user/register'}>立即注册！</Link>
        </div>
      </LoginForm>
    </div>
  )
}

export default UserLoginPage
