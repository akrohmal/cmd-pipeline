import path from 'path'
import fs from 'fs'
import merge from 'deepmerge'
import { Middleware, MiddlewareContext, NextHandler, ParsedArgs } from '../common/types'

export class TransformJsonConfigMiddleware implements Middleware {
  private readonly outDir: string
  private readonly getConfigPath: (args: ParsedArgs) => string
  private readonly setConfigPath: (args: ParsedArgs, configPath: string) => ParsedArgs

  constructor({ outDir, getConfigPath, setConfigPath }: {
    outDir: string,
    getConfigPath: (args: ParsedArgs) => string,
    setConfigPath: (args: ParsedArgs, configPath: string) => ParsedArgs,
  }) {
    this.outDir = path.resolve(outDir)
    this.getConfigPath = getConfigPath
    this.setConfigPath = setConfigPath
  }

  public async handle(context: MiddlewareContext, next: NextHandler): Promise<void> {
    const { args } = context

    const resultConfigPath = this.transformConfig(args)
    console.info(`Result config file: ${resultConfigPath}`)

    const resultContext = {
      ...context,
      args: this.setConfigPath(args, resultConfigPath),
    }
    await next(resultContext)
  }

  private transformConfig(args: ParsedArgs): string {
    const sourceConfigPath = this.getSourceConfigPath(args)
    console.info(`Source config file: ${sourceConfigPath}`)

    const transformPath = this.getTransformPath(args, sourceConfigPath)
    console.info(`Transform file: ${transformPath}`)

    if (!transformPath) {
      return sourceConfigPath
    }

    const sourceConfig = require(sourceConfigPath)
    const transform = require(transformPath)
    const resultConfig = merge(sourceConfig, transform)

    const resultConfigPath = path.join(this.outDir, path.basename(sourceConfigPath))
    const resultConfigJson = JSON.stringify(resultConfig, null, 2)
    fs.mkdirSync(this.outDir, { recursive: true })
    fs.writeFileSync(resultConfigPath, resultConfigJson)

    return resultConfigPath
  }

  private getSourceConfigPath(args: ParsedArgs): string {
    const configPath = path.resolve(this.getConfigPath(args))
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file "${configPath}" not found.`)
    }
    return configPath
  }

  private getTransformPath(args: ParsedArgs, configPath: string): string {
    if (args['x-transform']) {
      const transformPath = path.resolve(args['x-transform'])
      if (!fs.existsSync(transformPath)) {
        throw new Error(`Transform file "${transformPath}" not found.`)
      }
      return transformPath
    }
  
    const stage = args['x-stage']
    if (!stage) {
      return null
    }
  
    const configPathWithoutExtension = configPath.replace(/\.[^\.]+$/, '')
    const getStageTransformPath = (extension: string) => {
      const transformPath = `${configPathWithoutExtension}.${stage}.${extension}`
      return fs.existsSync(transformPath) ? transformPath : null
    }
  
    const transformPath = 
      getStageTransformPath('json') ||
      getStageTransformPath('js')
    if (!transformPath) {
      throw new Error(`Transform file for stage "${stage}" not found.`)
    }
    return transformPath
  }
}
