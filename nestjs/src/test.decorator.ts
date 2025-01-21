import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from './auth/dto/token-payload';

export const GetUserPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Assuming user is attached to the request object
  },
);
