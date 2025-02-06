// src/fileManager.js
const axios = require('axios')
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const { ensureDirectory } = require('./utils')
const { fetchAndSaveFile } = require('./fileDownloader')

const TARGET_DIRECTORY = process.env.TARGET_DIRECTORY

module.exports.getFiles = async function (SERVICE_URL, directory, pattern) {
  const dateDirectory = path.join(TARGET_DIRECTORY, getCurrentDateFormatted())
  ensureDirectory(dateDirectory)

  try {
    const response = await axios.post(`${SERVICE_URL}get-files`, {
      queries: [
        { directory, pattern },
      ],
    }, {
      headers: {
        'Authorization': process.env.ACCESS_TOKEN
      },
      timeout: Number(process.env.TIMEOUT) || 600000
    })

    for (const result of response.data) {
      const { matchedFiles } = result

      for (const file of matchedFiles) {
        const { fileName, chunks, content } = file

        if (content) {
          const filePath = path.join(dateDirectory, fileName)
          fs.writeFileSync(filePath, Buffer.from(content, 'base64'))
          console.log(`File ${fileName} saved successfully`)
          await confirmFileDownload(SERVICE_URL, fileName)
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

async function confirmFileDownload(SERVICE_URL, fileName) {
  try {
    await axios.post(`${SERVICE_URL}confirm-file`, {
      fileName: fileName,
    }, {
      headers: {
        'Authorization': process.env.ACCESS_TOKEN
      }
    })
    console.log(`File ${fileName} confirmed`)
  } catch (err) {
    console.error(`Error confirming of file ${fileName}:`, err)
  }
}