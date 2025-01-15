import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
	generateSecret() {
		const secret = speakeasy.generateSecret({
			name: 'MyNestApp', // Replace with your app name
		});
		return secret;
	}

	async generateQRCode(secret: string) {
		return QRCode.toDataURL(secret);
	}

	verifyToken(secret: string, token: string): boolean {
		return speakeasy.totp.verify({
			secret,
			encoding: 'base32',
			token,
		});
	}
}
