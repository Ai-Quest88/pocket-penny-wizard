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
    beforeEach(() => {
      // Clear localStorage cache before each test
      localStorage.clear()
    })

    it('should fetch exchange rates successfully', async () => {
      const mockResponse = {
        base: 'USD',
        rates: { AUD: 1.5, EUR: 0.85 },
        timestamp: Date.now()
      }

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)
      
      global.fetch = mockFetch

      const result = await getExchangeRates('USD')
      expect(result).toEqual(mockResponse.rates) // Function returns data.rates, not full response
      expect(mockFetch).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/USD')
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('API Error'))
      global.fetch = mockFetch

      const result = await getExchangeRates('USD')
      // Should return fallback rates when API fails and no cache exists
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle non-ok responses', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response)
      
      global.fetch = mockFetch

      const result = await getExchangeRates('USD')
      // Should return fallback rates when API fails and no cache exists
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })
  })

  describe('CURRENCIES constant', () => {
    it('should contain expected currencies', () => {
      expect(CURRENCIES).toContainEqual({ code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' })
      expect(CURRENCIES).toContainEqual({ code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' })
      expect(CURRENCIES).toContainEqual({ code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' })
      expect(CURRENCIES).toContainEqual({ code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' })
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
