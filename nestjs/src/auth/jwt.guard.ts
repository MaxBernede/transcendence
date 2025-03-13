import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      // Log the error information (this could be any kind of failure, like token expired, invalid, etc.)
      if (info) {
        console.error('JWT Auth failed:', info.message);
		// print the request url
		// console.log('Request URL:', info);
      }
      // Throw an UnauthorizedException to signal the authentication failure
	  throw new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}


// import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   canActivate(context: ExecutionContext) {
//     // Extract the request object from the execution context
//     const request = context.switchToHttp().getRequest();

//     // You can log the URL here if needed
//     console.log('Request URL:', request.url);

//     return super.canActivate(context);
//   }

//   handleRequest(err, user, info, context: ExecutionContext) {
//     if (err || !user) {
//       // Log the error information
//       if (info) {
//         console.error('JWT Auth failed:', info.message);

//         // Access the request object via ExecutionContext
//         const request = context.switchToHttp().getRequest();
//         console.log('Request URL:', request.url); // Log the URL here
//       }
//       throw new UnauthorizedException('Authentication failed');
//     }
//     return user;
//   }
// }
