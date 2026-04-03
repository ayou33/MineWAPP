/**
 * File: request.worker.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/13 11:12
 */
import { createWorker } from '@/common/worker'
import { buildCommonParams } from '@/tools/request/common'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import * as R from 'ramda'

type Fallback = (config: AxiosRequestConfig) => Promise<AxiosResponse>

const fetch = createWorker('/worker/fetch.js')

fetch.intercept('get', (args) => {
  const [config] = args as [AxiosRequestConfig]
  config.data = {
    ...buildCommonParams(),
    ...R.pickBy(R.isNotNil, config.data),
  }
  return [config]
})

fetch.intercept('post', (args) => {
  const [config] = args as [AxiosRequestConfig]
  config.data = {
    ...buildCommonParams(),
    ...config.data,
  }
  
  return [config]
})

// 处理 fetch 的返回值 保持与 服务器返回格式一致
fetch.intercept('post', (resp: AxiosResponse & { isFetchResponse?: boolean }) => {
  return resp.isFetchResponse ? {
    data: {
      ...resp,
      success: resp.status === 200,
    }
  } : resp
}, 'after')

export const workerGet = (fallback: Fallback) => fetch.invoke<AxiosResponse, AxiosRequestConfig>('get', fallback)

export const workerPost = (fallback: Fallback) => fetch.invoke<AxiosResponse, AxiosRequestConfig>('post', fallback)
