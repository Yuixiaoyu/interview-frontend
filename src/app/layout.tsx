import { AntdRegistry } from '@ant-design/nextjs-registry'
import './globals.css'
import './user/center/index.css'
import Providers from './providers'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  )
}
