// Data Protection Utilities for Sensitive Information
// 
// SECURITY NOTE: Sensitive entity data (email, phone, address, tax_identifier)
// is protected via Row Level Security (RLS) policies on the entities table.
// The validate_entity_access_enhanced() function ensures users can only access
// their own data. No client-side encryption is needed or secure.
//
// For additional protection of highly sensitive data at rest, consider using:
// - PostgreSQL pgcrypto extension (server-side)
// - Supabase Vault for column encryption (server-side)

import { supabase } from "@/integrations/supabase/client";

// Data masking functions
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : '*'.repeat(username.length);
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '*'.repeat(cleaned.length);
  const visible = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  return `${masked}${visible}`;
};

export const maskTaxIdentifier = (taxId: string): string => {
  if (!taxId) return taxId;
  if (taxId.length < 4) return '*'.repeat(taxId.length);
  const visible = taxId.slice(-3);
  const masked = '*'.repeat(taxId.length - 3);
  return `${masked}${visible}`;
};

export const maskAddress = (address: string): string => {
  if (!address) return address;
  const parts = address.split(' ');
  if (parts.length < 2) return '*'.repeat(address.length);
  // Show first part and last part, mask middle
  return `${parts[0]} ${'*'.repeat(Math.max(0, address.length - parts[0].length - parts[parts.length - 1].length - 2))} ${parts[parts.length - 1]}`;
};

// Input validation functions
export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) return { isValid: true, message: '' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
  };
};

export const validatePhone = (phone: string): { isValid: boolean; message: string } => {
  if (!phone) return { isValid: true, message: '' };
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return {
    isValid: phoneRegex.test(phone),
    message: phoneRegex.test(phone) ? '' : 'Please enter a valid phone number'
  };
};

export const validateTaxIdentifier = (taxId: string, country: string): { isValid: boolean; message: string } => {
  if (!taxId) return { isValid: true, message: '' };
  
  // Basic validation - can be enhanced per country
  if (country === 'Australia') {
    // TFN: 9 digits, ABN: 11 digits
    const cleaned = taxId.replace(/\D/g, '');
    if (cleaned.length === 9 || cleaned.length === 11) {
      return { isValid: true, message: '' };
    }
    return { isValid: false, message: 'Australian tax identifier must be 9 digits (TFN) or 11 digits (ABN)' };
  }
  
  // Generic validation
  if (taxId.length < 3) {
    return { isValid: false, message: 'Tax identifier too short' };
  }
  
  return { isValid: true, message: '' };
};

// Audit logging function
export const logSensitiveDataAccess = async (action: string, entityId: string, dataType: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${new Date().toISOString()} - User ${user.id} performed ${action} on ${dataType} for entity ${entityId}`);
    }

    // In production, this could be sent to an audit service
    // await auditService.log({ userId: user.id, action, entityId, dataType, timestamp: new Date() });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log sensitive data access:', error);
    }
  }
};

// Pass-through function for entity data retrieval
// RLS policies ensure only authorized users can access their own data
export const getSecureEntityData = (rawEntity: any) => {
  return rawEntity;
};

// Pass-through function for entity data storage
// RLS policies ensure only authorized users can store their own data
export const prepareEntityDataForStorage = (entityData: any) => {
  return entityData;
};