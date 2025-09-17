import { describe, it, expect } from 'vitest'
import {
  getCurrentFinancialYear,
  getFinancialYearForDate,
  isDateInFinancialYear,
  getFinancialYearName,
  SUPPORTED_COUNTRIES
} from './financialYearUtils'

describe('Financial Year Utils', () => {
  describe('getCurrentFinancialYear', () => {
    it('should return current financial year for Australia', () => {
      const fy = getCurrentFinancialYear('AU')
      expect(fy.startDate).toBeInstanceOf(Date)
      expect(fy.endDate).toBeInstanceOf(Date)
      expect(fy.name).toMatch(/FY\d{2}/)
      expect(fy.taxYear).toBeGreaterThan(2020)
    })

    it('should return current financial year for India', () => {
      const fy = getCurrentFinancialYear('IN')
      expect(fy.startDate).toBeInstanceOf(Date)
      expect(fy.endDate).toBeInstanceOf(Date)
      expect(fy.name).toMatch(/FY\d{2}/)
    })

    it('should return current financial year for US', () => {
      const fy = getCurrentFinancialYear('US')
      expect(fy.startDate).toBeInstanceOf(Date)
      expect(fy.endDate).toBeInstanceOf(Date)
      expect(fy.name).toMatch(/FY\d{2}/)
    })

    it('should handle invalid country code', () => {
      const fy = getCurrentFinancialYear('INVALID' as any)
      expect(fy.startDate).toBeInstanceOf(Date)
      expect(fy.endDate).toBeInstanceOf(Date)
      expect(fy.name).toMatch(/FY\d{2}/)
    })
  })

  describe('getFinancialYearForDate', () => {
    it('should return correct FY for Australian date in July', () => {
      const date = new Date('2024-07-15')
      const fy = getFinancialYearForDate('AU', date)
      
      expect(fy.startDate.getFullYear()).toBe(2024)
      expect(fy.endDate.getFullYear()).toBe(2025)
      expect(fy.startDate.getMonth()).toBe(6) // July = 6
      expect(fy.endDate.getMonth()).toBe(5) // June = 5
    })

    it('should return correct FY for Australian date in June', () => {
      const date = new Date('2024-06-15')
      const fy = getFinancialYearForDate('AU', date)
      
      expect(fy.startDate.getFullYear()).toBe(2023)
      expect(fy.endDate.getFullYear()).toBe(2024)
      expect(fy.startDate.getMonth()).toBe(6) // July = 6
      expect(fy.endDate.getMonth()).toBe(5) // June = 5
    })

    it('should return correct FY for Indian date in April', () => {
      const date = new Date('2024-04-15')
      const fy = getFinancialYearForDate('IN', date)
      
      expect(fy.startDate.getFullYear()).toBe(2024)
      expect(fy.endDate.getFullYear()).toBe(2025)
      expect(fy.startDate.getMonth()).toBe(3) // April = 3
      expect(fy.endDate.getMonth()).toBe(2) // March = 2
    })

    it('should return correct FY for US date in January', () => {
      const date = new Date('2024-01-15')
      const fy = getFinancialYearForDate('US', date)
      
      expect(fy.startDate.getFullYear()).toBe(2024)
      expect(fy.endDate.getFullYear()).toBe(2024)
      expect(fy.startDate.getMonth()).toBe(0) // January = 0
      expect(fy.endDate.getMonth()).toBe(11) // December = 11
    })
  })

  describe('isDateInFinancialYear', () => {
    it('should return true for date within financial year', () => {
      const fy = {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        name: 'FY25',
        taxYear: 2025
      }
      const date = new Date('2024-12-15')
      
      expect(isDateInFinancialYear(date, fy)).toBe(true)
    })

    it('should return false for date before financial year', () => {
      const fy = {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        name: 'FY25',
        taxYear: 2025
      }
      const date = new Date('2024-06-15')
      
      expect(isDateInFinancialYear(date, fy)).toBe(false)
    })

    it('should return false for date after financial year', () => {
      const fy = {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        name: 'FY25',
        taxYear: 2025
      }
      const date = new Date('2025-07-15')
      
      expect(isDateInFinancialYear(date, fy)).toBe(false)
    })

    it('should return true for start date', () => {
      const fy = {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        name: 'FY25',
        taxYear: 2025
      }
      const date = new Date('2024-07-01')
      
      expect(isDateInFinancialYear(date, fy)).toBe(true)
    })

    it('should return true for end date', () => {
      const fy = {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        name: 'FY25',
        taxYear: 2025
      }
      const date = new Date('2025-06-30')
      
      expect(isDateInFinancialYear(date, fy)).toBe(true)
    })
  })

  describe('getFinancialYearName', () => {
    it('should return correct name for Australian FY', () => {
      const fy = {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        name: 'FY25',
        taxYear: 2025
      }
      
      expect(getFinancialYearName(fy)).toBe('FY25')
    })

    it('should return correct name for Indian FY', () => {
      const fy = {
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        name: 'FY25',
        taxYear: 2025
      }
      
      expect(getFinancialYearName(fy)).toBe('FY25')
    })
  })

  describe('SUPPORTED_COUNTRIES constant', () => {
    it('should contain expected countries', () => {
      expect(SUPPORTED_COUNTRIES).toContainEqual({
        code: 'AU',
        name: 'Australia',
        fyStartMonth: 6, // July
        fyStartDay: 1
      })
      expect(SUPPORTED_COUNTRIES).toContainEqual({
        code: 'IN',
        name: 'India',
        fyStartMonth: 3, // April
        fyStartDay: 1
      })
      expect(SUPPORTED_COUNTRIES).toContainEqual({
        code: 'US',
        name: 'United States',
        fyStartMonth: 0, // January
        fyStartDay: 1
      })
    })

    it('should have unique country codes', () => {
      const codes = SUPPORTED_COUNTRIES.map(c => c.code)
      const uniqueCodes = new Set(codes)
      expect(codes.length).toBe(uniqueCodes.size)
    })

    it('should have valid month values', () => {
      SUPPORTED_COUNTRIES.forEach(country => {
        expect(country.fyStartMonth).toBeGreaterThanOrEqual(0)
        expect(country.fyStartMonth).toBeLessThan(12)
      })
    })

    it('should have valid day values', () => {
      SUPPORTED_COUNTRIES.forEach(country => {
        expect(country.fyStartDay).toBeGreaterThanOrEqual(1)
        expect(country.fyStartDay).toBeLessThanOrEqual(31)
      })
    })
  })
})
