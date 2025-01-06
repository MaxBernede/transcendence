import { AppModule } from '../src/app.module';
import { Test } from '@nestjs/testing';

describe('App e2e', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });
  it.todo('should display welcome message');
});
