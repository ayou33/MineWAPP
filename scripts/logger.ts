/**
 * File: logger.ts of 船新版本
 * Author: 阿佑[ayooooo@petalmail.com]
 * Shared logging utilities for build scripts.
 */
import chalk from 'chalk'

export const SEP = chalk.dim('─'.repeat(60))

/** Print a titled section divider */
export const logSection = (title: string) =>
  console.log(`\n${SEP}\n${title}\n${SEP}`)

/** Print a numbered step, e.g. [1/2] message */
export const logStep = (step: string | number, total: string | number, msg: string) =>
  console.log(chalk.cyan(`[${step}/${total}] `) + msg)

/** ✓ Success message */
export const logOk = (msg: string) => console.log(chalk.green('  ✓ ') + msg)

/** · Informational message */
export const logInfo = (msg: string) => console.log(chalk.dim('  · ') + msg)

/** ⚠ Warning message */
export const logWarn = (msg: string) => console.log(chalk.yellow('  ⚠ ') + msg)

/** ✗ Error message */
export const logErr = (msg: string) => console.log(chalk.red('  ✗ ') + msg)

/** Generic log (plain console.log passthrough) */
export const log = (...args: any[]) => console.log(...args)
