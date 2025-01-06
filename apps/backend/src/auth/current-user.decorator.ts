// import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// const getCurrentUserByContext = (context: ExecutionContext) =>
//   context.switchToHttp().getRequest().user;

// export const CurrentUser = createParamDecorator(
//   (_data: unknown, context: ExecutionContext) =>
//     getCurrentUserByContext(context),
// );


import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { inferAsyncReturnType } from '@trpc/server';

// export const CurrentUser = createParamDecorator(
//   (data: unknown, ctx: ExecutionContext) => {
// 	console.log('CurrentUser decorator');
//     const request = ctx.switchToHttp().getRequest();
//     console.log('Request user in decorator:', request.user);
//     return request.user;
//   },
// );


export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		console.log('CurrentUser decorator');
	  const request = ctx.switchToHttp().getRequest();
	  const context = request.trpcContext as inferAsyncReturnType<any>;
	  return context.user; // Get the user from the trpc context
	},
  );