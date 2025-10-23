<div align="center">
  <img src="256.png" alt="Epub-from-Novelight Logo" width="128" height="128">
  
  # Epub-from-Novelight
  
  Extract and create epub files from novels on novelight.net
  
  [![GitHub stars](https://img.shields.io/github/stars/sakshamA06/Epub-from-Novelight?style=social)](https://github.com/sakshamA06/Epub-from-Novelight/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/sakshamA06/Epub-from-Novelight?style=social)](https://github.com/sakshamA06/Epub-from-Novelight/network/members)
  [![GitHub issues](https://img.shields.io/github/issues/sakshamA06/Epub-from-Novelight)](https://github.com/sakshamA06/Epub-from-Novelight/issues)
  [![GitHub license](https://img.shields.io/github/license/sakshamA06/Epub-from-Novelight)](https://github.com/sakshamA06/Epub-from-Novelight/blob/main/LICENSE)
</div>

## Features

- Download novels from novelight.net and convert them to EPUB format
- Interactive CLI prompts for easy configuration
- Customizable chapter ranges
- Table of contents organization with chapter groupings
- Cover image support
- Metadata extraction (title, author, description)
- Temporary file management

## Installation & Usage

### Production (NPX - Recommended)

Run directly without installation:

```bash
npx epubfromweb
```

### Development

1. Clone the repository:
```bash
git clone https://github.com/sakshamA06/Epub-from-Novelight.git
cd Epub-from-Novelight
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

## How to Use

1. **Run the application** using either `npx epubfromweb` or `npm start`

2. **Follow the interactive prompts:**
   - **Novel URL**: Provide the novelight.net book URL (e.g., `https://novelight.net/book/your-novel`)
   - **Chapter Range**: Enter first and last chapter numbers
   - **Book Details**: Title, author, publisher (auto-filled from website)
   - **Description**: Press Enter to open your default text editor for description editing
   - **Cover Image**: URL for cover image (auto-filled)
   - **Table of Contents**: Configure TOC title and chapter groupings
   - **Language**: Two-letter language code (default: "en")
   - **File Name**: Output EPUB filename
   - **Options**: Choose to regenerate temp files and delete them after completion

3. **Wait for completion** - the tool will:
   - Fetch chapter metadata
   - Download individual chapters
   - Generate the EPUB file
   - Apply TOC transformations (if configured)

## Project Structure

```
Epub-from-Novelight/
├── src/
│   ├── index.js          # Main application entry point
│   ├── genChapIDs.js     # Chapter ID extraction logic
│   ├── getChapter.js     # Individual chapter fetching
│   └── transformTOC.js   # Table of contents transformation
├── tempFiles-{novelID}/  # Temporary files (auto-generated)
│   ├── chapters/         # Downloaded chapter files
│   └── all-chap-ids.json # Chapter metadata cache
├── package.json          # Project configuration
├── README.md            # This file
└── {filename}.epub      # Generated EPUB output
```

## Configuration Options

- **Chapter Groupings**: Use format like `[10, 5]` to group chapters in TOC
- **Language Codes**: Use ISO 639-1 codes (en, es, fr, etc.)
- **Temporary Files**: Option to keep or delete after generation
- **Regeneration**: Force re-download of chapters if needed

## Requirements

- Node.js (v14 or higher recommended)
- Internet connection for downloading novels
- Default text editor configured for description editing

## Troubleshooting

- **Description stuck**: Press Enter to open your text editor, then save and close
- **Invalid URL**: Ensure the URL is from novelight.net and follows the correct format
- **Chapter errors**: Check if the chapter range is valid for the novel
- **TOC errors**: The tool will skip TOC transformation if the structure is unexpected

## Contributors

Thanks to all the contributors who have helped make this project better!

[![Contributors](https://contrib.rocks/image?repo=sakshamA06/Epub-from-Novelight)](https://github.com/sakshamA06/Epub-from-Novelight/graphs/contributors)

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

AGPL-3.0 - see the [LICENSE](LICENSE) file for details.