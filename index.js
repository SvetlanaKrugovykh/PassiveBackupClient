const { getFiles } = require('./src/fileManager')
const { ensureDirectory } = require('./src/utils')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function main() {
  const TARGET_DIRECTORY = process.env.TARGET_DIRECTORY
  ensureDirectory(TARGET_DIRECTORY)

  const dataDir = path.join(__dirname, 'data')
  const configFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'))

  for (const configFile of configFiles) {
    try {
      const configPath = path.join(dataDir, configFile)
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

      for (const serverConfig of configData) {
        const SERVICE_URL = serverConfig.SERVICE_URL

        for (const { directory, patterns } of serverConfig.dirs_and_patterns) {
          for (const pattern of patterns) {
            try {
              await getFiles(SERVICE_URL, directory, pattern)
            } catch (err) {
              console.error(`Error getting files for pattern ${pattern} in directory ${directory}:`, err)
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error processing config file ${configFile}:`, err)
    }
  }
}

main()