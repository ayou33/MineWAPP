/*
 * @Author: 阿佑[ayooooo@petalmail.com]
 * @Date: 2025-12-12 15:57:39
 * @LastEditors: 阿佑[ayooooo@petalmail.com]
 * @LastEditTime: 2025-12-15 15:15:59
 * @FilePath: \claw-eden-ts\scripts\build.ts
 * @Description:
 */
import { execa } from 'execa'
import { env, pkg, nodeEnv } from './parseArgs'
import { logSection, logStep, logOk, logErr, logInfo } from './logger'

logSection('Build')
logInfo(`Package:     ${pkg}`)
logInfo(`Environment: ${nodeEnv}`)

try {
  // 1. Execute vite build
  logStep(1, 3, 'Running vite build...')
  const subprocess = execa('vite', ['build', '--mode', pkg], {
    stdio: 'inherit',
    env: {
      PACKAGE_ENV: pkg,
      NODE_ENV: nodeEnv,
    },
  })

  // 监听 Ctrl+C (SIGINT)
  process.on('SIGINT', () => {
    logInfo('检测到退出信号，正在清理...')

    // 1. 强制杀死子进程
    if (subprocess && !subprocess.killed) {
      subprocess.kill('SIGTERM')
    }

    // 2. 显式显示光标 (防止子进程隐藏了光标后未恢复)
    process.stdout.write('\x1B[?25h')

    // 3. 退出主进程
    process.exit(0)
  })

  await subprocess
  logOk('Vite build complete.')

  // 2. Execute yarn zip-worker
  logStep(2, 3, 'Running zip-worker...')
  await execa('yarn', ['zip-worker'], { stdio: 'inherit' })
  logOk('zip-worker complete.')

  // 3. Execute deploy script
  logStep(3, 3, `Running deploy for ${env}...`)
  await execa('tsx', ['scripts/deploy.ts', `--${pkg}${env}`], { stdio: 'inherit' })

} catch (error) {
  logErr('Build failed.')
  process.exit(1)
}
