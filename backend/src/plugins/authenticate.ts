import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing bearer token' });
  }

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    request.userId = payload.sub;
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
