import * as cron from 'node-cron'
import { billingService } from './BillingService'

export class CronService {
  private static instance: CronService
  private billingJob: cron.ScheduledTask | null = null

  private constructor() {}

  static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService()
    }
    return CronService.instance
  }

  /**
   * Start daily billing job at 02:00 AM every day
   */
  startBillingJob(): void {
    if (this.billingJob) {
      console.log('Billing job is already running')
      return
    }

    // Run daily at 2:00 AM
    this.billingJob = cron.schedule('0 2 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Starting scheduled billing process...`)
      
      try {
        const result = await billingService.processBilling()
        console.log(`[${new Date().toISOString()}] Billing process completed:`, result)
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Billing process failed:`, error)
      }
    }, {
      timezone: 'Europe/Moscow' // Adjust timezone as needed
    })

    this.billingJob.start()
    console.log('Daily billing job started (runs at 02:00 AM)')
  }

  /**
   * Stop billing job
   */
  stopBillingJob(): void {
    if (this.billingJob) {
      this.billingJob.stop()
      this.billingJob.destroy()
      this.billingJob = null
      console.log('Billing job stopped')
    }
  }

  /**
   * Get billing job status
   */
  getBillingJobStatus(): { running: boolean; nextRun?: string } {
    if (!this.billingJob) {
      return { running: false }
    }

    return {
      running: this.billingJob.getStatus() === 'scheduled',
      nextRun: this.getNextRunTime()
    }
  }

  /**
   * Get next run time for billing job
   */
  private getNextRunTime(): string {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(2, 0, 0, 0)
    
    // If it's before 2 AM today, next run is today at 2 AM
    if (now.getHours() < 2) {
      const today = new Date(now)
      today.setHours(2, 0, 0, 0)
      return today.toISOString()
    }
    
    return tomorrow.toISOString()
  }

  /**
   * Manual trigger for billing process (for testing)
   */
  async triggerBillingManually(): Promise<any> {
    console.log(`[${new Date().toISOString()}] Manual billing trigger`)
    return await billingService.processBilling()
  }
}

export const cronService = CronService.getInstance()