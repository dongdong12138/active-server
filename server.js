var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)

    if (path === '/index.html') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        let content = fs.readFileSync('./public/index.html').toString()
        const cookie = request.headers['cookie']
        console.log('cookie:', cookie)
        if (cookie) {       // cookie 存在，表示已登录

            let sessionId
            try {           // 获取 id
                sessionId = cookie.split(';').filter(value => value.indexOf('sessionId') >= 0)[0].split('=')[1]
                console.log('sessionId:', sessionId)
            } catch (err) { }

            if (sessionId) {
                const sessionObj = JSON.parse(fs.readFileSync('./session.json').toString())
                console.log('sessionObj:', sessionObj)
                if (sessionObj[sessionId]) {
                    const { id } = sessionObj[sessionId]
                    const userArr = JSON.parse(fs.readFileSync('./db/users.json').toString())
                    console.log('userArr:', userArr)
                    let userSelf = userArr.filter(value => value.id === Number(id))[0]
                    console.log('userSelf:', userSelf)
                    if (userSelf) {
                        content = content.replace('{{loginStatus}}', userSelf.name)
                    }
                } else {
                    content = content.replace('欢迎，', '')
                    content = content.replace('{{loginStatus}}', '用户不存在')
                }
            }
        } else {        // cookie 不存在，表示未登录
            content = content.replace('欢迎，', '')
            content = content.replace('{{loginStatus}}', '未登录')
        }
        response.write(content)
        response.end()

        return
    }

    // 登录逻辑
    if (path === '/signIn' && method === 'POST') {
        // 读数据库数据
        let userArr = JSON.parse(fs.readFileSync('./db/users.json').toString())
        console.log('userArr:', userArr)

        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const { name, password } = obj
            console.log('name:', name)
            console.log('password:', password)
            const user = userArr.find(value => value.name === name && value.password === password)
            if (user) {
                response.statusCode = 200
                const random = Math.random()
                let sessionObj = JSON.parse(fs.readFileSync('./session.json').toString())
                sessionObj[random] = { id: user.id }
                fs.writeFileSync('./session.json', JSON.stringify(sessionObj))
                response.setHeader('Set-Cookie', `sessionId=${random}; HttpOnly`)
                response.end('登录成功')
            } else {
                response.statusCode = 400
                response.end('{"errCode": "4001", "errMsg": "用户名与密码不匹配"}')
            }
        })

        return
    }

    // 注册逻辑
    if (path === '/register' && method === 'POST') {
        response.setHeader('Content-Type', 'text/html; charset=UTF-8')

        // 读数据库数据
        let userArr = JSON.parse(fs.readFileSync('./db/users.json').toString())
        console.log('userArr:', userArr)

        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const { name, password } = obj
            const lastUser = userArr[userArr.length - 1]
            const user = {
                id: lastUser ? lastUser.id + 1 : 1,
                name,
                password
            }
            userArr.push(user)
            fs.writeFileSync('./db/users.json', JSON.stringify(userArr))
            console.log('user:', user)
            response.end('很好')
        })

        return
    }

    response.statusCode = 200
    // 默认首页
    const filePath = path === '/' ? '/index.html' : path
    const index = filePath.lastIndexOf('.')
    // suffix 是后缀
    const suffix = filePath.substring(index)
    const fileTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg'
    }
    response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
    let content
    try {
        content = fs.readFileSync(`./public${filePath}`)
    } catch (error) {
        content = '文件不存在'
        response.statusCode = 404
    }
    response.write(content)
    response.end()

    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)