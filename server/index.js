const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const api = require('./api');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup app-level middlewares
app.use(helmet());
app.use(bodyParser.json());

// Priority serve any static files.
app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

// Answer API requests.
app.use('/api', api);

// All remaining requests return the React app, so it can handle routing.
app.get('*', (request, response) => {
  response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
