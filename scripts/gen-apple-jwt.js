const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const TEAM_ID    = 'TMG9NMWDP5';
const SERVICE_ID = 'app.begift.mobile.signin';
const KEY_ID     = '3995CHJD4R';
const P8_PATH    = path.join(process.env.HOME, 'Documents/keys/AuthKey_3995CHJD4R.p8');

if (!fs.existsSync(P8_PATH)) {
  console.error(`ERRORE: file .p8 non trovato in ${P8_PATH}`);
  process.exit(1);
}

const privateKey = fs.readFileSync(P8_PATH, 'utf8');
const now = Math.floor(Date.now() / 1000);
const sixMonths = 15777000;

const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: now + sixMonths,
    aud: 'https://appleid.apple.com',
    sub: SERVICE_ID,
  },
  privateKey,
  {
    algorithm: 'ES256',
    keyid: KEY_ID,
  }
);

console.log(token);
