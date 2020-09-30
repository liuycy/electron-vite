const { build } = require('esbuild')
const { spawn } = require('child_process')
const chokidar = require('chokidar')
const electron = require('electron')
const chalk = require('chalk')
const path = require('path')

let electronProcess = null
let manualRestart = false

function startMain() {
  return new Promise((resolve, reject) => {
    const buildConfig = {
      entryPoints: [path.join(__dirname, '../src/main/index.ts')],
      outfile: path.join(__dirname, '../dist/electron/main.js'),
      format: 'cjs',
      platform: 'node',
    }

    build(buildConfig).then(resolve).catch(reject)

    chokidar.watch(path.join(__dirname, '../src/main')).on('change', () => {
      if (electronProcess && electronProcess.kill) {
        manualRestart = true
        process.kill(electronProcess.pid)
        electronProcess = null

        build(buildConfig).then(startElectron).catch(reject)

        setTimeout(() => {
          manualRestart = false
        }, 5000)
      }
    })
  })
}

function startElectron() {
  var args = [
    '--inspect=9063',
    path.join(__dirname, '../dist/electron/main.js'),
  ]

  // detect yarn or npm and process commandline args accordingly
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
  let log = ''
  data = data.toString().split(/\r?\n/)
  data.forEach((line) => {
    log += `  ${line}\n`
  })
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      chalk[color].bold('┏ Electron -------------------') +
        '\n\n' +
        log +
        chalk[color].bold('┗ ----------------------------') +
        '\n'
    )
  }
}

startMain().then(startElectron)
