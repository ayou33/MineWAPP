const env = process.env.NODE_ENV || 'development'

const devConfig = {
  api: import.meta.env?.VITE_API_BASE || 'https://dev-api.example.com',
}

const prodConfig = {
  api: import.meta.env?.VITE_API_BASE || 'https://api.example.com',
}

export default env === 'production' ? prodConfig : devConfig
