#!/usr/bin/env node

/**
 * Intercom CSV Parser for Bonus Calculation
 *
 * Parses Intercom CSV exports and transforms them into JSON format
 * suitable for the bonus calculator application.
 *
 * Usage: node parseIntercomCSV.js input.csv [output.json]
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Clean number by removing commas and handling dashes
 * @param {string} value - The number string with commas
 * @returns {number|null} - Cleaned number or null
 */
function cleanNumber(value) {
    if (!value) return null;

    const str = String(value).trim();
    if (!str || str === '-') return null;

    // Remove commas, spaces, and extract first number found
    const cleaned = str.replace(/[,\s]/g, '');
    const match = cleaned.match(/\d+\.?\d*/);

    if (match) {
        const num = parseFloat(match[0]);
        return isNaN(num) ? null : num;
    }

    return null;
}

/**
 * Extract percentage from CSAT string - handles multiple formats
 * @param {string} value - CSAT string like "96.9%" or "87.7% (822/937)"
 * @returns {number|null} - Extracted percentage or null
 */
function extractCSAT(value) {
    if (!value || value === '-' || value.trim() === '' || value.trim() === '-') {
        return null;
    }

    const trimmed = value.trim();

    // Extract number before the % sign (handles both "96.9%" and "87.7% (822/937)")
    const match = trimmed.match(/^(\d+\.?\d*)\s*%/);
    if (match) {
        const num = parseFloat(match[1]);
        return isNaN(num) ? null : num;
    }

    return null;
}

/**
 * Find column index by searching for exact header name
 * @param {Array<string>} headers - Array of column headers
 * @param {string} searchName - The exact name to search for
 * @returns {number} - Column index or -1 if not found
 */
function findColumnIndex(headers, searchName) {
    for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].trim() === searchName) {
            return i;
        }
    }
    return -1;
}

/**
 * Parse Intercom CSV file with dynamic column detection
 * @param {string} inputPath - Path to input CSV file
 * @returns {Promise<Array>} - Array of parsed teammate data
 */
