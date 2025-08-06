import { FinancialYear, CountryRule } from '../types/entities';

// Country rules for financial year calculation
export const COUNTRY_RULES: Record<string, CountryRule> = {
  'US': { countryCode: 'US', countryName: 'United States', currencyCode: 'USD', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'AU': { countryCode: 'AU', countryName: 'Australia', currencyCode: 'AUD', financialYearStartMonth: 7, financialYearStartDay: 1 },
  'IN': { countryCode: 'IN', countryName: 'India', currencyCode: 'INR', financialYearStartMonth: 4, financialYearStartDay: 1 },
  'UK': { countryCode: 'UK', countryName: 'United Kingdom', currencyCode: 'GBP', financialYearStartMonth: 4, financialYearStartDay: 6 },
  'CA': { countryCode: 'CA', countryName: 'Canada', currencyCode: 'CAD', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'EU': { countryCode: 'EU', countryName: 'European Union', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'SG': { countryCode: 'SG', countryName: 'Singapore', currencyCode: 'SGD', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'NZ': { countryCode: 'NZ', countryName: 'New Zealand', currencyCode: 'NZD', financialYearStartMonth: 7, financialYearStartDay: 1 },
  'JP': { countryCode: 'JP', countryName: 'Japan', currencyCode: 'JPY', financialYearStartMonth: 4, financialYearStartDay: 1 },
  'DE': { countryCode: 'DE', countryName: 'Germany', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'FR': { countryCode: 'FR', countryName: 'France', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'IT': { countryCode: 'IT', countryName: 'Italy', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'ES': { countryCode: 'ES', countryName: 'Spain', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'NL': { countryCode: 'NL', countryName: 'Netherlands', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'CH': { countryCode: 'CH', countryName: 'Switzerland', currencyCode: 'CHF', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'SE': { countryCode: 'SE', countryName: 'Sweden', currencyCode: 'SEK', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'NO': { countryCode: 'NO', countryName: 'Norway', currencyCode: 'NOK', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'DK': { countryCode: 'DK', countryName: 'Denmark', currencyCode: 'DKK', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'FI': { countryCode: 'FI', countryName: 'Finland', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'PL': { countryCode: 'PL', countryName: 'Poland', currencyCode: 'PLN', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'CZ': { countryCode: 'CZ', countryName: 'Czech Republic', currencyCode: 'CZK', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'HU': { countryCode: 'HU', countryName: 'Hungary', currencyCode: 'HUF', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'RO': { countryCode: 'RO', countryName: 'Romania', currencyCode: 'RON', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'BG': { countryCode: 'BG', countryName: 'Bulgaria', currencyCode: 'BGN', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'HR': { countryCode: 'HR', countryName: 'Croatia', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'SI': { countryCode: 'SI', countryName: 'Slovenia', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'SK': { countryCode: 'SK', countryName: 'Slovakia', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'LT': { countryCode: 'LT', countryName: 'Lithuania', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'LV': { countryCode: 'LV', countryName: 'Latvia', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'EE': { countryCode: 'EE', countryName: 'Estonia', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'MT': { countryCode: 'MT', countryName: 'Malta', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'CY': { countryCode: 'CY', countryName: 'Cyprus', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'IE': { countryCode: 'IE', countryName: 'Ireland', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'PT': { countryCode: 'PT', countryName: 'Portugal', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'GR': { countryCode: 'GR', countryName: 'Greece', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'AT': { countryCode: 'AT', countryName: 'Austria', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'BE': { countryCode: 'BE', countryName: 'Belgium', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
  'LU': { countryCode: 'LU', countryName: 'Luxembourg', currencyCode: 'EUR', financialYearStartMonth: 1, financialYearStartDay: 1 },
};

/**
 * Get the current financial year for a given country
 */
export function getCurrentFinancialYear(countryCode: string): FinancialYear {
  const rules = COUNTRY_RULES[countryCode] || COUNTRY_RULES['US']; // Default to US if country not found
  const currentDate = new Date();
  
  return getFinancialYearForDate(countryCode, currentDate);
}

/**
 * Get the financial year for a specific date
 */
export function getFinancialYearForDate(countryCode: string, date: Date): FinancialYear {
  const rules = COUNTRY_RULES[countryCode] || COUNTRY_RULES['US']; // Default to US if country not found
  
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
  return rules ? rules.currencyCode : 'USD';
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