/// <reference types="solid-js" />

declare type VoidFn = () => void

declare type AnyFn = (...args: any[]) => any

declare type Key = string | number | symbol

declare type Data<T = any> = Record<string, T>

declare enum YN {
  N = 0,
  Y = 1
}

declare type InheritProps<T extends Record<string, unknown> = Data, U extends Element = HTMLDivElement> = T & Partial<{
  ref: U | ((el: U) => void);
  class: classNames.Argument;
  style: Data<string | number>;
  onClick: AnyFn;
}>

declare type Values<T> = T[keyof T]

declare type NotNull<T> = T extends null | undefined ? never : T

declare type Last<T extends any[]> = T extends [...infer _, infer U] ? U : never

declare type First<T extends any[]> = T extends [infer U, ...any[]] ? U : never

declare type Tail<T extends any[]> = T extends [any, ...infer U] ? U : never

declare type TailParams<T extends AnyFn> = Tail<Parameters<T>>

declare type PromiseFn<T = any> = (...args: any[]) => Promise<T>

declare type PromiseFnReturn<T> = T extends PromiseFn<infer R> ? R : never

declare type PropsOf<T> = T extends (props: infer P) => any ? P : never

declare interface Date {
  format2: (pattern: string) => string
}
