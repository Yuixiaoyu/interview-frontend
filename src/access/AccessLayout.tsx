import { RootState } from "@/stores";
import { usePathname } from "next/navigation"
import { useSelector } from "react-redux";
import { findAllMenuItemByPath } from "../../config/menu";
import ACCESS_ENUM from "./accessEnum";
import checkAccess from "./checkAccess";
import Forbidden from "@/app/forbidden";

/**
 * 全局权限拦截器
 * @param children
 * @returns
 */
const AccessLayout: React.FC<
  Readonly<{
    children: React.ReactNode
  }>
> = ({ children }) => {
  const pathname = usePathname();

  //获取当前登陆用户
  const loginUser = useSelector((state: RootState) => state.loginUser);
  //获取当前路径需要的权限
  const menu = findAllMenuItemByPath(pathname);

  const needAccess = menu?.access ?? ACCESS_ENUM.NOT_LOGIN;

  //校验权限
  const canAccess= checkAccess(loginUser,needAccess);

  if (!canAccess) {
    return <Forbidden />
  }

  return children
  }

  export default AccessLayout