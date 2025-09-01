import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  validateEmail, 
  validatePhone, 
  validateTaxIdentifier,
  maskEmail,
  maskPhone,
  maskTaxIdentifier,
  maskAddress
} from "@/utils/dataProtection";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecureEntityFormProps {
  formData: {
    email?: string;
    phone?: string;
    address?: string;
    taxIdentifier?: string;
    countryOfResidence: string;
  };
  onFormDataChange: (data: any) => void;
  showSensitiveData?: boolean;
}

export const SecureEntityForm: React.FC<SecureEntityFormProps> = ({
  formData,
  onFormDataChange,
  showSensitiveData = false
}) => {
  const [showSensitive, setShowSensitive] = useState(showSensitiveData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate input in real-time
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.message;
      }
    }

    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.message;
      }
    }

    if (formData.taxIdentifier) {
      const taxValidation = validateTaxIdentifier(formData.taxIdentifier, formData.countryOfResidence);
      if (!taxValidation.isValid) {
        errors.taxIdentifier = taxValidation.message;
      }
    }

    setValidationErrors(errors);
  }, [formData.email, formData.phone, formData.taxIdentifier, formData.countryOfResidence]);

  const handleInputChange = (field: string, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const getDisplayValue = (value: string | undefined, maskFunction: (val: string) => string) => {
    if (!value) return '';
    return showSensitive ? value : maskFunction(value);
  };

  const getValidationIcon = (field: string) => {
    const hasError = validationErrors[field];
    const hasValue = formData[field as keyof typeof formData];
    
    if (!hasValue) return null;
    if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Security Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <span>Sensitive data is encrypted and protected</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSensitive(!showSensitive)}
              className="h-auto p-1 text-amber-700 hover:text-amber-800"
            >
              {showSensitive ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={showSensitive ? (formData.email || '') : getDisplayValue(formData.email, maskEmail)}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Email address (optional)"
            className={`pr-10 ${
              validationErrors.email
                ? "border-red-500 focus:border-red-500"
                : formData.email && !validationErrors.email
                ? "border-green-500 focus:border-green-500"
                : ""
            }`}
            disabled={!showSensitive && !!formData.email}
          />
          {formData.email && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('email')}
            </div>
          )}
        </div>
        {validationErrors.email && (
          <p className="text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Input
            id="phone"
            type="tel"
            value={showSensitive ? (formData.phone || '') : getDisplayValue(formData.phone, maskPhone)}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Phone number (optional)"
            className={`pr-10 ${
              validationErrors.phone
                ? "border-red-500 focus:border-red-500"
                : formData.phone && !validationErrors.phone
                ? "border-green-500 focus:border-green-500"
                : ""
            }`}
            disabled={!showSensitive && !!formData.phone}
          />
          {formData.phone && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('phone')}
            </div>
          )}
        </div>
        {validationErrors.phone && (
          <p className="text-sm text-red-600">{validationErrors.phone}</p>
        )}
      </div>

      {/* Address Field */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={showSensitive ? (formData.address || '') : getDisplayValue(formData.address, maskAddress)}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Physical address (optional)"
          disabled={!showSensitive && !!formData.address}
        />
      </div>

      {/* Tax Identifier Field */}
      <div className="space-y-2">
        <Label htmlFor="taxIdentifier">Tax Identification Number</Label>
        <div className="relative">
          <Input
            id="taxIdentifier"
            value={showSensitive ? (formData.taxIdentifier || '') : getDisplayValue(formData.taxIdentifier, maskTaxIdentifier)}
            onChange={(e) => handleInputChange('taxIdentifier', e.target.value)}
            placeholder="Tax identifier (optional)"
            className={`pr-10 ${
              validationErrors.taxIdentifier
                ? "border-red-500 focus:border-red-500"
                : formData.taxIdentifier && !validationErrors.taxIdentifier
                ? "border-green-500 focus:border-green-500"
                : ""
            }`}
            disabled={!showSensitive && !!formData.taxIdentifier}
          />
          {formData.taxIdentifier && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('taxIdentifier')}
            </div>
          )}
        </div>
        {validationErrors.taxIdentifier && (
          <p className="text-sm text-red-600">{validationErrors.taxIdentifier}</p>
        )}
      </div>
    </div>
  );
};