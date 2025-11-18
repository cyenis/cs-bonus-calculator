# Customer Support Bonus Calculator

A modern, web-based bonus calculator for Tier 1 customer support teams with Intercom CSV import functionality.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Bonus Calculator
- 💰 Real-time bonus calculation with live preview
- 📊 Progressive tier system with accelerators (600, 700, 800+ chats)
- 📈 Statistics dashboard showing team performance
- 🎯 Progress indicators for next milestone
- 💾 Automatic calculation history with localStorage
- 📤 CSV export for finance department
- 📱 Fully responsive mobile design
- 🎨 Modern gradient UI with smooth animations

### 🆕 CSV Upload & Bulk Processing
- 📤 **Drag & drop** or click to upload CSV files
- 👀 **Preview data** before calculating
- ✅ **Validation** - shows who qualifies
- 🧮 **Bulk calculate** bonuses for entire team
- 📊 **Auto-mapping** of Intercom CSV exports
- 🚀 **Browser-based** - no backend needed!

### CSV Parser (Node.js)
- 📁 **Works with full 17-column Intercom exports**
- 🔍 **Dynamic column detection** - finds columns by exact name
- 🔄 Automatic data cleaning and transformation
- ✅ Data quality validation with detailed reporting
- 📊 Summary statistics with percentages
- 🚀 Zero dependencies (uses only Node.js built-ins)

## Quick Start

### Web Calculator

#### Single Calculation
1. Open `index.html` in your browser
2. Enter agent name (optional), closed chats, and CSAT score
3. See real-time preview of bonus calculation
4. Click "Calculate & Save" to save to history
5. Export history as CSV for finance team

#### Bulk CSV Upload (NEW!)
1. Open `index.html` in your browser
2. **Drag & drop** your Intercom CSV export or **click to browse**
3. **Preview** the data - see who qualifies
4. Click **"Calculate All Bonuses"**
5. All results are automatically saved to history
6. Export everything to CSV for finance

### CSV Parser

```bash
# Parse an Intercom CSV export
node parseIntercomCSV.js your-export.csv output.json

# Test with sample data
npm run test-parse
```

## Bonus Formula

### Base Requirements
- **Minimum:** 500 closed chats + 90% CSAT

### Calculation
```
Bonus = Chat Bonus + CSAT Bonus
```

**Chat Bonus** - Progressive rates with accelerators:
- 500-599 chats: EUR 0.90 per chat
- 600-699 chats: EUR 0.99 per chat (+10%)
- 700-799 chats: EUR 1.08 per chat (+20%)
- 800-899 chats: EUR 1.17 per chat (+30%)
- 900-999 chats: EUR 1.26 per chat (+40%)
- 1000-1099 chats: EUR 1.35 per chat (+50%)
- 1100+ chats: EUR 1.44 per chat (+60%)

**CSAT Bonus:**
- EUR 20 per percentage point above 90%

### Examples

| Chats | CSAT | Chat Bonus | CSAT Bonus | Total |
|-------|------|------------|------------|-------|
| 500 | 90% | EUR 0 | EUR 0 | **EUR 0** |
| 600 | 90% | EUR 90 | EUR 0 | **EUR 90** |
| 700 | 90% | EUR 189 | EUR 0 | **EUR 189** |
| 700 | 95% | EUR 189 | EUR 100 | **EUR 289** |
| 800 | 95% | EUR 297 | EUR 100 | **EUR 397** |

## Installation

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 14+ (for CSV parser only)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/cs-bonus.git
cd cs-bonus

# No installation needed for web app!
# For CSV parser, no dependencies required

# Optional: Install project
npm install
```

## Usage

### Web Calculator

#### Method 1: Direct Open
```bash
open index.html
# or double-click index.html
```

#### Method 2: Local Server (Recommended)
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js http-server
npx http-server

# Then open: http://localhost:8000
```

### CSV Parser

#### Basic Usage
```bash
node parseIntercomCSV.js input.csv [output.json]
```

#### Examples
```bash
# Parse with default output
node parseIntercomCSV.js team-report.csv

# Parse with custom output filename
node parseIntercomCSV.js team-report.csv january-bonuses.json

# Test with sample data
node parseIntercomCSV.js sample_intercom.csv
```

