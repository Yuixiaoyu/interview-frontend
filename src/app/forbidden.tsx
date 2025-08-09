import { Button, Result } from "antd"


/**
 * 无权访问页面
 * @returns 403页面
 */
const Forbidden = () => {
  return <Result
  status={403}
    title="403"
    subTitle="对不起，您没有访问权限，请联系管理员"
    extra={
      <Button type="primary" href="/">
        返回首页
      </Button>
    }
  />
}

export default Forbidden
