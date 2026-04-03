/**
 * Description: math
 */
import * as R from 'ramda'

type Factor = string | number

const getPrecision = (a: Factor = 0) => ((a.toString().split('.')[1] || []).length)

function _mul (a: Factor, b: Factor) {
  const snReg = /[eE]+/
  const d = a.toString()
  const e = b.toString()
  if (snReg.test(d) || snReg.test(e)) {
    return +a * +b
  }
  
  let c = 0
  c += getPrecision(d)
  c += getPrecision(e)
  
  return Number(d.replace('.', '')) * Number(e.replace('.', '')) / 10 ** c
}

function _sub (a: Factor, b: Factor) {
  const c = getPrecision(a)
  const d = getPrecision(b)
  const e = 10 ** Math.max(c, d)
  return (_mul(a, e) - _mul(b, e)) / e
}

function _div (a: Factor, b: Factor) {
  let e = 0
  let f = 0
  try {
    e = getPrecision(a)
    f = getPrecision(b)
  } catch {
    // precision extraction failed
  }
  const c = Number(a.toString().replace('.', ''))
  const d = Number(b.toString().replace('.', ''))
  return _mul((c / d), 10 ** (f - e))
}

function _add (a: Factor, b: Factor) {
  const c = getPrecision(a)
  const d = getPrecision(b)
  const e = 10 ** Math.max(c, d)
  return (_mul(a, e) + _mul(b, e)) / e
}

const isEven = R.pipe(R.length, R.modulo(R.__, 2), R.equals(0))

const completeWith = (x: Factor) => R.ifElse(isEven, R.identity, R.append(x))

const isNothing = R.either(R.isNil, R.isEmpty)

const correctParamTo = (act: (...args: Factor[]) => number, right: Factor) => R.pipe(
  R.pair,
  R.map(R.ifElse(isNothing, R.always(right), R.identity)),
  R.apply(act),
)

const binaryReduce = (acc: number, act: (...args: Factor[]) => number) => R.unapply(
  R.pipe(
    completeWith(acc),
    R.splitEvery(2),
    R.reduce<Factor[], number>(R.useWith(act, [R.identity, R.apply(act)]))(acc),
  ),
)

export const mul: (...args: Factor[]) => number = binaryReduce(1, correctParamTo(_mul, 1))

export const add: (...args: Factor[]) => number = binaryReduce(0, correctParamTo(_add, 0))

export const sub: (a: Factor, b: Factor) => number = R.curryN(2, correctParamTo(_sub, 0))

export const div: (a: Factor, b: Factor) => number = R.curryN(2, correctParamTo(_div, 1))

export const percent = (a = 0) => div(a, 100)
