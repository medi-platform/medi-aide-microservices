import { Injectable } from '@nestjs/common';

@Injectable()
export class CalendarService {
  async getDayView(date: string, userId?: string) { return { date, events: [] }; }
  async getWeekView(date: string, userId?: string) { return { startDate: date, events: [] }; }
  async getMonthView(year: number, month: number, userId?: string) { return { year, month, events: [] }; }
  async getAvailability(caregiverId: string, date: string) { return { caregiverId, date, slots: [] }; }
}


