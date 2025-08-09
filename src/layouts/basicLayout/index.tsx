'use client'
import {GithubFilled, LogoutOutlined, SearchOutlined, UserOutlined} from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Dropdown, Input, message, theme } from 'antd'
import React from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import GlobalFooter from '@/components/GlobalFooter'
import './index.css'
import menus from '../../../config/menu'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/stores'
import getAccessibleMenus from '@/access/menuAccess'
import { userLogout as apiUserLogout } from '@/api/userController'
import { setLoginUser } from '@/stores/loginUser'
import DEFAULT_USER from '@/constants/user'
import SearchInput from "@/layouts/basicLayout/components/SearchInput";

interface Props {
  children: React.ReactNode,
}

/**
 * 通用布局
 * @param param0
 * @returns
 */
export default function BasicLayout({ children }: Props) {
  const pathname = usePathname()
  const loginUser = useSelector((state: RootState) => state.loginUser)

  const dispath = useDispatch()

  const router = useRouter()

  /**
   * 退出登陆
   */
  const handleUserLogout = async () => {
    try {
      const res = await apiUserLogout()
      if (res.data) {
        message.success('退出成功')
        dispath(setLoginUser(DEFAULT_USER))
        router.push('/user/login')
      }
    } catch (e: any) {
      message.error('退出失败:' + e.message)
    }
  }

  return (
    <div
      id="basicLayout"
      style={{
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <ProLayout
        title="智面星图AI评测平台"
        layout="top"
        logo={<Image src="/assets/logo.png" height={32} width={32} alt="智面星图AI评测平台" />}
        location={{
          pathname,
        }}
        avatarProps={{
          src: loginUser.userAvatar || '/assets/logo11.png',
          size: 'small',
          title: loginUser.userName || '锦鲤',
          render: (props, dom) => {
            if (!loginUser.id) {
              return (
                <div
                  onClick={() => {
                    router.push('/user/login')
                  }}
                >
                  {dom}
                </div>
              )
            }
            return (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'userCenter',
                      icon: <UserOutlined />,
                      label: '个人中心',
                    },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '退出登录',
                    },
                  ],
                  onClick: async (event: { key: React.Key }) => {
                    const { key } = event
                    if (key === 'logout') {
                      handleUserLogout()
                    }else if(key=== 'userCenter') {
                      router.push('/user/center')
                    }
                  },
                }}
              >
                {dom}
              </Dropdown>
            )
          },
        }}
        actionsRender={(props) => {
          if (props.isMobile) return []
          return [
              //如果当前页面是在questions页面则不展示SearchInput组件
            !pathname.startsWith("/questions") && <SearchInput key="search" />,
            <a key="link" href="https://github.com/Yuixiaoyu/interview" target="_blank">
              <GithubFilled key="GithubFilled" />,
            </a>,
          ]
        }}
        headerTitleRender={(logo, title, _) => {
          return (
            <a>
              {logo}
              {title}
            </a>
          )
        }}
        //渲染底部栏
        footerRender={() => {
          return <GlobalFooter />
        }}
        onMenuHeaderClick={(e) => console.log(e)}
        //定义有哪些菜单
        menuDataRender={() => {
          return getAccessibleMenus(loginUser, menus)
        }}
        //定义菜单项的渲染
        menuItemRender={(item, dom) => (
          <Link href={item.path || '/'} target={item.target}>
            {dom}
          </Link>
        )}
      >
        {children}
      </ProLayout>
    </div>
  )
}
