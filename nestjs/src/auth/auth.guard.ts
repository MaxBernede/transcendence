import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { Request } from 'express';
  import { Reflector } from '@nestjs/core';
  import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
  
  @Injectable()
  export class AuthGuard implements CanActivate {
	constructor(
	  private jwtService: JwtService,
	  private reflector: Reflector,
	  private configService: ConfigService, // Inject ConfigService
	) {}
  
	async canActivate(context: ExecutionContext): Promise<boolean> {
	  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
		context.getHandler(),
		context.getClass(),
	  ]);
  
	  if (isPublic) {
		console.log('Accessing a public route');
		return true;
	  }
  
	  const request = context.switchToHttp().getRequest<Request>();
	  const token = this.extractTokenFromRequest(request);
  
	  console.log('AuthGuard Token:', token); // Log the token for debugging
  
	  if (!token) {
		console.error('Token not found in the request'); // Log when the token is missing
		throw new UnauthorizedException('Token not found in request.');
	  }
  
	  try {
		const payload = await this.jwtService.verifyAsync(token, {
		  secret: this.configService.get<string>('JWT_SECRET'), // Use dynamic secret
		});
  
		console.log('Verified Payload:', payload); // Log the decoded payload
  
		// Assign the payload to the request object for route handlers
		request['user'] = payload;
	  } catch (error) {
		console.error('JWT verification failed:', error.message); // Log verification errors
		throw new UnauthorizedException('Invalid or expired token.');
	  }
  
	  return true;
	}
  
	private extractTokenFromRequest(request: Request): string | undefined {
	  // Log headers and cookies for debugging
	  console.log('Authorization Header:', request.headers.authorization);
	  console.log('Cookies:', request.cookies);
  
	  // Check Authorization header
	  const [type, token] = request.headers.authorization?.split(' ') ?? [];
	  if (type === 'Bearer' && token) {
		console.log('Token extracted from Authorization header:', token);
		return token;
	  }
  
	  // Check cookies for the token
	  const cookieToken = request.cookies?.jwt;
	  if (cookieToken) {
		console.log('Token extracted from cookies:', cookieToken);
	  } else {
		console.log('No token found in cookies.');
	  }
	  return cookieToken;
	}
  }
  