const fs = require('fs')
const path = require('path')
const { protocol } = require('electron')

const basedir = path.resolve(path.join(__dirname, '..'))


function registerScheme(scheme) {
  protocol.registerSchemesAsPrivileged([{ scheme, privileges: { secure: true, standard: true } }])
}


function createProtocol(scheme) {
  protocol.registerBufferProtocol(scheme, (request, respond) => {
    let pathName = new URL(request.url).pathname
    pathName = decodeURI(pathName) // Needed in case URL contains spaces

    if (!fs.statSync(path.join(basedir, pathName)).isFile()) {
      pathName = 'index.html'
    }

    fs.readFile(path.join(basedir, pathName), (error, data) => {
      if (error) {
        console.error(`Failed to read ${pathName} on ${scheme} protocol`, error)
      }
      const extension = path.extname(pathName).toLowerCase()
      let mimeType = ''

      if (extension === '.js') {
        mimeType = 'text/javascript'
      } else if (extension === '.html') {
        mimeType = 'text/html'
      } else if (extension === '.css') {
        mimeType = 'text/css'
      } else if (extension === '.svg' || extension === '.svgz') {
        mimeType = 'image/svg+xml'
      } else if (extension === '.json') {
        mimeType = 'application/json'
      }

      respond({ mimeType, data })
    })
  },
    error => {
      if (error) {
        console.error(`Failed to register ${scheme} protocol`, error)
      }
    }
  )
}

module.exports = {
  registerScheme,
  createProtocol,
}
