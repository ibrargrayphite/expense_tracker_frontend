/**
 * Utility to extract a human-readable error message from an API error response.
 * Handles standard Axios errors and Django Rest Framework error structures.
 */
export const getErrorMessage = (err: any): string => {
    const data = err?.response?.data;

    if (!data) {
        return err?.message || 'An unexpected error occurred';
    }

    // If it's a direct string response
    if (typeof data === 'string') {
        return data;
    }

    // Handle JSON object responses
    if (typeof data === 'object') {
        // 1. Check for 'detail' key (common in DRF for single error messages)
        if (data.detail && typeof data.detail === 'string') {
            return data.detail;
        }

        // 2. Handle map of field names to error lists
        // We want to flatten these into a single string.
        // Recursive helper to flatten nested objects/arrays into strings
        const flattenErrors = (obj: any): string[] => {
            let messages: string[] = [];

            if (Array.isArray(obj)) {
                obj.forEach(item => {
                    messages = [...messages, ...flattenErrors(item)];
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    // Skip keys that might not be helpful in a toast
                    if (key === 'suggestion') return;

                    const subMessages = flattenErrors(value);
                    if (subMessages.length > 0) {
                        // If it's a field-specific error, we might want to include the field name,
                        // but sometimes DRF field names are technical. 
                        // For a toast, we usually just want the message.
                        messages = [...messages, ...subMessages];
                    }
                });
            } else {
                messages.push(String(obj));
            }

            return messages;
        };

        const allMessages = flattenErrors(data);
        if (allMessages.length > 0) {
            // Join unique messages to avoid repetition
            return Array.from(new Set(allMessages)).join(' ');
        }
    }

    return 'Something went wrong. Please try again.';
};
