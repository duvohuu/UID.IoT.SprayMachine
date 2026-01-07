import { WORK_SHIFT, TIME_CONFIG } from '../constant/workShift.constant.js';

/**
 * Get date string in Vietnam timezone (UTC+7)
 * @param {number} daysOffset - Number of days to offset from today
 * @returns {string} Date string in format YYYY-MM-DD
 */
export const getVietnamDateString = (daysOffset = 0) => {
    const now = new Date();
    const vnTime = new Date(
        now.getTime() + 
        (TIME_CONFIG.VIETNAM_TIMEZONE_OFFSET * 60 * 60 * 1000) + 
        (daysOffset * 24 * 60 * 60 * 1000)
    );
    return vnTime.toISOString().split('T')[0];
};

/**
 * Get current time in Vietnam timezone
 * @returns {Date} Current time in Vietnam timezone
 */
export const getVietnamTime = () => {
    const now = new Date();
    return new Date(now.getTime() + (TIME_CONFIG.VIETNAM_TIMEZONE_OFFSET * 60 * 60 * 1000));
};

/**
 * Create precise timestamp for work start time (6:00 AM) of specified date
 * @param {string} dateString - Date string in format YYYY-MM-DD
 * @returns {Date} Work start time timestamp
 */
export const getWorkStartTime = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    date.setUTCHours(
        WORK_SHIFT.START_HOUR - TIME_CONFIG.VIETNAM_TIMEZONE_OFFSET, 
        WORK_SHIFT.START_MINUTE, 
        0, 
        0
    );
    return date;
};

/**
 * Check if current time is within work shift
 * @returns {boolean} true if within work shift
 */
export const isWithinWorkShift = () => {
    const vnTime = getVietnamTime();
    const currentHour = vnTime.getUTCHours();
    const currentMinute = vnTime.getUTCMinutes();
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = WORK_SHIFT.START_HOUR * 60 + WORK_SHIFT.START_MINUTE;
    const endTotalMinutes = WORK_SHIFT.END_HOUR * 60 + WORK_SHIFT.END_MINUTE;
    
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
};

/**
 * Format work shift time for display
 * @returns {string} Formatted work shift (e.g., "06:00 - 22:00")
 */
export const formatWorkShift = () => {
    const startTime = `${WORK_SHIFT.START_HOUR.toString().padStart(2, '0')}:${WORK_SHIFT.START_MINUTE.toString().padStart(2, '0')}`;
    const endTime = `${WORK_SHIFT.END_HOUR.toString().padStart(2, '0')}:${WORK_SHIFT.END_MINUTE.toString().padStart(2, '0')}`;
    return `${startTime} - ${endTime}`;
};

/**
 * Get Monday of the week for a given date
 * @param {string} dateString - Date string in format YYYY-MM-DD
 * @returns {string} Monday date string in format YYYY-MM-DD
 */
export const getMondayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diff);
    
    return monday.toISOString().split('T')[0];
};

/**
 * Get day of week name in Vietnamese
 * @param {string} dateString - Date string in format YYYY-MM-DD
 * @returns {string} Day name (e.g., "T2", "T3", "CN")
 */
export const getDayOfWeekName = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDay();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[day];
};

/**
 * Generate array of dates for a week starting from Monday
 * @param {string} mondayDate - Monday date string in format YYYY-MM-DD
 * @returns {string[]} Array of 7 date strings
 */
export const getWeekDates = (mondayDate) => {
    const dates = [];
    const monday = new Date(mondayDate + 'T00:00:00Z');
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setUTCDate(monday.getUTCDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
};