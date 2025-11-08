import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

console.log(chalk.bgBlue.black('[SERVICE]') + '     - Prisma service loaded');

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Configure connection pool for better management
    const databaseUrl = process.env.DATABASE_URL || '';

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    console.log(
      chalk.yellow('[PRISMA]      - ') + 'Connecting to the database...',
    );

    try {
      await this.$connect();
      console.log(
        chalk.green('[PRISMA]      - ') + 'Connected to the database!',
      );
      console.log(
        chalk.green('[PRISMA]      - ') + 'Database connection verified!',
      );
    } catch (error) {
      console.error(
        chalk.red('[PRISMA]      - ') + 'Connection failed:',
        error,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log(
      chalk.yellow('[PRISMA]      - ') + 'Disconnecting from database...',
    );
    await this.$disconnect();
    console.log(chalk.green('[PRISMA]      - ') + 'Disconnected successfully!');
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
