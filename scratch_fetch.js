const https = require('https');

https.get('https://loanlink-server-eight.vercel.app/availableLoans', (res) => {
  let data = '';
  console.log('Status Code:', res.statusCode);
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('Body:', data); });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
