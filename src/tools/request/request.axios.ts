/**
 * File: request.axios.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/13 11:11
 */
import { buildCommonParams } from '@/tools/request/request.config'
import axios, { AxiosRequestConfig } from 'axios'

function extendFormData (form: FormData, obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    form.append(key, obj[key] as string)
  })
  
  return form
}

/**
 * 在请求中添加时间戳
 */
axios.interceptors.request.use(config => {
  const publicRequestBody = buildCommonParams()
  
  if (config.method === 'get') {
    config.params = {
      ...publicRequestBody,
      ...config.params,
    }
  }
  
  if (config.method === 'post') {
    if (config.data instanceof FormData) {
      config.data = extendFormData(config.data, publicRequestBody)
    } else {
      config.data = {
        ...publicRequestBody,
        ...config.data,
      }
    }
  }
  
  return config
})

export const axiosGet = (config: AxiosRequestConfig) =>
  axios({
    ...config,
    method: 'get',
    params: config.data,
  })

export const axiosPost = (config: AxiosRequestConfig) =>
  axios({
    ...config,
    method: 'post',
  })
