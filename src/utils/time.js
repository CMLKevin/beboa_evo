// Time constants in milliseconds
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const COOLDOWN_HOURS = 24;
export const GRACE_PERIOD_HOURS = 72;

export const COOLDOWN_MS = COOLDOWN_HOURS * HOUR_MS;
export const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * HOUR_MS;

/**
 * Get time elapsed since last check-in in milliseconds
 * @param {string|null} lastCheckinISO - ISO8601 timestamp of last check-in
 * @returns {number|null} Milliseconds since last check-in, or null if never checked in
 */
export function getTimeSinceLastCheckin(lastCheckinISO) {
    if (!lastCheckinISO) return null;

    const lastCheckin = new Date(lastCheckinISO);
    const now = new Date();

    return now.getTime() - lastCheckin.getTime();
}

/**
 * Format milliseconds remaining into "Xh Ym" format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {Object} Object with hours and minutes
 */
export function formatTimeRemaining(milliseconds) {
    const totalMinutes = Math.ceil(milliseconds / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
}

/**
 * Check if user can check in and determine streak status
 * @param {string|null} lastCheckinISO - ISO8601 timestamp of last check-in
 * @returns {Object} Check-in status object
 */
export function canCheckin(lastCheckinISO) {
    // First time check-in
    if (!lastCheckinISO) {
        return {
            canCheckin: true,
            reason: 'first',
            timeSince: null,
            remaining: null
        };
    }

    const timeSince = getTimeSinceLastCheckin(lastCheckinISO);

    // Still on cooldown (< 24 hours)
    if (timeSince < COOLDOWN_MS) {
        const remaining = COOLDOWN_MS - timeSince;
        return {
            canCheckin: false,
            reason: 'cooldown',
            timeSince,
            remaining,
            ...formatTimeRemaining(remaining)
        };
    }

    // Within grace period (24-72 hours) - streak continues
    if (timeSince <= GRACE_PERIOD_MS) {
        // Determine if it's a "close call" (between 48-72 hours)
        const isRecovered = timeSince > (48 * HOUR_MS);

        return {
            canCheckin: true,
            reason: isRecovered ? 'recovered' : 'continue',
            timeSince,
            remaining: null
        };
    }

    // Beyond grace period (> 72 hours) - streak resets
    return {
        canCheckin: true,
        reason: 'reset',
        timeSince,
        remaining: null
    };
}

/**
 * Check if this is the user's first ever check-in
 * @param {string|null} lastCheckinISO - ISO8601 timestamp of last check-in
 * @returns {boolean} True if first check-in
 */
export function isFirstCheckin(lastCheckinISO) {
    return !lastCheckinISO;
}

/**
 * Get current timestamp in ISO8601 format
 * @returns {string} ISO8601 timestamp
 */
export function getCurrentTimestamp() {
    return new Date().toISOString();
}

/**
 * Format a duration in hours for display
 * @param {number} hours - Number of hours
 * @returns {string} Formatted string
 */
export function formatHours(hours) {
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
}
