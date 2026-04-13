/**
 * File: request.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/26 13:44
 *
 * Core request infrastructure — do not edit for project-specific concerns.
 * See request.config.ts for all customisation points.
 */
import { isDev, server } from '@/config'
import { getMockEntry, MOCK_PREFIX, simulateDelay } from '@/tools/mock'
import { axiosGet, axiosPost } from '@/tools/request/request.axios'
import { workerGet, workerPost } from '@/tools/request/request.worker'
import { ApiPath, MockPath, responseParser, ServerResponse } from '@/tools/request/request.config'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { stateFetch, StateFetchConfig } from 'lunzi'

export type { ApiPath, MockPath, ServerResponse } from '@/tools/request/request.config'
export type { Pagination } from '@/tools/request/request.config'

const { send, cancel: _cancel, on: _on } = stateFetch()

export const cancel = _cancel

export const on = _on

type Transformer<T, R> = (data: T) => R

type Config = AxiosRequestConfig & StateFetchConfig & {
  baseURL?: string;
}

/**
 * 接收请求并返回一个函数
 * @param request
 * @param parser
 */
export function receive (
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse>,
  parser: <T>(url: ApiPath, resp: AxiosResponse<ServerResponse<T>>) => T = responseParser,
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

/**
 * get 请求
 */
export const get = receive(workerGet(axiosGet))

/**
 * post 请求
 */
export const post = receive(workerPost(axiosPost))
