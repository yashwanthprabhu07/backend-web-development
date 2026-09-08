/**
 * articles-api — STARTER (scattered state)
 *
 * This app demonstrates the supporting layers from the lesson.
 *
 * Your job (see question.md):
 *   1. Keep validation chains in validators/article.validator.js
 *   2. Keep shared helpers in utils/
 *   3. Keep environment configuration in config/index.js
 *   4. Keep .env.example committed and .env ignored
 *
 * Run it with:  npm start
 */

const express = require('express');
const articlesRouter = require('./routes/articles');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const app = express();
app.use(express.json());

app.use('/articles', articlesRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`articles-api listening on http://localhost:${config.port}`);
});

module.exports = app;
