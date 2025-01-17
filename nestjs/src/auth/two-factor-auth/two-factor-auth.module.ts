import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuthController } from './two-factor-auth.controller';
import { UsersModule } from 'src/user/user.module';

@Module({
	imports: [UsersModule],
	providers: [TwoFactorAuthService],
	controllers: [TwoFactorAuthController],
})
export class TwoFactorAuthModule {}
