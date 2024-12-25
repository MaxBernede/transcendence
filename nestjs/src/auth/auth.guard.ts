import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { jwtConstants } from './constants';
  import { Request } from 'express';
  import { Reflector } from '@nestjs/core';
  import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
  
  @Injectable()
  export class AuthGuard implements CanActivate {
	constructor(private jwtService: JwtService, private reflector: Reflector) {}
  
	async canActivate(context: ExecutionContext): Promise<boolean> {
	  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
		context.getHandler(),
		context.getClass(),
	  ]);
  
	  if (isPublic) {
		return true; // Allow public routes
	  }
  
	  const request = context.switchToHttp().getRequest<Request>();
	  const token = this.extractTokenFromRequest(request);
	  if (!token) {
		throw new UnauthorizedException('Token not found in request.');
	  }
  
	  try {
		const payload = await this.jwtService.verifyAsync(token, {
		  secret: jwtConstants.secret,
		});
  
		// Assign the payload to the request object for route handlers
		request['user'] = payload;
	  } catch (error) {
		throw new UnauthorizedException('Invalid or expired token.');
	  }
  
	  return true;
	}
  
	private extractTokenFromRequest(request: Request): string | undefined {
	  // Check Authorization header
	  const [type, token] = request.headers.authorization?.split(' ') ?? [];
	  if (type === 'Bearer' && token) {
		return token;
	  }
  
	  // Check cookies for the token
	  return request.cookies?.jwt;
	}
  }
  