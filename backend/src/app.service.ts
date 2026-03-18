import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Restaurant App API is running! 🍽️';
  }
}
