/**
 * File: request.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/26 13:44
 */
import { emit } from '@/common/event'
import { EVENTS, isDev, server, USER_ROLE } from '@/config'
import { getMockEntry, MOCK_PREFIX, simulateDelay } from '@/tools/mock'
import application from '@/app/application'
import { axiosGet, axiosPost } from '@/tools/request/request.axios'
import { workerGet, workerPost } from '@/tools/request/request.worker'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { stateFetch, StateFetchConfig } from 'lunzi'

const { send, cancel: _cancel, on: _on } = stateFetch()

export const cancel = _cancel

export const on = _on

const ERROR_CODE = {
  TOKEN_EXPIRED: '00009',
}

type ServerResponse<T> = {
  success: true,
  data: T
} | {
  success: false,
  errorCode: string;
  errorInfo: string;
}

/**
 * 默认的解析器
 */
function dftParser<T> (url: string, resp: AxiosResponse<ServerResponse<T>>) {
  const body = resp.data
  if (url.endsWith('.json')) {
    return body as T
  }
  
  if (body.success) {
    return body.data
  }
  
  if (body.errorCode === ERROR_CODE.TOKEN_EXPIRED) {
    if (application.role() === USER_ROLE.GUEST) {
      return null as T
    }
    
    emit(EVENTS.TOKEN_ERROR)
  }
  
  throw body
}

type Transformer<T, R> = (data: T) => R

type Config = AxiosRequestConfig & StateFetchConfig & {
  baseURL?: string;
}

export type ApiPath = `/${'api' | 'app' | 'lang' | 'news'}/${string}`

/** API path prefixed with `$` to mark it as mockable in dev. */
export type MockPath = `$${ApiPath}`

/**
 * 接收请求并返回一个函数
 * @param request
 * @param parser
 */
export function receive (
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse>,
  parser: <T>(url: ApiPath, resp: AxiosResponse<ServerResponse<T>>) => T = dftParser,
) {
  return <R, P extends Data | undefined = undefined> (url: ApiPath | MockPath, config?: Config) => {
    function doRequest (
      ...[data]: P extends undefined
        ? [data?: null]
        : [data: P]
    ): Promise<R>
    
    function doRequest <T extends Transformer<R, unknown>>(
      ...[data, privateConfig]: P extends undefined
        ? [data?: null, privateConfig?: T]
        : [data: P, privateConfig?: T]
    ): Promise<T extends Transformer<R, infer U> ? U : R>
    
    function doRequest <T extends Config>(
      ...[data, privateConfig]: P extends undefined
        ? [data?: null, privateConfig?: T]
        : [data: P, privateConfig?: T]
    ): Promise<R>
    
    function doRequest <T extends Config | Transformer<R, unknown>> (
      ...[data, privateConfig]: P extends undefined
        ? [data?: null, privateConfig?: T]
        : [data: P, privateConfig?: T]
    ): Promise<T extends Transformer<R, infer U> ? U : R> {
      const isMock = url.startsWith(MOCK_PREFIX)
      const resolvedUrl = (isMock ? url.slice(1) : url) as ApiPath

      // In dev: intercept requests whose URL is prefixed with `$`
      if (isDev && isMock) {
        const entry = getMockEntry(resolvedUrl)
        if (entry) {
          return simulateDelay(entry.options.delay)
            .then(() => entry.handler(data) as R)
            .then(result => {
              console.info(`[mock] Handled "${resolvedUrl}" with mock data:`, result)
              if (typeof privateConfig === 'function') {
                return privateConfig(result) as T extends Transformer<R, infer U> ? U : R
              }
              return result as T extends Transformer<R, infer U> ? U : R
            })
            .catch(e => {
              throw {
                data,
                url: resolvedUrl,
                code: e.code ?? -1,
                message: e.message ?? 'Mock error',
              }
            })
        }
        console.warn(`[mock] No handler registered for "${resolvedUrl}", falling back to real request`)
      }

      const allConfig = {
        ...config,
        ...(typeof privateConfig === 'function' ? {} : privateConfig),
      }
      
      return send(
        request,
        {
          ...allConfig,
          url: (allConfig.baseURL ?? server.api) + resolvedUrl,
          data: {
            ...allConfig?.data,
            ...data,
          },
        },
      )
        .then(resp => {
          const result = parser<R>(resolvedUrl, resp)
          // 如果 privateConfig 是 transformer 函数，则应用转换
          if (typeof privateConfig === 'function') {
            return privateConfig(result) as T extends Transformer<R, infer U> ? U : R
          }
          
          return result as T extends Transformer<R, infer U> ? U : R
        })
        .catch(e => {
          throw {
            data,
            url: resolvedUrl,
            code: e.code ?? e.errorCode ?? e.status ?? -1,
            message: e.message ?? e.errorInfo ?? e.statusText ?? 'Unrecognized error',
          }
        })
    }
    
    return doRequest
  }
}

export type Pagination = {
  pageSize: number;
  pageNum: number;
}

/**
 * get 请求
 */
export const get = receive(workerGet(axiosGet))

/**
 * post 请求
 */
export const post = receive(workerPost(axiosPost))
