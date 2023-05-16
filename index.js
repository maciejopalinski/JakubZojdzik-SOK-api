const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const usersRouter = require('./src/routes/users.route');
const challengesRouter = require('./src/routes/challenges.route');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 8080;

app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

const defLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 30, // 30 requests per 10 seconds
    standardHeaders: false, // Disable rate limit info in the `RateLimit-*` headers
    legacyHeaders: true // Enable the `X-RateLimit-*` headers
});

const longLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // 1 requests per minute
    standardHeaders: false, // Disable rate limit info in the `RateLimit-*` headers
    legacyHeaders: true // Enable the `X-RateLimit-*` headers
});

app.use('/', defLimiter);
app.use('/users/register', longLimiter);
app.use('/users/changePassword', longLimiter);
app.use('/users/verifyPass', longLimiter);
app.use('/users/verify', longLimiter);

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' });
});
app.use('/users', usersRouter);
app.use('/challenges', challengesRouter);

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});
