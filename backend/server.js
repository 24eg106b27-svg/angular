const express = require('express');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ message: 'Backend connected' });
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
