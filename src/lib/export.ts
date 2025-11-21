/**
 * Utility functions for exporting data to various formats
 */

export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers?: Record<keyof T, string>
): void {
    if (data.length === 0) {
        throw new Error('No data to export');
    }

    // Get all unique keys from the data
    const keys = Array.from(new Set(data.flatMap(item => Object.keys(item))));

    // Create CSV headers
    const csvHeaders = keys.map(key => {
        if (headers && headers[key as keyof T]) {
            return headers[key as keyof T];
        }
        // Convert camelCase to Title Case
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    });

    // Create CSV rows
    const csvRows = data.map(item =>
        keys.map(key => {
            const value = item[key];
            // Handle different data types
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'object') {
                return JSON.stringify(value).replace(/"/g, '""');
            }
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        })
    );

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export function exportToJSON<T>(data: T[], filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}