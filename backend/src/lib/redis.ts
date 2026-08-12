import Redis from 'ioredis';
import { env } from '../env';

// All keys are namespaced under "compass:" — this Redis instance is a dedicated
// dev container, but the prefix keeps things safe if it's ever pointed at a
// shared instance in another environment.
export const redis = new Redis(env.REDIS_URL, { keyPrefix: 'compass:' });
