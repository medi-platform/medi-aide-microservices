FROM node:20-alpine

WORKDIR /app

# Create a simple test app
RUN echo '{"name":"test","version":"1.0.0","dependencies":{"reflect-metadata":"^0.2.2"}}' > package.json && \
    echo 'require("reflect-metadata"); console.log("Test service started on port 3000"); const http = require("http"); http.createServer((req, res) => { if(req.url === "/health") { res.writeHead(200); res.end("OK"); } else { res.writeHead(404); res.end(); }}).listen(3000);' > server.js && \
    npm install

RUN addgroup -g 10001 app && \
    adduser -u 10001 -G app -s /bin/sh -D app

USER app

EXPOSE 3000

CMD ["node", "server.js"]
