import { uuidV4 } from '@/common'

export const APP_REQUEST_LABEL = uuidV4()

const u = navigator.userAgent

export const isAndroid = u.includes('Android') || u.includes('Linux')

export const isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)

export const isPC = !isAndroid && !isIOS

export const isTest = process.env.NODE_ENV === 'test'

export const isProd = process.env.NODE_ENV === 'production'

export const isDev = process.env.NODE_ENV === 'development'

export const brand = import.meta.env.VITE_APP_TITLE ?? 'MineAPP'