#### Input Format
The parser expects Intercom CSV exports with:
- Metadata rows in lines 1-5
- Header row in line 6
- Data rows starting from line 7
- Three columns: Teammate name, Closed conversations, CSAT score

See `sample_intercom.csv` for an example.

#### Output Format
```json
[
  {
    "name": "John Smith",
    "closedConversations": 1459,
    "csatScore": 92.5
  }
]
```

## Project Structure

```
cs-bonus/
├── index.html              # Main calculator page
├── script.js               # Calculator logic
├── style.css               # Modern styling
├── parseIntercomCSV.js     # CSV parser script
├── sample_intercom.csv     # Sample Intercom export
├── package.json            # Project metadata
├── README.md               # This file
├── CSV_PARSER_README.md    # Detailed parser docs
└── .gitignore              # Git ignore rules
```

## CSV Upload Feature (Web App)

### How It Works

The web app now includes a **browser-based CSV upload** feature that lets you bulk-process Intercom exports without using Node.js!

#### Step 1: Upload
- **Drag & drop** your CSV file onto the upload area
- Or **click** to browse and select a file
- Supports files up to 10MB

#### Step 2: Map Your Columns
The app auto-detects your columns, but you can adjust if needed:
- **Agent Name Column** - Select which column has names
- **Closed Chats Column** - Select which column has chat counts
- **CSAT Score Column** - Select which column has CSAT scores

The preview updates instantly when you change mappings!

#### Step 3: Preview & Validate
After mapping, you'll see:
- **File name** and **row count**
- **Preview table** showing first 10 team members with:
  - Name, Chats, CSAT Score
  - **Estimated Bonus** for each person
  - **Status** (✅ Qualifies / ⚠️ Below minimum)
- **Summary** showing how many qualify

#### Step 4: Calculate
- Click **"Calculate All Bonuses"**
- Confirmation dialog shows total count
- All bonuses calculated instantly
- Results added to history automatically

#### Step 5: Export
- Use the **"Export CSV"** button
- Download complete report for finance
- Includes all team members with bonuses

### Supported CSV Format

The uploader expects **Intercom CSV exports** with:
- Metadata in rows 1-5 (skipped automatically)
- Header row in row 6
- Data starting from row 7
- Columns: Teammate name, Closed conversations, CSAT score

**Example:**
```csv
Intercom Report
Export Date: 2025-01-17
Report Type: Team Performance
Period: January 2025
Generated by: Manager

Teammate name,Closed conversations,CSAT score
John Smith,1,459,92.5% (850/920)
Jane Doe,987,89.3% (412/462)
```

### Data Cleaning

The uploader automatically:
- ✅ **Auto-detects header row** - Scans first 10 rows for column names
- ✅ **Smart number extraction** - Handles commas, spaces: `1,459` → `1459`
- ✅ **Flexible CSAT parsing** - Works with multiple formats:
  - `92.5%` → `92.5`
  - `92.5% (850/920)` → `92.5`
  - `92.5` → `92.5`
- ✅ **Handles missing data** - Converts `-` to `null`
- ✅ **Skips metadata & summary rows** - Automatically
- ✅ **Real-time validation** - Shows estimated bonuses in preview

### Advantages Over Node.js Parser

| Feature | Web Upload | Node.js Parser |
|---------|-----------|----------------|
| No installation | ✅ | ❌ |
| Visual preview with bonuses | ✅ | ❌ |
| **Column mapping UI** | ✅ | ❌ |
| Auto-detect columns | ✅ | ❌ |
| Real-time validation | ✅ | ❌ |
| Auto-calculate bonuses | ✅ | ❌ |
| Works offline | ✅ | ❌ (needs Node.js) |
| Flexible CSV formats | ✅ | ❌ (fixed format) |
| Batch processing | ✅ | ✅ |

## Features in Detail

### Real-Time Preview
As you type, the calculator shows:
- Estimated bonus amount
- Breakdown of chat vs CSAT bonus
- Progress to next tier milestone
- Visual progress bar with percentage

### Statistics Dashboard
When you have calculation history:
- Total bonuses calculated
- Number of calculations
- Average bonus amount
- Top performer bonus

### History Management
- Automatic save to localStorage
- Persistent across browser sessions
- Export to CSV for finance
- Clear history option

### Mobile Responsive
- Optimized for all screen sizes
- Touch-friendly buttons
- Stacked layout on mobile
- Full-width form fields

