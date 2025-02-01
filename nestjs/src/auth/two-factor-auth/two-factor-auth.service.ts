import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as cookie from 'cookie';
import { Response } from 'express';

@Injectable()
export class TwoFactorAuthService {
	generateSecret() {
		const secret = speakeasy.generateSecret({
			name: 'Our Transcendence App', // Replace with your app name
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

	setJwtCookieTwo(res: Response, jwt: string) {
		res.setHeader('Set-Cookie', [cookie.serialize('jwt', jwt, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 3600,
			path: '/',
		})]);
	}
}
