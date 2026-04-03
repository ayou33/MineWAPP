/**
 * File: fetch.js of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/11 11:57
 */
importScripts('common.js')

const log = logFor('fetch')

/**
 * @param resolve {function}
 * @param reject {function}
 * @return {(function(*): void)|*}
 */
function handleResponse (resolve, reject) {
  /**
   * @param resp {Response}
   */
  return function (resp) {
    log('response', resp)
    
    if (resp.ok) {
      resp.json()
        .then(json => {
          resolve({
            ...cloneResponse(resp),
            data: json,
          })
        })
        .catch(() => {
          resolve({
            ...cloneResponse(resp),
            data: null,
            isFetchResponse: true,
          })
        })
    } else {
      reject(cloneResponse(resp))
    }
  }
}

function objectToUrlParams (obj) {
  const params = new URLSearchParams()

  Object.keys(obj).forEach(key => {
    const value = obj[key]
    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, item))
    } else {
      params.set(key, value)
    }
  })

  return params.toString()
}

registerHandler('get', config =>
  new Promise((resolve, reject) => {
    log('get', config)
    log('get url', config.url)
    
    fetch(config.url + '?' + objectToUrlParams(config.data), {
      credentials: 'same-origin',
      signal: createSignal(config.signal),
    })
      .then(handleResponse(resolve, reject))
      .catch(reject)
  }))

registerHandler('post', async config =>
  new Promise((resolve, reject) => {
    log('post', config)
    
    fetch(config.url, {
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
      body: convertObjectToFormData(config.data),
      method: 'POST',
      signal: createSignal(config.signal),
    })
      .then(handleResponse(resolve, reject))
      .catch(reject)
  }))
