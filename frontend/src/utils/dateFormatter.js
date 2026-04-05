/**
 * Format date to YYYY-MM-DD format only (no time)
 * @param {string | Date} dateValue - The date value to format
 * @returns {string} - Formatted date as YYYY-MM-DD
 */
export const formatDateOnly = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for display in tables (YYYY-MM-DD only)
 * @param {string | Date} dateValue - The date value to format
 * @returns {string} - Formatted date as YYYY-MM-DD
 */
export const displayDate = (dateValue) => {
  return formatDateOnly(dateValue);
};
