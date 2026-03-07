'use client'

import React, { useCallback, useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { usePathname } from 'next/navigation'
import BasicLayout from '@/layouts/basicLayout'
import store, { AppDispatch } from '@/stores'
import { getLoginUser } from '@/api/userController'
import { setLoginUser } from '@/stores/loginUser'
import AccessLayout from '@/access/AccessLayout'

const InitLayout: React.FC<
  Readonly<{
    children: React.ReactNode
  }>
> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const pathname = usePathname()

  const doInitLoginUser = useCallback(async () => {
    if (pathname.startsWith('/user/login') || pathname.startsWith('/user/register')) {
      return
    }

    const res = await getLoginUser()
    if (res.data) {
      dispatch(setLoginUser(res.data as API.LoginUserVO))
    }
  }, [dispatch, pathname])

  useEffect(() => {
    doInitLoginUser()
  }, [doInitLoginUser])

  return children
}

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Provider store={store}>
      <InitLayout>
        <BasicLayout>
          <AccessLayout>{children}</AccessLayout>
        </BasicLayout>
      </InitLayout>
    </Provider>
  )
}
