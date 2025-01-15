import { Controller, Post, Body, Get } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Controller('2fa')
export class TwoFactorAuthController {
	constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

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
	verify2FA(@Body() body: { secret: string; token: string }) {
		const { secret, token } = body;
		const isValid = this.twoFactorAuthService.verifyToken(secret, token);

		return { isValid };
	}
}
