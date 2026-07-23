const http = require('http');
const url = require('url');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'seu_client_id_google.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'seu_client_secret_google';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3002/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('\n🔗 COPIE E ACESSE ESSA URL NO NAVEGADOR:\n');
console.log(authUrl);
console.log('\n⏳ Aguardando autorização...\n');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/callback') {
    const code = parsedUrl.query.code;

    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n✅ SUCESSO! Copie o Refresh Token abaixo:\n');
        console.log('REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('\n');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>✅ Sucesso!</h1>
              <p>Copie o Refresh Token que apareceu no terminal.</p>
              <p><strong>Você pode fechar esta janela agora.</strong></p>
            </body>
          </html>
        `);

        server.close();
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro:', error.message);
        res.writeHead(400);
        res.end('Erro: ' + error.message);
        server.close();
        process.exit(1);
      }
    }
  } else {
    res.writeHead(404);
    res.end('Não encontrado');
  }
}).listen(3002);

console.log('Servidor aguardando em http://localhost:3002/callback\n');
