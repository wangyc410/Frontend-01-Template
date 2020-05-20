const net = require('net');
const parser = require('./parser');
const enumContentType = {
    form: 'application/x-www-form-urlencoded',
    json: 'application/json'
}
class Request {
    // method, url = host + port + path
    // body: k/v
    // headers
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.path = options.path || '/';
        this.port = options.port || 80;
        this.body = options.body || {};
        this.headers = options.headers || {};
        if (!this.headers['Content-Type']) {
            this.headers['Content-Type'] = enumContentType.form;
        }

        switch (this.headers['Content-Type']) {
            case enumContentType.json:
                this.bodyText = JSON.stringify(this.body);
                break;
            case enumContentType.form:
                this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&')
                break;
            default:
                break;
        }
        this.headers['Content-Length'] = this.bodyText.length;
    }
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`;
    }
    send(connection) {
        return new Promise((resolve, reject) => {
            const parse = new ResponsePasrser;
            if (connection) {
                connection.write(this.toString())
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString());
                })
            }
            connection.on('data', (data) => {
                parse.receive(data.toString());
                if (parse.isFinished) {
                    resolve(parse.response)
                }
                // console.log(data);
                // console.log(parse.stausLine);
                // console.log(parse.headers);
                // resolve(data.toString());
                connection.end();
            });
            connection.on('error', (err) => {
                reject(err);
                connection.end();
            });
        })

    }
}
class Response {

}

class ResponsePasrser {
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE;
        this.stausLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;
    }
    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }
    get response() {
        this.stausLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }
    receive(string) {
        for (let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }
    receiveChar(char) {
        switch (this.current) {
            case this.WAITING_STATUS_LINE:
                if (char === '\r') {
                    this.current = this.WAITING_STATUS_LINE_END;
                } else if (char === '\n') {
                    this.current = this.WAITING_HEADER_NAME;
                } else {
                    this.stausLine += char;
                }
                break;
            case this.WAITING_STATUS_LINE_END:
                if (char === '\n') {
                    this.current = this.WAITING_HEADER_NAME;
                }
                break;
            case this.WAITING_HEADER_NAME:
                if (char === ':') {
                    this.current = this.WAITING_HEADER_SPACE;
                } else if (char === '\r') {
                    this.current = this.WAITING_HEADER_BLOCK_END;
                    if (this.headers['Transfer-Encoding'] === 'chunked') {
                        this.bodyParser = new ThunkedPasrser();
                    }
                } else {
                    this.headerName += char;
                }
                break;
            case this.WAITING_HEADER_SPACE:
                if (char === ' ') {
                    this.current = this.WAITING_HEADER_VALUE;
                }
                break;
            case this.WAITING_HEADER_VALUE:
                if (char === '\r') {
                    this.current = this.WAITING_HEADER_LINE_END;
                    this.headers[this.headerName] = this.headerValue;
                    this.headerName = '';
                    this.headerValue = '';
                } else {
                    this.headerValue += char;
                }
                break;
            case this.WAITING_HEADER_LINE_END:
                if (char === '\n') {
                    this.current = this.WAITING_HEADER_NAME;
                }
                break;
            case this.WAITING_HEADER_BLOCK_END:
                if (char === '\n') {
                    this.current = this.WAITING_BODY;
                }
                break
            case this.WAITING_BODY:
                this.bodyParser.receiveChar(char);
                break;
            default:
                break;
        }
    }
}

class ThunkedPasrser {
    constructor() {
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_THUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;

        this.current = this.WAITING_LENGTH;
    }
    receiveChar(char) {
        switch (this.current) {
            case this.WAITING_LENGTH:
                if (char === '\r') {
                    if (this.length === 0) {
                        this.isFinished = true;
                    }
                    this.current = this.WAITING_LENGTH_LINE_END;
                } else {
                    this.length *= 16;
                    this.length += parseInt(char, 16);
                }
                break;
            case this.WAITING_LENGTH_LINE_END:
                if (char === '\n') {
                    this.current = this.READING_THUNK;
                }
                break;
            case this.READING_THUNK:
                this.content.push(char);
                this.length--;
                if (this.length === 0) {
                    this.current = this.WAITING_NEW_LINE;
                }
                break;
            case this.WAITING_NEW_LINE:
                if (char === '\r') {
                    this.current = this.WAITING_NEW_LINE_END;
                }
                break;
            case this.WAITING_NEW_LINE_END:
                if (char === '\n') {
                    this.current = this.WAITING_LENGTH;
                }
                break;
            default:
                break;
        }
    }
}

void async function () {
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        path: '/',
        port: '8088',
        body: {
            name: 'winter'
        },
        headers: {
            'X-Foo2': "customed"
        }
    })
    let response = await request.send();

    let dom = parser.parseHTML(response.body);

    // console.log(response);
    console.log('dom: ', dom);
    // console.log('dom: ' , JSON.stringify(dom, null, '   '))
}()



/*
const client = net.createConnection({
    host: '127.0.0.1',
    port: 8088
}, () => {
    // 'connect' 监听器
    console.log('已连接到服务器');
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        path: '/',
        port: '8088',
        body: {
            name: 'winter'
        },
        headers: {
            'X-Foo2': "customed"
        }
    })
    // console.log(request.toString())
    client.write(request.toString())
    client.write(`
POST / HTTP/1.1\r
Content-Type: application/x-www-form-urlencoded\r
Content-Lenght: 11\r
\r
name=winter`)
});
client.on('data', (data) => {
    console.log(data.toString());
    client.end();
});
client.on('end', () => {
    console.log('已从服务器断开');
});
*/