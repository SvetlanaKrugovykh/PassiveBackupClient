// src/utils.js
const fs = require('fs')

module.exports.ensureDirectory = function (directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
    console.log(`Catalog ${directoryPath} created`)
  }
}
