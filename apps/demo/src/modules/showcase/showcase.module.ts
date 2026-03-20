import { Module } from '@nestjs/common';
import { ShowcaseController } from './showcase.controller';

@Module({
  controllers: [ShowcaseController],
})
export class ShowcaseModule {}
