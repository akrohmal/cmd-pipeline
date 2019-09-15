export interface ParsedArgs {
  _: string[]
  [key: string]: any
}

export interface MiddlewareContext {
  args: ParsedArgs
}

export type NextHandler = (context: MiddlewareContext) => Promise<void>
export type MiddlewareHandler = (context: MiddlewareContext, next: NextHandler) => Promise<void>

export interface Middleware {
  handle: MiddlewareHandler
}
