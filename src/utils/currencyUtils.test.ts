import { describe, it, expect, vi, beforeEach } from 'vitest'
import { convertAmount, formatCurrency, getExchangeRates, CURRENCIES } from './currencyUtils'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Currency Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('convertAmount', () => {
    it('should return same amount for same currency', () => {
      const rates = { base: 'USD', rates: { AUD: 1.5 }, timestamp: Date.now() }
      const result = convertAmount(100, 'AUD', 'AUD', rates)
      expect(result).toBe(100)
    })

    it('should convert between different currencies', () => {
      const rates = { 
        base: 'USD', 
        rates: { AUD: 1.5, EUR: 0.85 }, 
        timestamp: Date.now() 
      }
      const result = convertAmount(100, 'AUD', 'EUR', rates)
      expect(result).toBeCloseTo(56.67, 2) // 100 AUD / 1.5 * 0.85
    })

    it('should handle USD as base currency', () => {
      const rates = { 
        base: 'USD', 
        rates: { AUD: 1.5 }, 
        timestamp: Date.now() 
      }
      const result = convertAmount(100, 'USD', 'AUD', rates)
      expect(result).toBe(150)
    })

    it('should return 0 for invalid currencies', () => {
      const rates = { base: 'USD', rates: { AUD: 1.5 }, timestamp: Date.now() }
      const result = convertAmount(100, 'INVALID', 'AUD', rates)
      expect(result).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format AUD currency correctly', () => {
      const result = formatCurrency(1234.56, 'AUD')
      expect(result).toBe('A$1,234.56')
    })

    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toBe('$1,234.56')
    })

    it('should format EUR currency correctly', () => {
      const result = formatCurrency(1234.56, 'EUR')
      expect(result).toBe('€1,234.56')
    })

    it('should handle negative amounts', () => {
      const result = formatCurrency(-1234.56, 'AUD')
      expect(result).toBe('-A$1,234.56')
    })

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'AUD')
      expect(result).toBe('A$0.00')
    })

    it('should handle large amounts', () => {
      const result = formatCurrency(1234567.89, 'AUD')
      expect(result).toBe('A$1,234,567.89')
    })
  })

  describe('getExchangeRates', () => {
    it('should fetch exchange rates successfully', async () => {
      const mockRates = {
        base: 'USD',
        rates: { AUD: 1.5, EUR: 0.85 },
        timestamp: Date.now()
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRates
      })

      const result = await getExchangeRates('USD')
      expect(result).toEqual(mockRates)
      expect(fetch).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/USD')
    })

    it('should handle API errors gracefully', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('API Error'))

      const result = await getExchangeRates('USD')
      expect(result).toBeNull()
    })

    it('should handle non-ok responses', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await getExchangeRates('USD')
      expect(result).toBeNull()
    })
  })

  describe('CURRENCIES constant', () => {
    it('should contain expected currencies', () => {
      expect(CURRENCIES).toContainEqual({ code: 'AUD', name: 'Australian Dollar', symbol: 'A$' })
      expect(CURRENCIES).toContainEqual({ code: 'USD', name: 'US Dollar', symbol: '$' })
      expect(CURRENCIES).toContainEqual({ code: 'EUR', name: 'Euro', symbol: '€' })
      expect(CURRENCIES).toContainEqual({ code: 'GBP', name: 'British Pound', symbol: '£' })
    })

    it('should have unique currency codes', () => {
      const codes = CURRENCIES.map(c => c.code)
      const uniqueCodes = new Set(codes)
      expect(codes.length).toBe(uniqueCodes.size)
    })

    it('should have valid symbols for all currencies', () => {
      CURRENCIES.forEach(currency => {
        expect(currency.symbol).toBeDefined()
        expect(currency.symbol.length).toBeGreaterThan(0)
      })
    })
  })
})
