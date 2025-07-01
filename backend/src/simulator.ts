import { Transaction } from './ruleEngine.js'
import { v4 as uuidv4 } from 'uuid'

export class TransactionSimulator {
  private isRunning = false
  private interval: NodeJS.Timeout | null = null
  private generatedIds = new Set<string>()

  private merchants = [
    { id: 'AMZN', category: 'retail', name: 'Amazon' },
    { id: 'STBK', category: 'coffee', name: 'Starbucks' },
    { id: 'UBER', category: 'transport', name: 'Uber' },
    { id: 'NETF', category: 'entertainment', name: 'Netflix' },
    { id: 'BANK', category: 'banking', name: 'Bank Transfer' }
  ]

  private states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'West Bengal',
    'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'Telangana'
  ]

  private cities = [
    'Mumbai', 'New Delhi', 'Bengaluru', 'Kolkata',
    'Chennai', 'Ahmedabad', 'Lucknow', 'Hyderabad'
  ]

  private paymentMethods = ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']

  generateTransaction(): Transaction {
    const merchant = this.merchants[Math.floor(Math.random() * this.merchants.length)]
    const index = Math.floor(Math.random() * this.states.length)

    
    let uniqueId = uuidv4()
    while (this.generatedIds.has(uniqueId)) {
      uniqueId = uuidv4()
    }
    this.generatedIds.add(uniqueId)

    return {
      id: uniqueId,
      userId: `user_${Math.floor(Math.random() * 10000)}`,
      amount: Math.round((Math.random() * 5000 + 10) * 100) / 100,
      currency: 'INR',
      merchantId: merchant.id,
      merchantCategory: merchant.category,
      location: {
        state: this.states[index],
        city: this.cities[index]
      },
      timestamp: new Date(),
      paymentMethod: this.paymentMethods[Math.floor(Math.random() * this.paymentMethods.length)],
      ipAddress: this.generateRandomIP(),
      deviceFingerprint: uuidv4()
    }
  }

  private generateRandomIP(): string {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.')
  }

  start(callback: (transaction: Transaction) => void, intervalMs: number = 2000): void {
    if (this.isRunning) return

    this.isRunning = true
    this.interval = setInterval(() => {
      const transaction = this.generateTransaction()
      callback(transaction)
    }, intervalMs)

    console.log('Transaction simulator started')
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
    console.log('Transaction simulator stopped')
  }

  isActive(): boolean {
    return this.isRunning
  }
}

export const simulator = new TransactionSimulator()