### Modern UX
- Toast notifications
- Smooth animations
- Progress indicators
- Empty states
- Loading states
- Hover effects

## CSV Parser Details

### Data Cleaning
The parser automatically:
- Removes commas from numbers (1,459 → 1459)
- Extracts percentages (92.5% (850/920) → 92.5)
- Converts dashes to null
- Validates numeric fields
- Skips Summary rows
- Handles missing data

### Error Handling
- Missing input file
- Invalid CSV format
- Missing columns
- Invalid numeric data
- Empty rows

### Output Statistics
After parsing, you'll see:
- Total teammates processed
- Number with conversations
- Number with CSAT scores
- Average conversations
- Average CSAT

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Development

### File Descriptions

**index.html** - Main HTML structure with:
- Statistics dashboard
- Calculator form with real-time preview
- Result display card
- History table
- Toast notification container

**script.js** - JavaScript functionality:
- Bonus calculation logic
- Real-time preview updates
- Progress bar management
- localStorage handling
- CSV export
- Toast notifications

**style.css** - Modern CSS:
- Gradient backgrounds
- Card-based layouts
- Smooth animations
- Responsive grid
- Modern form styling
- Toast notifications

**parseIntercomCSV.js** - Node.js parser:
- CSV parsing without dependencies
- Data cleaning functions
- Validation logic
- Statistics calculation

### Customization

#### Change Bonus Formula
Edit `script.js` constants:
```javascript
const BASE_RATE = 0.90;  // EUR per chat
const CSAT_RATE = 20;    // EUR per CSAT point
const TIERS = [...];     // Tier structure
```

#### Change Colors
Edit `style.css`:
```css
/* Background gradient */
body {
    background: linear-gradient(135deg, #121926 0%, #132155 100%);
}

/* Accent colors */
.btn-primary-modern {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

#### Change Thresholds
In `script.js`:
```javascript
if (closedChats >= 500 && csat >= 90) {
    // Change 500 and 90 as needed
}
```

## Troubleshooting

### Calculator Issues

**Issue: History not saving**
- Check browser localStorage is enabled
- Try clearing site data and reloading

**Issue: Preview not updating**
- Ensure JavaScript is enabled
- Check browser console for errors

**Issue: Export not working**
- Check popup blockers
- Ensure downloads are allowed

### Parser Issues

**Issue: "No input file specified"**
```bash
# Solution: Provide CSV file path
node parseIntercomCSV.js your-file.csv
```

**Issue: "Input file not found"**
```bash
# Solution: Check file path
ls -la your-file.csv
node parseIntercomCSV.js ./your-file.csv
```

**Issue: Wrong data in output**
- Verify CSV format matches Intercom export
- Check metadata rows are in lines 1-5
- Ensure header is in line 6

## FAQ

**Q: Can I use this offline?**
A: Yes! The entire web calculator works completely offline, including the CSV upload feature.

**Q: Where is my data stored?**
A: All data is stored locally in your browser's localStorage. Nothing is sent to any server.

**Q: Can I import CSV directly into the web app?**
A: **YES!** ✅ Just drag & drop your Intercom CSV export onto the upload area. No Node.js needed!

**Q: How do I bulk calculate bonuses?**
A: Use the **CSV Upload** feature in the web app! Upload your Intercom export, preview the data, and click "Calculate All Bonuses". Done!

**Q: What's the difference between web upload and Node.js parser?**
A: The web upload is easier (just drag & drop), shows a preview, and auto-calculates. The Node.js parser is for automation/scripting.

**Q: Can I customize the formula?**
A: Yes! Edit the constants in `script.js`. See Customization section above.

**Q: Does this work with other CSV formats?**
A: The parser is designed for Intercom exports. For other formats, you'll need to modify `parseIntercomCSV.js`.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Create an issue on GitHub
- Contact the development team
- Check the CSV_PARSER_README.md for parser-specific help

## Roadmap

- [x] Direct CSV import in web app ✅ **COMPLETED**
- [x] Bulk calculation mode ✅ **COMPLETED**
- [ ] PDF report generation
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Custom formula builder
- [ ] API endpoint for integrations
- [ ] Column mapping for custom CSV formats
- [ ] Email report generation

## Credits

Developed for Holded Customer Support Team

---

**Made with ❤️ by the Engineering Team**
