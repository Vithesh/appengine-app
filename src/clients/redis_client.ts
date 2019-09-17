import * as redis from 'redis';
import * as bluebird from 'bluebird';
import defaults from '../config';

const log = console;

log.info(`Redis host => ${defaults.redis.host} port ${defaults.redis.port}`);
const client = bluebird.promisifyAll(redis.createClient({
    host: defaults.redis.host,
    port: defaults.redis.port,
    enable_offline_queue: false,
    retry_strategy:  (options) => {
        log.info(options);
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 30) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 1000);
    }
}));

client.on('error', err => {
    log.error('error connecting redis');
    log.error(err);
});
client.on('connect', () => log.info('connected to redis'));
client.on('ready', () => log.info('redis is ready'));
client.on('reconnecting', (a) => {
    log.warn(a);
    log.info('reconnecting to redis');
});

export default client;
