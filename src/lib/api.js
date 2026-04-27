import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:31098'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let unauthorizedHandler = null

export function onUnauthorized(callback) {
  unauthorizedHandler = callback
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartyihui-auth-token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'code' in data && data.code !== 200) {
      const err = new Error(data.msg || '操作失败')
      err.code = data.code
      return Promise.reject(err)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartyihui-auth-token')
      localStorage.removeItem('smartyihui-auth-user')
      unauthorizedHandler?.()
    }
    const msg = error.response?.data?.msg || error.response?.data?.message || error.message || '请求失败'
    const err = new Error(msg)
    err.code = error.response?.data?.code || error.response?.status
    return Promise.reject(err)
  }
)
