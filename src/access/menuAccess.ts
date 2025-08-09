import { MenuDataItem } from "@ant-design/pro-components";
import menus from "../../config/menu";
import checkAccess from "./checkAccess";

/**
 * 获取可访问，有权限的菜单
 * @param loginUser 
 * @param menuItems 
 * @returns 
 */
const getAccessibleMenus = (loginUser: API.LoginUserVO, menuItems: MenuDataItem[] = menus) => {
  return menuItems.filter((item:MenuDataItem) => {
    if (!checkAccess(loginUser, item.access)) {
      return false;
    }
    if (item.children) {
      item.children = getAccessibleMenus(loginUser, item.children);
    }
    return true;
  })
}

export default getAccessibleMenus;
