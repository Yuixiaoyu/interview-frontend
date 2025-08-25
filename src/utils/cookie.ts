/**
 * Cookie 工具函数
 */

/**
 * 获取指定名称的cookie值
 * @param name cookie名称
 * @returns cookie值，如果不存在返回null
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // 服务端渲染时返回null
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  
  return null;
}

/**
 * 设置cookie
 * @param name cookie名称
 * @param value cookie值
 * @param days 过期天数，默认7天
 */
export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') {
    return; // 服务端渲染时直接返回
  }
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * 删除cookie
 * @param name cookie名称
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') {
    return; // 服务端渲染时直接返回
  }
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * 获取认证token
 * @returns token值
 */
export function getAuthToken(): string | null {
  // 常见的token cookie名称
  const tokenNames = ['token', 'authToken', 'access_token', 'jwt_token'];
  
  for (const tokenName of tokenNames) {
    const token = getCookie(tokenName);
    if (token) {
      return token;
    }
  }
  
  return null;
}
