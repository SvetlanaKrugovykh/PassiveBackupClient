// src/fileManager.js
const axios = require('axios')
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const { fetchAndSaveFile } = require('./fileDownloader')

module.exports.getFiles = async function (SERVICE_URL, directory, pattern) {
  const TARGET_DIRECTORY = process.env.TARGET_DIRECTORY

  try {
    const response = await axios.post(`${SERVICE_URL}get-files`, {
      queries: [
        { directory, pattern },
      ],
    }, {
      headers: {
        'Authorization': process.env.ACCESS_TOKEN
      }
    })

    for (const result of response.data) {
      const { matchedFiles } = result

      for (const file of matchedFiles) {
        const { fileName, chunks, content } = file

        if (content) {
          const filePath = path.join(TARGET_DIRECTORY, fileName)
          fs.writeFileSync(filePath, Buffer.from(content, 'base64'))
          console.log(`File ${fileName} saved successfully`)
        } else if (chunks && chunks.length > 0) {
          for (const chunk of chunks) {
            await fetchAndSaveFile(SERVICE_URL, chunk.fileName, chunk.chunkId, chunk.numChunks)
          }
        } else {
          console.log(`File ${fileName} downloaded completely`)
        }
      }
    }
  } catch (err) {
    console.error('Error getting files:', err)
  }
}
