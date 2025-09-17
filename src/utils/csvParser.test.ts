import { describe, it, expect } from 'vitest'
import { parseCSV, detectHeaders, mapHeaders, validateTransactionData } from './csvParser'

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV data', () => {
      const csvData = 'Date,Description,Amount\n2024-01-01,Test Transaction,100.00'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        Date: '2024-01-01',
        Description: 'Test Transaction',
        Amount: '100.00'
      })
    })

    it('should parse CSV with multiple rows', () => {
      const csvData = `Date,Description,Amount
2024-01-01,Transaction 1,100.00
2024-01-02,Transaction 2,200.00`
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        Date: '2024-01-01',
        Description: 'Transaction 1',
        Amount: '100.00'
      })
      expect(result[1]).toEqual({
        Date: '2024-01-02',
        Description: 'Transaction 2',
        Amount: '200.00'
      })
    })

    it('should handle CSV with quoted fields', () => {
      const csvData = 'Date,Description,Amount\n"2024-01-01","Test, Transaction","100.00"'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        Date: '2024-01-01',
        Description: 'Test, Transaction',
        Amount: '100.00'
      })
    })

    it('should handle empty CSV', () => {
      const csvData = ''
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(0)
    })

    it('should handle CSV with only headers', () => {
      const csvData = 'Date,Description,Amount'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(0)
    })

    it('should handle malformed CSV gracefully', () => {
      const csvData = 'Date,Description,Amount\n2024-01-01,Test Transaction'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        Date: '2024-01-01',
        Description: 'Test Transaction',
        Amount: undefined
      })
    })
  })

  describe('detectHeaders', () => {
    it('should detect common header patterns', () => {
      const headers = ['Date', 'Description', 'Amount', 'Currency']
      const result = detectHeaders(headers)
      
      expect(result.date).toBe('Date')
      expect(result.description).toBe('Description')
      expect(result.amount).toBe('Amount')
      expect(result.currency).toBe('Currency')
    })

    it('should detect alternative header names', () => {
      const headers = ['Transaction Date', 'Details', 'Debit', 'Credit']
      const result = detectHeaders(headers)
      
      expect(result.date).toBe('Transaction Date')
      expect(result.description).toBe('Details')
      expect(result.amount).toBe('Debit')
    })

    it('should handle case insensitive headers', () => {
      const headers = ['date', 'DESCRIPTION', 'Amount', 'CURRENCY']
      const result = detectHeaders(headers)
      
      expect(result.date).toBe('date')
      expect(result.description).toBe('DESCRIPTION')
      expect(result.amount).toBe('Amount')
      expect(result.currency).toBe('CURRENCY')
    })

    it('should return null for unrecognized headers', () => {
      const headers = ['Unknown1', 'Unknown2', 'Unknown3']
      const result = detectHeaders(headers)
      
      expect(result.date).toBeNull()
      expect(result.description).toBeNull()
      expect(result.amount).toBeNull()
    })

    it('should prioritize exact matches over partial matches', () => {
      const headers = ['Date', 'Transaction Date', 'Amount', 'Transaction Amount']
      const result = detectHeaders(headers)
      
      expect(result.date).toBe('Date')
      expect(result.amount).toBe('Amount')
    })
  })

  describe('mapHeaders', () => {
    it('should map headers to standard format', () => {
      const headers = ['Date', 'Description', 'Amount', 'Currency']
      const mapping = mapHeaders(headers)
      
      expect(mapping).toEqual({
        date: 'Date',
        description: 'Description',
        amount: 'Amount',
        currency: 'Currency'
      })
    })

    it('should handle missing headers', () => {
      const headers = ['Date', 'Description']
      const mapping = mapHeaders(headers)
      
      expect(mapping).toEqual({
        date: 'Date',
        description: 'Description',
        amount: null,
        currency: null
      })
    })

    it('should handle empty headers array', () => {
      const headers: string[] = []
      const mapping = mapHeaders(headers)
      
      expect(mapping).toEqual({
        date: null,
        description: null,
        amount: null,
        currency: null
      })
    })
  })

  describe('validateTransactionData', () => {
    it('should validate correct transaction data', () => {
      const transaction = {
        date: '2024-01-01',
        description: 'Test Transaction',
        amount: '100.00',
        currency: 'AUD'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing date', () => {
      const transaction = {
        date: '',
        description: 'Test Transaction',
        amount: '100.00',
        currency: 'AUD'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Date is required')
    })

    it('should detect invalid date format', () => {
      const transaction = {
        date: 'invalid-date',
        description: 'Test Transaction',
        amount: '100.00',
        currency: 'AUD'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid date format')
    })

    it('should detect missing description', () => {
      const transaction = {
        date: '2024-01-01',
        description: '',
        amount: '100.00',
        currency: 'AUD'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Description is required')
    })

    it('should detect missing amount', () => {
      const transaction = {
        date: '2024-01-01',
        description: 'Test Transaction',
        amount: '',
        currency: 'AUD'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Amount is required')
    })

    it('should detect invalid amount format', () => {
      const transaction = {
        date: '2024-01-01',
        description: 'Test Transaction',
        amount: 'invalid-amount',
        currency: 'AUD'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid amount format')
    })

    it('should detect invalid currency', () => {
      const transaction = {
        date: '2024-01-01',
        description: 'Test Transaction',
        amount: '100.00',
        currency: 'INVALID'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid currency code')
    })

    it('should handle multiple validation errors', () => {
      const transaction = {
        date: '',
        description: '',
        amount: 'invalid',
        currency: 'INVALID'
      }
      
      const result = validateTransactionData(transaction)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('should accept various date formats', () => {
      const validDates = [
        '2024-01-01',
        '01/01/2024',
        '1/1/2024',
        '2024-12-31'
      ]
      
      validDates.forEach(date => {
        const transaction = {
          date,
          description: 'Test Transaction',
          amount: '100.00',
          currency: 'AUD'
        }
        
        const result = validateTransactionData(transaction)
        expect(result.isValid).toBe(true)
      })
    })

    it('should accept various amount formats', () => {
      const validAmounts = [
        '100.00',
        '100',
        '-100.00',
        '0.50',
        '1000.99'
      ]
      
      validAmounts.forEach(amount => {
        const transaction = {
          date: '2024-01-01',
          description: 'Test Transaction',
          amount,
          currency: 'AUD'
        }
        
        const result = validateTransactionData(transaction)
        expect(result.isValid).toBe(true)
      })
    })
  })
})
