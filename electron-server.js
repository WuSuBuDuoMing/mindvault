const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const { exec } = require('child_process')

const dev = false
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// 数据库目录：exe 同级目录下的 data 文件夹
const dataDir = path.join(path.dirname(process.execPath), 'data')
const appDir = path.join(path.dirname(process.execPath), 'app')

// 确保数据目录存在
const fs = require('fs')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 设置环境变量
process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${path.join(dataDir, 'dev.db')}`
process.env.NODE_ENV = 'production'

const app = next({ dev, hostname, port, dir: appDir })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> MindVault ready on http://${hostname}:${port}`)
      // 自动打开浏览器
      const startUrl = `http://${hostname}:${port}`
      if (process.platform === 'win32') {
        exec(`start ${startUrl}`)
      } else if (process.platform === 'darwin') {
        exec(`open ${startUrl}`)
      } else {
        exec(`xdg-open ${startUrl}`)
      }
    })
})
