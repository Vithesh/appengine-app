'use strict';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import redisClient from './clients/redis_client';

const log = console;

const app: express.Application = express();
app.enable('trust proxy');

app.use(function(req, res, next) {
    try {
        next();
    } catch (err) {
        log.error(err);
        res.sendStatus(500);
    }
});

app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.raw({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// parse application/json
app.use(bodyParser.json({ limit: '50mb' }));

app.options('*', cors());

app.get('/', (req, res) => {
    res.status(200).send('OK!');
});

app.get('/incr', async (req, res) => {
    try {
        const key = 'random_key';
        const value = await redisClient.getAsync(key);
        await redisClient.setAsync(key, (parseInt(value || 0) + 1).toString());
        res.json({[key]: value});
    } catch (e) {
        log.error(e);
        res.status(500).send(e.message);
    }
});

app.get('/ping', async(req, res) => {
    log.info('Keep alive -- pong!');
    res.status(200).send('pong!');
});

app.get('/_ah/warmup', (req, res) => {
    log.info('Warming up!');
    res.status(200).send('OK!');
});

app.use(function(req, res) {
    // catch all 404s
    res.status(404);
    res.jsonp({
        msg: 'Not found'
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    log.info(`App listening on port ${PORT}`);
});
server.setTimeout(600000);
