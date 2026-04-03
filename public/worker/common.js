/**
 * File: workshop.js of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/11 11:58
 */
const ERROR_CODE = {
  NOT_REGISTERED: 'NOT_REGISTERED',
}

const registerMethods = []

addEventListener('message', e => {
  const { method, callId } = e.data
  if (!registerMethods.includes(method)) {
    postMessage({ error: new Error(ERROR_CODE.NOT_REGISTERED), callId })
  }
})

function registerHandler (name, handler) {
  registerMethods.push(name)
  
  async function listener (e) {
    const { method, args, callId } = e.data
    
    if (name === method) {
      try {
        const result = await handler(...args)
        if (callId) {
          postMessage({ result, callId })
        }
      } catch (error) {
        if (callId) {
          postMessage({ error, callId })
        }
      }
    }
  }
  
  addEventListener('message', listener)
  
  return () => removeEventListener('message', listener)
}

function emit (event, ...args) {
  try {
    postMessage({ event, args })
  } catch (error) {
    console.error(error)
  }
}

function cloneHeaders (headers) {
  const result = {}
  for (const [key, value] of headers.entries()) {
    result[key] = value
  }
  return result
}

function cloneResponse (resp) {
  return {
    status: resp.status,
    statusText: resp.statusText,
    headers: cloneHeaders(resp.headers),
    config: {
      url: resp.url,
    },
  }
}

function convertObjectToFormData (obj) {
  const formData = new FormData()
  for (const key in obj) {
    formData.append(key, obj[key])
  }
  return formData
}

function createSignal (id) {
  if (id) {
    const controller = new AbortController()
    const off = registerHandler('abort', (signalId, reason) => {
      if (id === signalId) {
        controller.abort(reason)
        off()
      }
    })
    return controller.signal
  }
}

function idMaker () {
  let id = 0
  return () => id++
}

function logFor (tag) {
  return (...args) => console.log(`%cWebWorker:${tag}`, 'text-decoration: underline;', ...args)
}
