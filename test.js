const fs = require('fs')

// 读数据库
let userStr = fs.readFileSync('./db/users.json').toString()
let userArr = JSON.parse(userStr)
console.log('userArr:', userArr)

// 写数据库
const user3 = {"id": 3, "name": "tom", "password": "zzz"}
userArr.push(user3)
userStr = JSON.stringify(userArr)
console.log('userStr:', userStr)
fs.writeFileSync('./db/users.json', userStr)