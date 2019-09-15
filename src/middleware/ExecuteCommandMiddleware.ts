import execa from 'execa'
import { Middleware, MiddlewareContext, ParsedArgs } from '../common/types'

export class ExecuteCommandMiddleware implements Middleware {
  private readonly command: string
  private readonly isCommandArg: (arg: string) => boolean

  constructor({ command, isCommandArg }: {
    command: string,
    isCommandArg: (arg: string) => boolean,
  }) {
    this.command = command
    this.isCommandArg = isCommandArg
  }

  public async handle(context: MiddlewareContext): Promise<void> {
    const execArgs = this.getExecArgs(context.args)
    this.execComand(execArgs)
  }

  private execComand(execArgs: string[]) {
    console.log(`${this.command} ${execArgs.join(' ')}`)
    execa.sync(this.command, execArgs, {
      stdout: process.stdout,
      stderr: process.stderr,
    })
  }

  private getExecArgs(sourceArgs: ParsedArgs): string[] {
    const execArgs: string[] = []

    for (let [key, value] of Object.entries(sourceArgs)) {
      if (!this.isCommandArg(key) || !value) {
        continue
      }
      if (key === '_') {
        execArgs.push(...value)
        continue
      }

      const prefix = key.length === 1 ? '-' : '--'
      const execKey = `${prefix}${key}`

      const values = Array.isArray(value) ? value : [value]
      values.forEach(execValue => {
        execArgs.push(execKey)
        if (execValue !== true) {
          execArgs.push(execValue)
        }
      })
    }

    return execArgs
  }
}
