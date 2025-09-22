/**
 * Converts a 24-hour time string (e.g., "14:30") to a 12-hour AM/PM format (e.g., "02:30 PM").
 * @param {string} timeStr - The 24-hour time string.
 * @returns {string} The formatted 12-hour time string.
 */
export const formatTime12Hour = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  
  const [hours24, minutes] = timeStr.split(':');
  const hours = parseInt(hours24, 10);
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert hour 0 to 12
  
  return `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * --- NEW FUNCTION ---
 * Converts a 24-hour time string (e.g., "13:00") to a simple AM/PM format (e.g., "1pm").
 * @param {string} timeStr - The 24-hour time string.
 * @returns {string} The formatted simple 12-hour time string.
 */
export const formatTimeSimple12Hour = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string' || timeStr.split(':')[1] !== '00') {
    return ''; // Only show labels for the top of the hour
  }

  const hours = parseInt(timeStr.split(':')[0], 10);
  const ampm = hours >= 12 ? 'pm' : 'am';
  let hours12 = hours % 12 || 12;

  // Don't show for the very first slot if it's midnight
  if (hours === 0 && ampm === 'am') return '';

  return `${hours12}${ampm}`;
};