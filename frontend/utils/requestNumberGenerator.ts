/**
 * Utility functions for generating request numbers
 */

/**
 * Generate Import Request number in format: NAddmmyyy00000
 * @param date - Date object for the request creation date
 * @param sequenceNumber - Sequence number for the day (1-based)
 * @returns Formatted request number
 */
export const generateImportRequestNumber = (date: Date, sequenceNumber: number): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
  const sequence = sequenceNumber.toString().padStart(5, '0');
  
  return `NA${day}${month}${year}${sequence}`;
};

/**
 * Generate Export Request number in format: HAddmmyyy00000
 * @param date - Date object for the request creation date
 * @param sequenceNumber - Sequence number for the day (1-based)
 * @returns Formatted request number
 */
export const generateExportRequestNumber = (date: Date, sequenceNumber: number): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
  const sequence = sequenceNumber.toString().padStart(5, '0');
  
  return `HA${day}${month}${year}${sequence}`;
};

/**
 * Parse request number to extract date and sequence
 * @param requestNumber - Request number in format NAddmmyyy00000 or HAddmmyyy00000
 * @returns Object with date and sequence number
 */
export const parseRequestNumber = (requestNumber: string): { date: Date; sequence: number } | null => {
  const match = requestNumber.match(/^(NA|HA)(\d{2})(\d{2})(\d{2})(\d{5})$/);
  if (!match) return null;
  
  const [, prefix, day, month, year, sequence] = match;
  const fullYear = 2000 + parseInt(year); // Convert 2-digit year to 4-digit
  const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
  const sequenceNumber = parseInt(sequence);
  
  return { date, sequence: sequenceNumber };
};

/**
 * Get current date in YYYY-MM-DD format for database queries
 * @returns Current date string
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get next sequence number for today's requests
 * This should be called from API to get the next available sequence number
 * @param requestType - 'import' or 'export'
 * @returns Promise with next sequence number
 */
export const getNextSequenceNumber = async (requestType: 'import' | 'export'): Promise<number> => {
  try {
    // This should call your API endpoint to get the next sequence number
    // For now, we'll use localStorage as a fallback
    const today = getCurrentDateString();
    const key = `sequence_${requestType}_${today}`;
    const currentSequence = parseInt(localStorage.getItem(key) || '0');
    const nextSequence = currentSequence + 1;
    localStorage.setItem(key, nextSequence.toString());
    return nextSequence;
  } catch (error) {
    console.error('Error getting next sequence number:', error);
    return 1; // Fallback to 1
  }
};

/**
 * Generate a complete request number for new requests
 * @param requestType - 'import' or 'export'
 * @returns Promise with complete request number
 */
export const generateNewRequestNumber = async (requestType: 'import' | 'export'): Promise<string> => {
  const now = new Date();
  const sequenceNumber = await getNextSequenceNumber(requestType);
  
  if (requestType === 'import') {
    return generateImportRequestNumber(now, sequenceNumber);
  } else {
    return generateExportRequestNumber(now, sequenceNumber);
  }
};
