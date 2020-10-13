import chalk from 'chalk'
import electron from 'electron'
import chokidar from 'chokidar'
import { build } from 'esbuild'
import { createServer } from 'vite'

import path from 'path'
import { spawn } from 'child_process'

let electronProcess = null
let manualRestart = false

function startRenderer() {
  return new Promise((resolve) => {
    createServer({
      root: path.join(__dirname, '../src/renderer'),
    }).listen(8080, resolve)
  })
}

function startMain() {
  return new Promise((resolve, reject) => {
    const config = {
      entryPoints: [path.join(__dirname, '../src/main/index.js')],
      outfile: path.join(__dirname, '../dist/main.js'),
      define: { IS_DEV: 'true' },
      platform: 'node',
      format: 'cjs',
    }

    build(config).then(resolve).catch(reject)

    chokidar.watch(path.join(__dirname, '../src/main')).on('change', () => {
      if (electronProcess && electronProcess.kill) {
        manualRestart = true
        process.kill(electronProcess.pid)
        electronProcess = null

        build(config).then(startElectron).catch(reject)

        setTimeout(() => {
          manualRestart = false
        }, 5000)
      }
    })
  })
}

function startElectron() {
  var args = [path.join(__dirname, '../dist/main.js')]

  if (process.env.npm_execpath.endsWith('yarn.js')) {
    args = args.concat(process.argv.slice(3))
  } else if (process.env.npm_execpath.endsWith('npm-cli.js')) {
    args = args.concat(process.argv.slice(2))
  }

  electronProcess = spawn(electron, args)

  electronProcess.stdout.on('data', (data) => {
    electronLog(data, 'blue')
  })
  electronProcess.stderr.on('data', (data) => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

function electronLog(data, color) {
  const content = data.toString()
  if (/[0-9A-z]+/.test(content)) {
    process.stdout.write(`${chalk[color].bold('[electron]')} ${content}`)
  }
}

function init() {
  Promise.all([startRenderer(), startMain()]).then(startElectron)
}

init()
