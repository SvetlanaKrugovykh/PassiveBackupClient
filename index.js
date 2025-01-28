const { getFiles } = require('./src/fileManager')
const { ensureDirectory } = require('./src/utils')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function main() {
  const TARGET_DIRECTORY = process.env.TARGET_DIRECTORY
  ensureDirectory(TARGET_DIRECTORY)

  const configPath = path.join(__dirname, 'data', 'config.json')
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

  for (const serverConfig of configData) {
    const SERVICE_URL = serverConfig.SERVICE_URL

    for (const { directory, patterns } of serverConfig.dirs_and_patterns) {
      for (const pattern of patterns) {
        await getFiles(SERVICE_URL, directory, pattern)
      }
    }
  }
}

main()