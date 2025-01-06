import { Injectable } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';

@Injectable()
export class AppContext implements TRPCContext {
  async create(opt: ContextOptions) {
    return {
      req: opt.req,
      res: opt.res,
    };
  }
}

// @Injectable()
// export class AuthMiddlewareContext implements TRPCContext {
//   async create(opt: ContextOptions) {
//     return {
//       auth: {
//         userId: opt.req.user?.id,
//         username: opt.req.user?.username,
//       },
//     };
//   }
// }

@Injectable()
export class AuthMiddlewareContext implements TRPCContext {
  async create(opt: ContextOptions) {
    return {
      req: opt.req,
      res: opt.res,
      auth: {
        userId: opt.req.user?.id,
        username: opt.req.user?.username,
      },
    };
  }
}
