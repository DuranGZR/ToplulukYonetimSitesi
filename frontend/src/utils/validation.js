import { useState } from 'react';

// Form validation utilities

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'E-posta adresi gereklidir';
  if (!re.test(email)) return 'Geçerli bir e-posta adresi giriniz';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Şifre gereklidir';
  if (password.length < 8) return 'Şifre en az 8 karakter olmalıdır';
  if (!/[A-Z]/.test(password)) return 'Şifre en az bir büyük harf içermelidir';
  if (!/[a-z]/.test(password)) return 'Şifre en az bir küçük harf içermelidir';
  if (!/[0-9]/.test(password)) return 'Şifre en az bir rakam içermelidir';
  return null;
};

export const validateRequired = (value, fieldName = 'Bu alan') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} gereklidir`;
  }
  return null;
};

export const validateMinLength = (value, minLength, fieldName = 'Bu alan') => {
  if (!value) return null;
  if (value.length < minLength) {
    return `${fieldName} en az ${minLength} karakter olmalıdır`;
  }
  return null;
};

export const validateMaxLength = (value, maxLength, fieldName = 'Bu alan') => {
  if (!value) return null;
  if (value.length > maxLength) {
    return `${fieldName} en fazla ${maxLength} karakter olmalıdır`;
  }
  return null;
};

export const validateNumber = (value, fieldName = 'Bu alan') => {
  if (!value && value !== 0) return null;
  if (isNaN(value)) {
    return `${fieldName} sayı olmalıdır`;
  }
  return null;
};

export const validateMinValue = (value, minValue, fieldName = 'Bu alan') => {
  if (!value && value !== 0) return null;
  if (Number(value) < minValue) {
    return `${fieldName} en az ${minValue} olmalıdır`;
  }
  return null;
};

export const validateMaxValue = (value, maxValue, fieldName = 'Bu alan') => {
  if (!value && value !== 0) return null;
  if (Number(value) > maxValue) {
    return `${fieldName} en fazla ${maxValue} olmalıdır`;
  }
  return null;
};

export const validateUrl = (url, fieldName = 'URL') => {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch {
    return `Geçerli bir ${fieldName} giriniz`;
  }
};

export const validateDate = (date, fieldName = 'Tarih') => {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `Geçerli bir ${fieldName} giriniz`;
  }
  return null;
};

export const validateFutureDate = (date, fieldName = 'Tarih') => {
  if (!date) return null;
  const dateError = validateDate(date, fieldName);
  if (dateError) return dateError;
  
  const dateObj = new Date(date);
  const now = new Date();
  if (dateObj <= now) {
    return `${fieldName} gelecekte olmalıdır`;
  }
  return null;
};

export const validatePastDate = (date, fieldName = 'Tarih') => {
  if (!date) return null;
  const dateError = validateDate(date, fieldName);
  if (dateError) return dateError;
  
  const dateObj = new Date(date);
  const now = new Date();
  if (dateObj >= now) {
    return `${fieldName} geçmişte olmalıdır`;
  }
  return null;
};

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end <= start) {
    return 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
  }
  return null;
};

export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) return null;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Dosya boyutu en fazla ${maxSizeMB}MB olabilir`;
  }
  return null;
};

export const validateFileType = (file, allowedTypes = []) => {
  if (!file) return null;
  if (allowedTypes.length === 0) return null;
  
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const mimeType = file.type;
  
  const isValidExtension = allowedTypes.some(type => 
    fileExtension === type.toLowerCase() || 
    type.includes('*')
  );
  
  const isValidMimeType = allowedTypes.some(type => {
    if (type.includes('*')) {
      const baseType = type.split('/')[0];
      return mimeType.startsWith(baseType);
    }
    return mimeType === type;
  });
  
  if (!isValidExtension && !isValidMimeType) {
    return `Desteklenen dosya türleri: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};

export const validateImageFile = (file, maxSizeMB = 5) => {
  if (!file) return null;
  
  const sizeError = validateFileSize(file, maxSizeMB);
  if (sizeError) return sizeError;
  
  const typeError = validateFileType(file, ['image/*', 'jpg', 'jpeg', 'png', 'gif', 'webp']);
  if (typeError) return typeError;
  
  return null;
};

export const validateUsername = (username) => {
  if (!username) return 'Kullanıcı adı gereklidir';
  if (username.length < 3) return 'Kullanıcı adı en az 3 karakter olmalıdır';
  if (username.length > 20) return 'Kullanıcı adı en fazla 20 karakter olmalıdır';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\s/g, '');
  if (!/^(\+90|0)?[0-9]{10}$/.test(cleanPhone)) {
    return 'Geçerli bir telefon numarası giriniz (örn: 5XXXXXXXXX)';
  }
  return null;
};

// Form validation hook
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    const newTouched = {};

    Object.keys(validationRules).forEach(name => {
      newTouched[name] = true;
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
  };
};

// Export all validators as a collection
export const validators = {
  email: validateEmail,
  password: validatePassword,
  required: validateRequired,
  minLength: validateMinLength,
  maxLength: validateMaxLength,
  number: validateNumber,
  minValue: validateMinValue,
  maxValue: validateMaxValue,
  url: validateUrl,
  date: validateDate,
  futureDate: validateFutureDate,
  pastDate: validatePastDate,
  dateRange: validateDateRange,
  fileSize: validateFileSize,
  fileType: validateFileType,
  imageFile: validateImageFile,
  username: validateUsername,
  phone: validatePhone,
};

export default validators;
