/**
 * Excel Parser
 * Utility to parse Excel/CSV files into structured data
 */

import * as XLSX from 'xlsx';

export interface ParsedExcelData {
    headers: string[];
    rows: any[][];
    metadata: {
        totalRows: number;
        totalColumns: number;
        fileName?: string;
    };
}

export class ExcelParser {
    /**
     * Parse Excel or CSV file buffer
     */
    async parse(buffer: Buffer): Promise<ParsedExcelData> {
        try {
            // Read workbook with forced UTF-8 for CSVs without BOM
            const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 65001 });

            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON (array of arrays)
            const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '', // Default value for empty cells
                blankrows: false // Skip blank rows
            });

            if (rawData.length === 0) {
                throw new Error('No data found in Excel file');
            }

            // Extract headers (first row)
            const headers = rawData[0].map((h: any) => String(h).trim());

            // Extract data rows (rest)
            const rows = rawData.slice(1).filter(row => {
                // Filter out completely empty rows
                return row.some(cell => cell !== '' && cell !== null && cell !== undefined);
            });

            return {
                headers,
                rows,
                metadata: {
                    totalRows: rows.length,
                    totalColumns: headers.length
                }
            };

        } catch (error: any) {
            throw new Error(`Failed to parse Excel file: ${error.message}`);
        }
    }

    /**
     * Parse CSV specifically (alternative implementation)
     */
    async parseCSV(buffer: Buffer, delimiter: string = ','): Promise<ParsedExcelData> {
        const text = buffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            throw new Error('Empty CSV file');
        }

        const headers = this.parseCSVLine(lines[0], delimiter);
        const rows = lines.slice(1).map(line => this.parseCSVLine(line, delimiter));

        return {
            headers,
            rows,
            metadata: {
                totalRows: rows.length,
                totalColumns: headers.length
            }
        };
    }

    /**
     * Parse a single CSV line handling quoted fields
     */
    private parseCSVLine(line: string, delimiter: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    /**
     * Detect file type from buffer
     */
    detectFileType(buffer: Buffer): 'xlsx' | 'xls' | 'csv' | 'unknown' {
        // Check magic numbers
        if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
            return 'xlsx'; // ZIP format (XLSX)
        }
        if (buffer[0] === 0xD0 && buffer[1] === 0xCF) {
            return 'xls'; // OLE2 format (XLS)
        }

        // Try to detect CSV by checking if it's valid UTF-8 text
        try {
            buffer.toString('utf-8');
            return 'csv';
        } catch {
            return 'unknown';
        }
    }
}
