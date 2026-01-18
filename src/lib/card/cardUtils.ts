/**
 * Card Utility Functions
 * Helper functions for card data formatting and manipulation
 */

/**
 * Mask a card number, showing only last 4 digits
 * @param lastFour - Last 4 digits of the card
 * @returns Masked card number format "•• •• 1 2 3 4"
 */
export function maskCardNumber(lastFour: string): string {
    if (!lastFour || lastFour.length !== 4) {
        return '•• •• • • • •';
    }
    return `•• •• ${lastFour.split('').join(' ')}`;
}

/**
 * Format currency amount for display
 * @param amount - Amount in dollars
 * @param showSign - Whether to show +/- sign
 * @returns Formatted currency string
 */
export function formatCardCurrency(amount: number, showSign = false): string {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(absAmount);

    if (showSign && amount !== 0) {
        return amount < 0 ? `-${formatted}` : `+${formatted}`;
    }
    return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Calculate limit usage percentage
 * @param balance - Current balance/spend
 * @param limit - Maximum limit
 * @returns Percentage (0-100)
 */
export function calculateLimitPercentage(balance: number, limit: number): number {
    if (limit <= 0) return 0;
    const percentage = (Math.abs(balance) / limit) * 100;
    return Math.min(Math.max(percentage, 0), 100);
}

/**
 * Get icon path for merchant category
 * @param category - Merchant category
 * @returns Icon identifier or default
 */
export function getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
        'Telecommunication Services': 'phone',
        'Eating Places, Restaurants': 'utensils',
        'Hotels, Motels, and Resorts': 'building',
        'Grocery Stores': 'shopping-cart',
        'Gas Stations': 'fuel',
        'Transportation': 'car',
        'Entertainment': 'film',
        'Shopping': 'shopping-bag',
    };
    return iconMap[category] || 'credit-card';
}

/**
 * Format card expiry date
 * @param month - Expiry month
 * @param year - Expiry year
 * @returns Formatted expiry "MM/YY"
 */
export function formatExpiryDate(month: string, year: string): string {
    const shortYear = year.slice(-2);
    return `${month.padStart(2, '0')}/${shortYear}`;
}

/**
 * Validate card limit value
 * @param limit - Proposed limit value
 * @param minLimit - Minimum allowed limit
 * @param maxLimit - Maximum allowed limit
 * @returns Whether limit is valid
 */
export function isValidCardLimit(
    limit: number,
    minLimit = 100,
    maxLimit = 100000
): boolean {
    return limit >= minLimit && limit <= maxLimit && Number.isFinite(limit);
}
