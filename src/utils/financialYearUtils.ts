import { FinancialYear, CountryRule } from '../types/entities';

// Country rules for financial year calculation
export const COUNTRY_RULES: Record<string, CountryRule> = {
  'AU': { countryCode: 'AU', countryName: 'Australia', currencyCode: 'AUD', financialYearStartMonth: 7, financialYearStartDay: 1 },
  'IN': { countryCode: 'IN', countryName: 'India', currencyCode: 'INR', financialYearStartMonth: 4, financialYearStartDay: 1 },
  'US': { countryCode: 'US', countryName: 'United States', currencyCode: 'USD', financialYearStartMonth: 1, financialYearStartDay: 1 },
};

// Export for tests (with test-expected property names)
export const SUPPORTED_COUNTRIES = Object.values(COUNTRY_RULES).map(country => ({
  code: country.countryCode,
  name: country.countryName,
  fyStartMonth: country.financialYearStartMonth - 1, // Convert to 0-based months
  fyStartDay: country.financialYearStartDay
}));

/**
 * Get the current financial year for a given country
 */
export function getCurrentFinancialYear(countryCode: string): FinancialYear {
  const rules = COUNTRY_RULES[countryCode] || COUNTRY_RULES['AU']; // Default to Australia if country not found
  const currentDate = new Date();
  
  return getFinancialYearForDate(countryCode, currentDate);
}

/**
 * Get the financial year for a specific date
 */
export function getFinancialYearForDate(countryCode: string, date: Date): FinancialYear {
  const rules = COUNTRY_RULES[countryCode] || COUNTRY_RULES['AU']; // Default to Australia if country not found
  
  // Calculate the financial year start date for the given date's year
  const fyStartDate = new Date(date.getFullYear(), rules.financialYearStartMonth - 1, rules.financialYearStartDay);
  
  // If the given date is before the FY start, use the previous year
  if (date < fyStartDate) {
    fyStartDate.setFullYear(fyStartDate.getFullYear() - 1);
  }
  
  // Calculate the end date (one year minus one day from start)
  const fyEndDate = new Date(fyStartDate);
  fyEndDate.setFullYear(fyEndDate.getFullYear() + 1);
  fyEndDate.setDate(fyEndDate.getDate() - 1);
  
  const taxYear = fyEndDate.getFullYear();
  
  // Generate name based on country
  let name: string;
  if (countryCode === 'IN') {
    name = `FY${taxYear - 1}-${(taxYear % 100).toString().padStart(2, '0')}`;
  } else {
    name = `FY${taxYear}`;
  }
  
  return {
    startDate: fyStartDate,
    endDate: fyEndDate,
    name,
    taxYear,
  };
}

/**
 * Get a list of financial years for a given range
 */
export function getFinancialYearsForRange(countryCode: string, startYear: number, endYear: number): FinancialYear[] {
  const years: FinancialYear[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    // Create a date in the middle of the year to get the FY
    const midYearDate = new Date(year, 6, 1); // July 1st
    const fy = getFinancialYearForDate(countryCode, midYearDate);
    
    // Only add if it's within our range
    if (fy.taxYear >= startYear && fy.taxYear <= endYear) {
      years.push(fy);
    }
  }
  
  return years.sort((a, b) => a.taxYear - b.taxYear);
}

/**
 * Get the currency for a given country
 */
export function getCurrencyForCountry(countryCode: string): string {
  const rules = COUNTRY_RULES[countryCode];
  return rules ? rules.currencyCode : 'AUD';
}

/**
 * Get all available countries
 */
export function getAvailableCountries(): CountryRule[] {
  return Object.values(COUNTRY_RULES);
}

/**
 * Check if a date falls within a financial year
 */
export function isDateInFinancialYear(date: Date, financialYear: FinancialYear): boolean {
  return date >= financialYear.startDate && date <= financialYear.endDate;
}

/**
 * Get the financial year name for display
 */
export function getFinancialYearDisplayName(financialYear: FinancialYear, countryCode: string): string {
  if (countryCode === 'IN') {
    return `${financialYear.name} (${financialYear.startDate.getFullYear()}-${financialYear.endDate.getFullYear()})`;
  }
  return `${financialYear.name} (${financialYear.startDate.getFullYear()}-${financialYear.endDate.getFullYear()})`;
}

/**
 * Get the financial year name (alias for tests)
 */
export function getFinancialYearName(financialYear: FinancialYear): string {
  return financialYear.name;
} 