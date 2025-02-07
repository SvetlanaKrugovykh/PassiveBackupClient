// src/fileDownloader.js
const axios = require('axios')
const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
require('dotenv').config()
const { getCurrentDateFormatted } = require('./utils')

const ACCESS_TOKEN = process.env.ACCESS_TOKEN
const TARGET_DIRECTORY = process.env.TARGET_DIRECTORY
const dateDirectory = path.join(TARGET_DIRECTORY, getCurrentDateFormatted())

async function deleteChunk(fileName, chunkId) {
  try {
    const chunkPath = path.join(dateDirectory, `${fileName}_chunk_${chunkId}`)
    await fs.access(chunkPath)
    await fs.unlink(chunkPath)

    console.log(`Chunk file ${chunkPath} deleted`)
    return true
  } catch (error) {
    console.error(`Error confirming chunk: ${error.message}`)
    return false
  }
}

module.exports.fetchAndSaveFile = async function (SERVICE_URL, fileName, chunkId, numChunks) {

  try {
    const chunkResponse = await axios.post(`${SERVICE_URL}fetch-chunk`, {
      fileName: fileName,
      chunkId: chunkId.toString(),
    }, {
      headers: {
        'Authorization': ACCESS_TOKEN
      },
      timeout: 120000
    })

    const chunkContent = Buffer.from(chunkResponse.data.content, 'base64')
    const chunkPath = path.join(dateDirectory, `${fileName}_chunk_${chunkId}`)

    fsSync.writeFileSync(chunkPath, chunkContent)
    console.log(`Chunk ${chunkId} saved`)

    await confirmChunkDownload(SERVICE_URL, fileName, chunkId)

    if (chunkId === numChunks) {
      console.log(`Collect file ${fileName} from chunks`)

      const finalFilePath = path.join(dateDirectory, fileName)
      const finalFileStream = fsSync.createWriteStream(finalFilePath)

      for (let i = 1; i <= numChunks; i++) {
        const chunkPath = path.join(dateDirectory, `${fileName}_chunk_${i}`)
        const chunkData = fsSync.readFileSync(chunkPath)
        finalFileStream.write(chunkData)
      }

      finalFileStream.end()

      for (let i = 1; i <= numChunks; i++) {
        await deleteChunk(fileName, i)
      }
      console.log(`File ${fileName} collected and saved at ${finalFilePath}`)
    }
  } catch (err) {
    console.error(`Error while chunk downloading ${chunkId} - file ${fileName}:`, err)

    if (err.code === 'ECONNRESET') {
      console.log(`Retrying chunk download ${chunkId} for file ${fileName}`)
      await fetchAndSaveFile(SERVICE_URL, fileName, chunkId, numChunks)
    }
  }
}

async function confirmChunkDownload(SERVICE_URL, fileName, chunkId) {
  try {
    await axios.post(`${SERVICE_URL}confirm-chunk`, {
      fileName: fileName,
      chunkId: chunkId.toString(),
    }, {
      headers: {
        'Authorization': ACCESS_TOKEN
      }
    })
    console.log(`Chunk ${chunkId} of file ${fileName} confirmed`)
  } catch (err) {
    console.error(`Error confirming chunk ${chunkId} of file ${fileName}:`, err)
  }
}