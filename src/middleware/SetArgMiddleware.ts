import { Middleware, MiddlewareContext, ParsedArgs, NextHandler } from '../common/types'

export enum SetArgCollisionStrategy {
  Skip = 'Skip',
  Add = 'Add',
  Rewrite = 'Rewrite',
}

export class SetArgMiddleware implements Middleware {
  private readonly argKey: string
  private readonly argValue: any
  private readonly strategy: (args: ParsedArgs) => ParsedArgs

  private readonly strategyMap: { 
    [key in SetArgCollisionStrategy]: (args: ParsedArgs) => ParsedArgs
  } = {
    Skip: this.executeSkip,
    Add: this.executeAdd,
    Rewrite: this.executeRewrite,
  }

  constructor({ argKey, argValue, strategy }: {
    argKey: string,
    argValue: any,
    strategy: SetArgCollisionStrategy,
  }) {
    this.argKey = argKey
    this.argValue = argValue
    this.strategy = this.strategyMap[strategy]
  }

  public async handle(context: MiddlewareContext, next: NextHandler): Promise<void> {
    const { args } = context
    const resultContext = {
      ...context,
      args: this.strategy(args),
    }
    await next(resultContext)
  }

  private executeSkip(args: ParsedArgs): ParsedArgs {
    return args.hasOwnProperty(this.argKey)
      ? args
      : this.setArg(args)
  }

  private executeAdd(args: ParsedArgs): ParsedArgs {
    return args.hasOwnProperty(this.argKey)
      ? {
        ...args,
        [this.argKey]: [].concat(args[this.argKey], this.argValue),
      }
      : this.setArg(args)
  }

  private executeRewrite(args: ParsedArgs): ParsedArgs {
    return this.setArg(args)
  }

  private setArg(args: ParsedArgs): ParsedArgs {
    return {
      ...args,
      [this.argKey]: this.argValue,
    }
  }
}
