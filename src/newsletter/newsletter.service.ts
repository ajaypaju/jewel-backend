import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity.js';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepository: Repository<NewsletterSubscriber>,
  ) {}

  // Idempotent: re-subscribing reactivates an inactive subscription
  async subscribe(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    const existing = await this.subscriberRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await this.subscriberRepository.save(existing);
      }
      return { message: 'Successfully subscribed to newsletter' };
    }

    const subscriber = this.subscriberRepository.create({
      email: normalizedEmail,
    });
    await this.subscriberRepository.save(subscriber);
    return { message: 'Successfully subscribed to newsletter' };
  }

  async unsubscribe(email: string): Promise<{ message: string }> {
    const subscriber = await this.subscriberRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (subscriber && subscriber.isActive) {
      subscriber.isActive = false;
      await this.subscriberRepository.save(subscriber);
    }

    return { message: 'Successfully unsubscribed from newsletter' };
  }

  async findAll(): Promise<NewsletterSubscriber[]> {
    return this.subscriberRepository.find({ order: { subscribedAt: 'DESC' } });
  }
}
