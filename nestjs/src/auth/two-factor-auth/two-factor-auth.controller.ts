import { Controller, Post, Body, Get } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { UserService } from 'src/user/user.service';

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
	async verify2FA(@Body() body: {token: string, intraId: number }) {
		const { token, intraId } = body;

		const user = this.userService.findOneById(intraId)

		if (!user) return { isValid: false, message: 'User not found' };

		const secret = (await user).secret_2fa

		const isValid = this.twoFactorAuthService.verifyToken(secret, token);

		// Here check if the isValid and if yes update values for intraID in DBB
		// console.log("intra id in verify 2FA: ", intraId);
		if (!isValid)
			return { isValid, message: 'Invalid 2FA token' };
		try {
			const user = await this.userService.findOne(intraId); // Find the user in the database by intraId
			if (!user)
				return { isValid, message: 'User not found' };

			const updatedData = { secret_2fa: secret };
	
			await this.userService.updateUser(intraId.toString(), updatedData);
	
			// return { isValid, message: '2FA secret has been cleared successfully' };
		} 
		catch (error) {
			console.error('Error updating user data:', error);
			return { isValid, message: 'Error updating user data', error };
		}
	}
}
