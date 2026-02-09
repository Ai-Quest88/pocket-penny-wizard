import { describe, it, expect } from 'vitest'
import {
  maskEmail,
  maskPhone,
  maskTaxIdentifier,
  maskAddress,
  validateEmail,
  validatePhone,
  validateTaxIdentifier,
} from './dataProtection'

describe('dataProtection', () => {
  describe('maskEmail', () => {
    it('should mask email username after first 2 chars', () => {
      expect(maskEmail('john.doe@example.com')).toBe('jo******@example.com')
    })

    it('should mask short usernames completely', () => {
      expect(maskEmail('ab@example.com')).toBe('**@example.com')
    })

    it('should return input if no @ symbol', () => {
      expect(maskEmail('notanemail')).toBe('notanemail')
    })

    it('should return empty string for empty input', () => {
      expect(maskEmail('')).toBe('')
    })

    it('should handle single-char username', () => {
      expect(maskEmail('a@x.com')).toBe('*@x.com')
    })
  })

  describe('maskPhone', () => {
    it('should show only last 4 digits', () => {
      expect(maskPhone('0412345678')).toBe('******5678')
    })

    it('should handle phone with spaces and dashes', () => {
      const result = maskPhone('+61 412 345 678')
      // cleaned is "61412345678" (11 digits), last 4 = "5678"
      expect(result).toContain('5678')
      expect(result).toContain('*')
    })

    it('should mask short phone numbers entirely', () => {
      expect(maskPhone('123')).toBe('***')
    })

    it('should return empty for empty input', () => {
      expect(maskPhone('')).toBe('')
    })
  })

  describe('maskTaxIdentifier', () => {
    it('should show only last 3 chars of TFN', () => {
      expect(maskTaxIdentifier('123456789')).toBe('******789')
    })

    it('should show only last 3 chars of ABN', () => {
      expect(maskTaxIdentifier('12345678901')).toBe('********901')
    })

    it('should mask short identifiers entirely', () => {
      expect(maskTaxIdentifier('ab')).toBe('**')
    })

    it('should return empty for empty input', () => {
      expect(maskTaxIdentifier('')).toBe('')
    })
  })

  describe('maskAddress', () => {
    it('should mask middle of multi-word address', () => {
      const result = maskAddress('123 Main Street Sydney')
      expect(result).toContain('123')
      expect(result).toContain('Sydney')
      expect(result).toContain('*')
    })

    it('should mask single word address completely', () => {
      const result = maskAddress('Sydney')
      expect(result).toBe('*'.repeat('Sydney'.length))
    })

    it('should return empty for empty input', () => {
      expect(maskAddress('')).toBe('')
    })
  })

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true, message: '' })
      expect(validateEmail('user.name@domain.co')).toEqual({ isValid: true, message: '' })
    })

    it('should reject invalid emails', () => {
      const result = validateEmail('notanemail')
      expect(result.isValid).toBe(false)
      expect(result.message).toBeTruthy()
    })

    it('should reject email without domain', () => {
      const result = validateEmail('user@')
      expect(result.isValid).toBe(false)
    })

    it('should accept empty email (optional field)', () => {
      expect(validateEmail('')).toEqual({ isValid: true, message: '' })
    })
  })

  describe('validatePhone', () => {
    it('should accept valid Australian phone', () => {
      expect(validatePhone('0412 345 678')).toEqual({ isValid: true, message: '' })
      expect(validatePhone('+61412345678')).toEqual({ isValid: true, message: '' })
    })

    it('should reject too-short phone numbers', () => {
      const result = validatePhone('12345')
      expect(result.isValid).toBe(false)
    })

    it('should accept empty phone (optional field)', () => {
      expect(validatePhone('')).toEqual({ isValid: true, message: '' })
    })
  })

  describe('validateTaxIdentifier', () => {
    it('should accept valid 9-digit Australian TFN', () => {
      expect(validateTaxIdentifier('123456789', 'Australia')).toEqual({ isValid: true, message: '' })
    })

    it('should accept valid 11-digit Australian ABN', () => {
      expect(validateTaxIdentifier('12345678901', 'Australia')).toEqual({ isValid: true, message: '' })
    })

    it('should reject invalid Australian tax identifier', () => {
      const result = validateTaxIdentifier('12345', 'Australia')
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('9 digits')
    })

    it('should accept non-Australian identifiers with 3+ chars', () => {
      expect(validateTaxIdentifier('ABC123', 'US')).toEqual({ isValid: true, message: '' })
    })

    it('should reject too-short generic identifier', () => {
      const result = validateTaxIdentifier('AB', 'US')
      expect(result.isValid).toBe(false)
    })

    it('should accept empty tax identifier (optional field)', () => {
      expect(validateTaxIdentifier('', 'Australia')).toEqual({ isValid: true, message: '' })
    })
  })
})
