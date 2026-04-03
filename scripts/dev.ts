/*
 * @Author: 阿佑[ayooooo@petalmail.com]
 * @Date: 2025-12-12 15:57:39
 * @LastEditors: 阿佑[ayooooo@petalmail.com]
 * @LastEditTime: 2025-12-15 15:14:50
 * @FilePath: \claw-eden-ts\scripts\dev.ts
 * @Description: 
 */
import { execa } from 'execa'
import { pkg, nodeEnv } from './parseArgs'
import { logSection, logInfo } from './logger'

logSection('Dev Server')
logInfo(`Package:     ${pkg}`)
logInfo(`Environment: ${nodeEnv}`)

// Run vite with the selected mode
try {
  const subprocess = execa('vite', ['--mode', pkg], {
    stdio: 'inherit',
    env: {
      PACKAGE_ENV: pkg,
      NODE_ENV: nodeEnv,
    },
  })

  // 监听 Ctrl+C (SIGINT)
  process.on('SIGINT', () => {
    logInfo('检测到退出信号，正在清理...')
    if (subprocess && !subprocess.killed) {
      subprocess.kill('SIGTERM')
    }

    // 2. 显式显示光标 (防止子进程隐藏了光标后未恢复)
    process.stdout.write('\x1B[?25h') 
    
    // 3. 退出主进程
    process.exit(0)
  })
} catch (error) {
  process.exit(1)
}

