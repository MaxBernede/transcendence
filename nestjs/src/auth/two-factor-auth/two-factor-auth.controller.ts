import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';
import { Public } from 'src/decorators/public.decorator';

@Controller('2fa')
export class TwoFactorAuthController {
	constructor(
		private readonly twoFactorAuthService: TwoFactorAuthService,
		private readonly userService: UserService
	) {}

	@Get('generate')
	async generate2FA() {
		const secret = this.twoFactorAuthService.generateSecret();
		const qrCode = await this.twoFactorAuthService.generateQRCode(secret.otpauth_url);

		return {
			secret: secret.base32,
			qrCode, // This is a base64 image string of the QR Code
		};
	}

	@Post('verify')
	async verify2FA(@Body() body: {token: string, intraId: number }, @Res() res: Response) {
		const { token, intraId } = body;

		// console.log(intraId)
		const user = await this.userService.findOneById(intraId)

		if (!user) return { isValid: false, message: 'User not found' };

		const secret = user.secret_2fa

		const isValid = this.twoFactorAuthService.verifyToken(secret, token);

		// Here check if the isValid and if yes update values for intraID in DBB
		if (!isValid){
			console.log("Invalid")
			return res.status(400).json({message: 'Invalid token'});
		}
		try {
			const updatedData = { secret_2fa: secret };
	
			await this.userService.updateUser(intraId.toString(), updatedData);

			// If valid, just redirect ? not sure its the right place tho
			const jwt = user.tempJWT
			this.twoFactorAuthService.setJwtCookieTwo(res, jwt);
			return res.status(200).json({message: '2FA validated'});
			// return res.redirect(`http://localhost:3001/user/${user.intraId}`);
			// console.log("Valid")
			
		} 
		catch (error) {
			console.error('Error updating user data:', error);
			return res.status(400).json({message: 'Invalid token'});
		}
	}
}
