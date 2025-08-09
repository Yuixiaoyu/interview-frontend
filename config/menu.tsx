import { MenuDataItem } from '@ant-design/pro-layout'
import {
  CrownOutlined,
  DesktopOutlined,
  FileTextOutlined,
  FolderOpenOutlined, RadarChartOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import ACCESS_ENUM from '@/access/accessEnum'

// 菜单列表
const menus = [
  {
    path: '/start',
    name: '主页',
    icon: <DesktopOutlined />,
  },
  {
    path: '/interview',
    name: 'AI智能面试',
    icon: <VideoCameraOutlined />,
  },
  {
    path: '/analyze',
    name: '面试分析',
    icon: <RadarChartOutlined />,
  },
  {
    path: '/banks',
    name: '题库',
    icon: <FolderOpenOutlined />
  },
  {
    path: '/questions',
    name: '题目',
    icon: <FileTextOutlined />
  },
  {
    path: '/admin',
    name: '管理',
    icon: <CrownOutlined />,
    access: ACCESS_ENUM.ADMIN,
    children: [
      {
        path: '/admin/user',
        name: '用户管理',
        access: ACCESS_ENUM.ADMIN,
      },
      {
        path: '/admin/bank',
        name: '题库管理',
        access: ACCESS_ENUM.ADMIN,
      },
      {
        path: '/admin/question',
        name: '题目管理',
        access: ACCESS_ENUM.ADMIN,
      },
    ],
  },
] as MenuDataItem[]

// 导出
export default menus

//根据全部路径查找菜单
export const findAllMenuItemByPath = (path: string): MenuDataItem | null => {
  return findMenuItemByPath(menus, path)
}

//根据路径查找菜单项（递归）
export const findMenuItemByPath = (menus: MenuDataItem[], path: string): MenuDataItem | null => {
  for (const menu of menus) {
    if (menu.path === path) {
      return menu
    }
    if (menu.children) {
      const find = findMenuItemByPath(menu.children, path)
      if (find) {
        return find
      }
    }
  }
  return null
}
