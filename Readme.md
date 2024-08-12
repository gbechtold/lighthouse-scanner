# Lighthouse Scanner

![Stars Media IT GmbH Logo](https://starsmedia.com/wp-content/uploads/2023/06/starsmedia_logo_main.png)

A powerful and user-friendly tool for running Google Lighthouse audits on multiple URLs from a sitemap. Developed with assistance from Claude 3.5 Sonnet AI and proudly presented by [Stars Media IT GmbH](https://starsmedia.com/).

## Features

- 🌐 Automatically fetches URLs from a sitemap
- 🚀 Runs Lighthouse audits on performance, accessibility, best practices, and SEO
- 📊 Provides detailed results for each URL
- 💾 Saves progress and allows for resuming interrupted scans
- 🔄 Outputs Back/Forward Cache (BFCache) failures
- 🔧 Lists improvement suggestions for each audit
- 😊 User-friendly console output with emojis

## Installation

1. Ensure you have [Node.js](https://nodejs.org/) (version 14 or later) installed on your system.

2. Clone this repository: git clone https://github.com/yourusername/lighthouse-scanner.git
   cd lighthouse-scanner

3. Install the required dependencies:
   npm install

## Usage

1. Run the script:
   node lighthouse_scanner.js

2. When prompted, enter the URL of your website or sitemap.

3. The script will run Lighthouse audits on each URL found in the sitemap and provide detailed results in the console.

4. Results are also saved to a JSON file for later analysis.

## Options

- `pauseTime`: Adjust the pause time between URL scans (default: 5000ms)
- `timeout`: Set the maximum time allowed for each Lighthouse run (default: 120000ms)

To modify these options, edit the constants at the top of the `lighthouse_scanner.js` file.

## Compatibility

- Operating Systems: Windows, macOS, Linux
- Node.js: Version 14 or later
- Browsers: The script uses Puppeteer to launch a headless Chrome instance. Ensure you have Google Chrome installed on your system.

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact [Stars Media IT GmbH](https://starsmedia.com/contact/) for professional support.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Developed with assistance from Claude 3.5 Sonnet AI
- Powered by Google Lighthouse
- Created by [Stars Media IT GmbH](https://starsmedia.com/)

---

© 2024 Stars Media IT GmbH. All rights reserved.
