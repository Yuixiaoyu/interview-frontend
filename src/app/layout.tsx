'use client'
import {AntdRegistry} from '@ant-design/nextjs-registry'
import './globals.css'
import BasicLayout from '@/layouts/basicLayout'
import React, {useCallback, useEffect} from 'react'
import {Provider, useDispatch} from 'react-redux'
import store, {AppDispatch} from '@/stores'
import {getLoginUser} from '@/api/userController'
import {setLoginUser} from '@/stores/loginUser'
import {usePathname} from 'next/navigation'
import AccessLayout from '@/access/AccessLayout'

/**
 * 全局初始化逻辑
 * @param children
 * @returns
 */
const InitLayout: React.FC<
  Readonly<{
    children: React.ReactNode
  }>
> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()

  const pathname = usePathname()

  /**
   * 初始化全局用户状态
   */
  const doInitLoginUser = useCallback(async () => {
    if (!pathname.startsWith('/user/login') && !pathname.startsWith('/user/register')) {
      const res = await getLoginUser()
      if (res.data) {
        //更新用户全局状态
        dispatch(setLoginUser(res.data as API.LoginUserVO))
      } else {
        //模拟用户登录，仅用于测试
        // setTimeout(() => {
        //   const testUser = {
        //     userName: 'test',
        //     userAvatar: 'https://tse2-mm.cn.bing.net/th/id/OIP-C.UyaBji0AU_6M3VDA2F1RvgAAAA?cb=iwp2&rs=1&pid=ImgDetMain',
        //     id: 1,
        //     userRole: ACCESS_ENUM.ADMIN,
        //   }
        //   despatch(setLoginUser(testUser))
        // }, 3000)
      }
    }
  }, [])

  //只执行一次
  useEffect(() => {
    doInitLoginUser()
  }, [])

  return children
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body>
        <AntdRegistry>
          <Provider store={store}>
            <InitLayout>
              <BasicLayout>
                <AccessLayout>{children}</AccessLayout>
              </BasicLayout>
            </InitLayout>
          </Provider>
        </AntdRegistry>
      </body>
    </html>
  )
}