async function parseIntercomCSV(inputPath) {
    return new Promise((resolve, reject) => {
        const results = [];
        let lineNumber = 0;
        let headerRow = null;
        let nameColIndex = -1;
        let chatsColIndex = -1;
        let csatColIndex = -1;

        const fileStream = fs.createReadStream(inputPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        console.log('\n🔍 Starting CSV parsing...\n');

        rl.on('line', (line) => {
            lineNumber++;

            // Skip empty lines
            if (line.trim() === '') {
                return;
            }

            // If we haven't found the header yet, try to detect it
            if (headerRow === null) {
                const columns = parseCSVLine(line);

                // Check if this line contains the header columns we need
                const hasTeammate = columns.some(col => col && col.trim() === 'Teammate');
                const hasClosedConversations = columns.some(col => col && col.trim() === 'Closed conversations by teammates');
                const hasCSAT = columns.some(col => col && col.trim() === 'Teammate CSAT score');

                if (hasTeammate && hasClosedConversations && hasCSAT) {
                    // This is the header row!
                    headerRow = columns;
                    console.log(`\n📋 Header row found at line ${lineNumber} (${headerRow.length} columns total)\n`);

                    // Find column indices by exact header names
                    nameColIndex = findColumnIndex(headerRow, 'Teammate');
                    chatsColIndex = findColumnIndex(headerRow, 'Closed conversations by teammates');
                    csatColIndex = findColumnIndex(headerRow, 'Teammate CSAT score');

                    // Validate that we found all required columns
                    if (nameColIndex === -1) {
                        console.error('❌ Error: Could not find "Teammate" column');
                        console.log('Available columns:', headerRow);
                        reject(new Error('Missing "Teammate" column'));
                        return;
                    }
                    if (chatsColIndex === -1) {
                        console.error('❌ Error: Could not find "Closed conversations by teammates" column');
                        console.log('Available columns:', headerRow);
                        reject(new Error('Missing "Closed conversations by teammates" column'));
                        return;
                    }
                    if (csatColIndex === -1) {
                        console.error('❌ Error: Could not find "Teammate CSAT score" column');
                        console.log('Available columns:', headerRow);
                        reject(new Error('Missing "Teammate CSAT score" column'));
                        return;
                    }

                    console.log(`✅ Column mapping successful:`);
                    console.log(`   • "Teammate" found at column ${nameColIndex + 1}`);
                    console.log(`   • "Closed conversations by teammates" found at column ${chatsColIndex + 1}`);
                    console.log(`   • "Teammate CSAT score" found at column ${csatColIndex + 1}`);
                    console.log(`\n📊 Processing data rows...\n`);
                } else {
                    // This is metadata, skip it
                    console.log(`⏭️  Skipping metadata row ${lineNumber}`);
                }
                return;
            }

            // We have found the header, now process data rows
            const columns = parseCSVLine(line);

            // Skip rows with insufficient columns
            if (columns.length < Math.max(nameColIndex, chatsColIndex, csatColIndex) + 1) {
                return;
            }

            // Skip Summary row
            if (columns[nameColIndex] && columns[nameColIndex].toLowerCase().includes('summary')) {
                console.log(`⏭️  Skipping Summary row at line ${lineNumber}`);
                return;
            }

            // Extract data from the mapped columns
            const name = columns[nameColIndex] ? columns[nameColIndex].trim() : null;
            const closedConversations = cleanNumber(columns[chatsColIndex]);
            const csatScore = extractCSAT(columns[csatColIndex]);

            // Validate that we have at least a name
            if (!name || name === '-') {
                console.log(`⏭️  Row ${lineNumber}: No name found, skipping`);
                return;
            }

            // Skip rows where all data is dashes (inactive users)
            if (columns[chatsColIndex] === '-' && columns[csatColIndex] === '-') {
                console.log(`⏭️  Row ${lineNumber}: ${name} - All data is "-", skipping`);
                return;
            }

            // Data quality validation
            const hasValidChats = closedConversations !== null && closedConversations >= 0;
            const hasValidCSAT = csatScore !== null && csatScore >= 0 && csatScore <= 100;

            if (!hasValidChats && !hasValidCSAT) {
                console.log(`⚠️  Row ${lineNumber}: ${name} - No valid data (chats: ${columns[chatsColIndex]}, CSAT: ${columns[csatColIndex]})`);
            }

            results.push({
                name,
                closedConversations,
                csatScore
            });

            // Show status with data quality indicators
            const chatsDisplay = closedConversations !== null ? closedConversations.toLocaleString() : '-';
            const csatDisplay = csatScore !== null ? csatScore.toFixed(1) + '%' : '-';
            const qualityIcon = (hasValidChats && hasValidCSAT) ? '✅' : '⚠️';

            console.log(`${qualityIcon} Parsed: ${name} - ${chatsDisplay} chats - ${csatDisplay} CSAT`);
        });

        rl.on('close', () => {
            console.log(`\n${'='.repeat(60)}\n`);
            console.log(`✨ Parsing complete!\n`);

            // Data quality summary
            const withChats = results.filter(r => r.closedConversations !== null).length;
            const withCSAT = results.filter(r => r.csatScore !== null).length;
            const complete = results.filter(r => r.closedConversations !== null && r.csatScore !== null).length;

            console.log(`📊 Summary:`);
            console.log(`   Total teammates: ${results.length}`);
            console.log(`   With chat data: ${withChats} (${((withChats / results.length) * 100).toFixed(1)}%)`);
            console.log(`   With CSAT data: ${withCSAT} (${((withCSAT / results.length) * 100).toFixed(1)}%)`);
            console.log(`   Complete records: ${complete} (${((complete / results.length) * 100).toFixed(1)}%)`);

            if (results.length > 0) {
                const totalChats = results.reduce((sum, r) => sum + (r.closedConversations || 0), 0);
                const avgChats = withChats > 0 ? (totalChats / withChats).toFixed(0) : 0;

                const totalCSAT = results.reduce((sum, r) => sum + (r.csatScore || 0), 0);
                const avgCSAT = withCSAT > 0 ? (totalCSAT / withCSAT).toFixed(1) : 0;

                console.log(`\n📈 Averages:`);
                console.log(`   Avg conversations: ${avgChats}`);
                console.log(`   Avg CSAT: ${avgCSAT}%`);
            }

            resolve(results);
        });

        rl.on('error', (error) => {
            console.error(`\n❌ Error reading file: ${error.message}`);
            reject(error);
        });
    });
}

/**
 * Simple CSV line parser (handles quoted fields)
 * @param {string} line - CSV line to parse
 * @returns {Array<string>} - Array of column values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Push the last field
    result.push(current);

    return result;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('❌ Error: No input file specified');
        console.log('\nUsage: node parseIntercomCSV.js <input.csv> [output.json]');
        console.log('\nExample:');
        console.log('  node parseIntercomCSV.js intercom_export.csv output.json');
        console.log('  node parseIntercomCSV.js intercom_export.csv');
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1] || 'output.json';

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: Input file not found: ${inputPath}`);
        process.exit(1);
    }

    console.log(`📂 Reading CSV from: ${inputPath}`);
    console.log(`💾 Output will be saved to: ${outputPath}\n`);

    try {
        // Parse the CSV
        const data = await parseIntercomCSV(inputPath);

        // Write JSON output
        const jsonOutput = JSON.stringify(data, null, 2);
        fs.writeFileSync(outputPath, jsonOutput, 'utf8');

        console.log(`\n✅ Successfully saved ${data.length} records to ${outputPath}`);

        // Print summary statistics
        console.log('\n📊 Summary:');
        console.log(`   Total teammates: ${data.length}`);

        const withConversations = data.filter(d => d.closedConversations !== null).length;
        const withCSAT = data.filter(d => d.csatScore !== null).length;

        console.log(`   With closed conversations: ${withConversations}`);
        console.log(`   With CSAT scores: ${withCSAT}`);

        if (data.length > 0) {
            const totalConversations = data.reduce((sum, d) => sum + (d.closedConversations || 0), 0);
            const avgConversations = (totalConversations / withConversations).toFixed(1);

            const totalCSAT = data.reduce((sum, d) => sum + (d.csatScore || 0), 0);
            const avgCSAT = (totalCSAT / withCSAT).toFixed(1);

            console.log(`   Average conversations: ${avgConversations}`);
            console.log(`   Average CSAT: ${avgCSAT}%`);
        }

        console.log('\n🎉 Done!');

    } catch (error) {
        console.error(`❌ Error parsing CSV: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { parseIntercomCSV, cleanNumber, extractCSAT };
