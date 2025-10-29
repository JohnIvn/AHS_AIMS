import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

console.log(chalk.bgBlue.black('[SERVICE]') + '     - Prisma service loaded');

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    console.log(
      chalk.yellow('[PRISMA]      - ') + 'Connecting to the database...',
    );
    await this.$connect();
    console.log(chalk.green('[PRISMA]      - ') + 'Connected to the database!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
