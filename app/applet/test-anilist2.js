const https = require('https');

https.get('https://anilist.co/api/v2/oauth/authorize?client_id=9999999&response_type=code&redirect_uri=https%3A%2F%2Fais-dev-t7dt6qj2gnntxgv3qsuzxh-95148481163.us-west1.run.app%2Fauth%2Fcallback', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
