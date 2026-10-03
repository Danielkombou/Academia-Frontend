# CertiGen

CertiGen is a fast and efficient bulk certificate generator web application built with React, TypeScript, and Vite. It allows educators, event organizers, and organizations to upload a certificate template, upload a recipient name list, position the recipient name, preview the result, and instantly generate and download hundreds of personalized certificates.

## Features

- **Template Upload:** PNG, JPG, and PDF certificate background templates. PDF templates are rasterized (first page) at print-quality 300 DPI.
- **Name List Import:** CSV, TXT, or DOCX files — one name per line or a CSV with headers. Leading numbering (e.g. `1. Name`) is stripped automatically.
- **Smart Name Formatting:** Each name part is title-cased; the first two names are shown in full and any additional names are shortened to their initials (e.g. `jean paul kombou` → `Jean Paul K.`).
- **Positioning & Live Preview:** Drag/set the name position as a percentage. The preview mirrors the exact output, including font baseline alignment, so what you see is what you get.
- **Bulk Export:** Download all certificates as a ZIP archive (streamed directly to disk where supported) or download a sample PDF.
- **Print-Quality Output:** Certificates are generated at high resolution (up to 300 DPI), with the template resolution preserved and never distorted.
- **Responsive UI:** Fully responsive layout for mobile, tablet, and desktop.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- jsPDF, pdfjs-dist, JSZip, Mammoth

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## How It Works

1. **Upload a template** — PNG, JPG, or PDF (the first page of a PDF is used).
2. **Upload your names list** — CSV, TXT, or DOCX (one name per line, or CSV with headers).
3. **Position the name** — set the vertical/horizontal position and font size.
4. **Preview & generate** — check the live preview, then generate all certificates.
5. **Download** — grab the batch ZIP or a sample PDF.