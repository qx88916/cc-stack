/**
 * Email validation utility
 */

/**
 * Validates if a string is a valid email address
 * @param email - Email string to validate
 * @returns true if valid email format, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Normalizes email address (lowercase and trim)
 * @param email - Email string to normalize
 * @returns Normalized email string
 */
export const normalizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Suggests correct email domain for common typos
 * @param email - Email string to check
 * @returns Suggested email if typo detected, null otherwise
 */
export const suggestEmailDomain = (email: string): string | null => {
  if (!email || typeof email !== 'string') return null;
  
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if email has @ symbol
  if (!normalizedEmail.includes('@')) return null;
  
  const [localPart, domain] = normalizedEmail.split('@');
  
  // If no domain part, return null
  if (!domain) return null;
  
  // Common email domain typos
  const domainSuggestions: Record<string, string> = {
    // Gmail typos
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmaul.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmaiil.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.cm': 'gmail.com',
    
    // Yahoo typos
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    
    // Outlook typos
    'outloo.com': 'outlook.com',
    'outlook.co': 'outlook.com',
    'outlook.con': 'outlook.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    
    // Other common typos
    'live.co': 'live.com',
    'icloud.co': 'icloud.com',
    'aol.co': 'aol.com',
  };
  
  // Check if current domain matches any typo
  const suggestedDomain = domainSuggestions[domain];
  
  if (suggestedDomain) {
    return `${localPart}@${suggestedDomain}`;
  }
  
  return null;
};
