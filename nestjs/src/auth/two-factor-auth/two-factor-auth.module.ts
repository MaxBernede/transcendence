import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuthController } from './two-factor-auth.controller';

@Module({
	providers: [TwoFactorAuthService],
	controllers: [TwoFactorAuthController],
})
export class TwoFactorAuthModule {}
