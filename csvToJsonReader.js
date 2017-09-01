'use strict'

const _       = require('lodash')
const fs      = require('fs-extra')
const AdmZip  = require('adm-zip')
const path    = require('path')
const csv     = require('fast-csv')
const moment  = require('moment')
const appDir  = path.dirname(require.main.filename)

const users   = []

const unzip = (filepath) => {
  
  return new Promise(resolve => {
    const zip        = new AdmZip(filepath)    
    const extractTo  = `${appDir}/temp`

    zip.extractAllToAsync(extractTo, true, () => {
      resolve(extractTo)      
    })
  })
}

const filepath = 'zipfile/data.zip'

unzip(filepath).then( (dirPath) => {
  const promises = []
  fs.readdir(dirPath, (err, data) => {
    const files = _.filter(data, obj => {

      return path.extname(obj) == '.csv'
    })
    _.forEach(files, (file, index) => {
      const filePath = `${dirPath}/${file}`
      promises.push(csvReader(filePath, (row) => { processRow(row) }))
    })

    Promise.all(promises).then( () => {
      fs.writeFileSync('users.json', JSON.stringify(users))
      fs.removeSync(dirPath)
      console.log('done')
    })
  })
})

const csvReader = (path, processor) => {

  return new Promise((resolve) => {
    const parser = fs.createReadStream(`${path}`)
      .pipe(csv({ headers: true, delimiter: '|' }))
      .on('data', (row) => {
        processor(row)
      })
      .on('end', () => {
        resolve()        
      })
  })
}

const processRow = (row) => {
  const user = {
    name:  `${row.first_name} ${row.last_name}`,
    phone: row.phone.replace(/\D/g, ""),
    person: {
      firstName: row.first_name,
      lastName:  row.last_name      
    },
    amount:        Number(row.amount),
    date:          moment(row.date, 'DD/M/YYYY').format('YYYY-MM-DD'),
    costCenterNum: row.cc.replace(/\D/g, "")    
  }
  users.push(user)
}

