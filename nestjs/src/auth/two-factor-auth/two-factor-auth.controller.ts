import { Controller, Post, Body, Get } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { UserService } from 'src/user/user.service';

@Controller('2fa')
export class TwoFactorAuthController {
	constructor(
		private readonly twoFactorAuthService: TwoFactorAuthService,
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
	async verify2FA(@Body() body: { secret: string; token: string, intraId: number }) {
		const { secret, token, intraId } = body;
		const isValid = this.twoFactorAuthService.verifyToken(secret, token);

		// Here check if the isValid and if yes update values for intraID in DBB
		console.log("intra id in verify 2FA: ", intraId);
		// if (isValid) {
		// 	try {
		// 	  // Find the user in the database by intraId
		// 	  const user = await this.userService.findOne(intraId);
	  
		// 	  if (user) {
		// 		// If user exists, update the secret_2fa field to null (or any other update)
		// 		const updatedData = { secret_2fa: secret }; // Adjust this as needed
	  
		// 		// Call the UserService to update the user data
		// 		await this.userService.updateUser(intraId.toString(), updatedData);
	  
		// 		return { isValid, message: '2FA secret has been cleared successfully' };
		// 	  } else {
		// 		return { isValid, message: 'User not found' };
		// 	  }
		// 	} catch (error) {
		// 	  console.error('Error updating user data:', error);
		// 	  return { isValid, message: 'Error updating user data', error };
		// 	}
		//   } else {
		// 	return { isValid, message: 'Invalid 2FA token' };
		//   }
		return { isValid };
	}
}
