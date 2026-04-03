// 该脚本用来解析用户执行脚本的参数
// 2个可选参数 位置可选
// 其中一个参数是环境参数：test/pre/prod
// 另一个微信package参数：ce/cp/web

const args = process.argv.slice(2)

const validEnvs = ['test', 'pre', 'prod']
const validPackages = ['main']

let env = 'test'
let pkg = 'main'

args.forEach(arg => {
  if (validEnvs.includes(arg)) {
    env = arg
  } else if (validPackages.includes(arg)) {
    pkg = arg
  }
})

const nodeEnv = env === 'prod' ? 'production' : env === 'pre' ? 'preview' : 'development'

export { env, pkg, nodeEnv }

