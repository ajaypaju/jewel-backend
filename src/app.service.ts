import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  async checkHealth(): Promise<{ db: string; timestamp: string }> {
    await this.dataSource.query('SELECT 1');

    // Just return the data — the TransformInterceptor wraps it
    // in { success: true, message: "Success", data: { ... } } automatically
    return {
      db: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
