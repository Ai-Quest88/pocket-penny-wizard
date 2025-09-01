// Data Protection Utilities for Sensitive Information
import { supabase } from "@/integrations/supabase/client";

// Simple XOR encryption for client-side data protection
// Note: This is basic protection, real encryption should be server-side
const ENCRYPTION_KEY = "ENTITY_DATA_PROTECTION_2024";

export const encryptSensitiveData = (data: string): string => {
  if (!data) return data;
  
  let encrypted = "";
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted); // Base64 encode
};

export const decryptSensitiveData = (encryptedData: string): string => {
  if (!encryptedData) return encryptedData;
  
  try {
    const decoded = atob(encryptedData); // Base64 decode
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch {
    return encryptedData; // Return as-is if decryption fails
  }
};

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
    console.error('Failed to log sensitive data access:', error);
  }
};

// Secure data retrieval with automatic decryption
export const getSecureEntityData = (rawEntity: any) => {
  if (!rawEntity) return rawEntity;

  return {
    ...rawEntity,
    email: rawEntity.email ? decryptSensitiveData(rawEntity.email) : rawEntity.email,
    phone: rawEntity.phone ? decryptSensitiveData(rawEntity.phone) : rawEntity.phone,
    address: rawEntity.address ? decryptSensitiveData(rawEntity.address) : rawEntity.address,
    tax_identifier: rawEntity.tax_identifier ? decryptSensitiveData(rawEntity.tax_identifier) : rawEntity.tax_identifier,
  };
};

// Prepare data for secure storage
export const prepareEntityDataForStorage = (entityData: any) => {
  return {
    ...entityData,
    email: entityData.email ? encryptSensitiveData(entityData.email) : entityData.email,
    phone: entityData.phone ? encryptSensitiveData(entityData.phone) : entityData.phone,
    address: entityData.address ? encryptSensitiveData(entityData.address) : entityData.address,
    tax_identifier: entityData.tax_identifier ? encryptSensitiveData(entityData.tax_identifier) : entityData.tax_identifier,
  };
};