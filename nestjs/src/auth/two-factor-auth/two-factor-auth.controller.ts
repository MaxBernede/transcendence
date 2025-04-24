import { Controller, Post, Body, Get, Res, Req } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';
import { CommandStartedEvent } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Controller('2fa')
export class TwoFactorAuthController {
  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly userService: UserService,
	private configService: ConfigService,
  ) {}

  @Get('generate')
  async generate2FA() {
    const secret = this.twoFactorAuthService.generateSecret();
    const qrCode = await this.twoFactorAuthService.generateQRCode(
      secret.otpauth_url,
    );

    return {
      secret: secret.base32,
      qrCode, // This is a base64 image string of the QR Code
    };
  }



  @Post('verify')
  async verify2FA(
    @Body() body: { token: string; intraId: number },
    @Res() res: Response, @Req() req,
	 
  ) {
    const { token, intraId } = body;

    // console.log(intraId)
    //check if intraid or id ?? omg im so fcked
    const user = await this.userService.findOneById(intraId);

    if (!user) return { isValid: false, message: 'User not found' };

    const secret = user.secret_2fa;

    const isValid = this.twoFactorAuthService.verifyToken(secret, token);

    // Here check if the isValid and if yes update values for intraID in DBB
    if (!isValid) {
      // console.log('Invalid');
      return res.status(400).json({ message: 'Invalid token' });
    }
    try {
      const updatedData = { secret_2fa: secret };

      await this.userService.updateUser(intraId.toString(), updatedData);

	const frontend_ip = this.configService.getOrThrow('FRONTEND_IP');
      // If valid, just redirect ? not sure its the right place tho
      const jwt = user.tempJWT;
      this.twoFactorAuthService.setJwtCookieTwo(res, jwt);
      return res.redirect(`http://${frontend_ip}/user/${user.intraId}`);
    //   return res.redirect(`http://localhost:3001/user/${user.intraId}`);
    } catch (error) {
      console.error('Error updating user data:', error);
      return res.status(400).json({ message: 'Invalid token' });
    }
  }

  @Post('add2FA')
  async add2FA(
    @Body() body: { secret: string; token: string; intraId: number },
  ) {
    const { secret, token, intraId } = body;
    const isValid = this.twoFactorAuthService.verifyToken(secret, token);

    // Here check if the isValid and if yes update values for intraID in DBB
    // console.log('intra id in verify 2FA: ', intraId);
    if (!isValid) return { isValid, message: 'Invalid 2FA token' };
    try {
      const user = await this.userService.findOne(intraId); // Find the user in the database by intraId
      if (!user) return { isValid, message: 'User not found' };

      const updatedData = { secret_2fa: secret };

      await this.userService.updateUser(intraId.toString(), updatedData);

      return { isValid, message: '2FA secret has been cleared successfully' };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { isValid, message: 'Error updating user data', error };
    }
  }
}
