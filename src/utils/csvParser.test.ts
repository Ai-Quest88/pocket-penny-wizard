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
      // Rows with fewer than 3 columns are rejected as insufficient for a transaction
      const csvData = 'Date,Description,Amount\n2024-01-01,Test Transaction'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(0)
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
        '2024-12-31',
        '15-01-2024',   // DD-MM-YYYY with dashes
        '01.01.2024',   // DD.MM.YYYY with dots
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

    it('should accept any valid 3-letter currency code', () => {
      const validCurrencies = ['AUD', 'NZD', 'INR', 'SGD', 'HKD', 'MYR', 'THB', 'KRW']
      
      validCurrencies.forEach(currency => {
        const transaction = {
          date: '2024-01-01',
          description: 'Test Transaction',
          amount: '100.00',
          currency
        }
        const result = validateTransactionData(transaction)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject non-3-letter currency codes', () => {
      const invalidCurrencies = ['AUSD', 'AU', 'A', '123', 'au1']
      
      invalidCurrencies.forEach(currency => {
        const transaction = {
          date: '2024-01-01',
          description: 'Test Transaction',
          amount: '100.00',
          currency
        }
        const result = validateTransactionData(transaction)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid currency code')
      })
    })
  })

  describe('parseCSV - Australian bank formats', () => {
    it('should parse DD/MM/YYYY dates correctly', () => {
      const csvData = 'Date,Description,Amount\n15/01/2024,Woolworths,-85.50'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0].Date).toBe('2024-01-15')
    })

    it('should parse DD-MM-YYYY dates with dashes', () => {
      const csvData = 'Date,Description,Amount\n15-01-2024,Coles Supermarket,-65.20'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0].Date).toBe('2024-01-15')
    })

    it('should handle negative amounts', () => {
      const csvData = 'Date,Description,Amount\n2024-01-01,Expense,-50.00'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0].Amount).toBe('-50.00')
    })

    it('should handle parenthesized negative amounts', () => {
      const csvData = 'Date,Description,Amount\n2024-01-01,Bank Fee,(25.00)'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0].Amount).toBe('-25.00')
    })

    it('should handle amounts with currency symbols', () => {
      const csvData = 'Date,Description,Amount\n2024-01-01,Purchase,$150.00'
      const result = parseCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0].Amount).toBe('150.00')
    })

    it('should handle multi-row Australian bank CSV', () => {
      const csvData = `Date,Description,Amount
15/01/2024,WOOLWORTHS TOWN HALL,-85.50
16/01/2024,SALARY PAYMENT,3500.00
17/01/2024,LINKT TOLL,-4.20
18/01/2024,COLES EXPRESS,-42.10`
      
      const result = parseCSV(csvData)
      expect(result).toHaveLength(4)
      expect(result[0].Description).toBe('WOOLWORTHS TOWN HALL')
      expect(result[1].Amount).toBe('3500.00')
      expect(result[2].Date).toBe('2024-01-17')
    })
  })
})
