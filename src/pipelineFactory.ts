import { Middleware, ParsedArgs, MiddlewareContext, NextHandler } from './common/types'

export const makePipeline = (middlewares: Middleware[]) => async (
  args: ParsedArgs,
): Promise<void> => {
  if (!middlewares || !middlewares.length) {
    return
  }

  let next: NextHandler = null
  for (let i = middlewares.length - 1; i > 0; i--) {
    const nextCapture = next
    next = context => middlewares[i].handle(context, nextCapture)
  }

  const context: MiddlewareContext = {
    args,
  }
  await middlewares[0].handle(context, next)
}
