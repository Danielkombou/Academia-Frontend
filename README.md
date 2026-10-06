# Veni

> **Instant, privacy-first bulk certificate generator and PDF export web application.**

**Veni** enables educators, event organizers, conference hosts, and organizations to effortlessly generate hundreds of personalized, print-ready certificates in seconds. Upload any certificate template, upload a list of recipients, position and format the text, preview the exact result live, and export the entire batch as a structured ZIP file—**100% inside your browser**.

---

## Highlights

- **100% Client-Side Privacy**: No attendee names, emails, or certificate templates are ever uploaded to a server or stored in an external database. Everything processes directly in the browser runtime.
- **Universal Template Support**: Upload templates in **PNG**, **JPG**, or **PDF**. Multi-page PDF templates automatically rasterize the first page at crisp **300 DPI** print resolution.
- **Flexible Recipient Lists**: Ingest attendee lists from **CSV**, **TXT**, or Microsoft Word (**DOCX**) files. Intelligently strips list numbering (e.g., `1. Name`, `2) Name`) and auto-detects name columns.
- **Interactive Positioning & Formatting**: Fine-tune vertical positioning with a smooth percentage slider, adjust font size, pick text colors with hex precision, and apply smart name rules (e.g., first $N$ names in full, remaining as initials like `Jean Paul K.`).
- **Live Visual Preview**: Instant WYSIWYG preview mirroring the final PDF output down to the pixel before starting batch generation.
- **High-Performance Batch Engine**: Real-time generation progress bar, batch cancellation support, and built-in memory safety heuristics to prevent browser tab crashes on massive batches.
- **Direct-to-Disk ZIP Streaming**: Uses the modern **File System Access API** (`showSaveFilePicker`) to stream large archives directly to disk without exhausting browser RAM, with an automatic in-memory fallback for other browsers.
- **Modern Accessible UI**: Crafted with Next.js 16, React 19, Tailwind CSS 4 (oklch palette), and shadcn components built on `@base-ui/react` primitives with full dark mode support.

---

## The 5-Step Generator Flow

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Step 1      │     │     Step 2      │     │     Step 3      │     │     Step 4      │     │     Step 5      │
│ Upload Template │ ──> │  Upload Names   │ ──> │ Position/Format │ ──> │ Preview & Build │ ──> │  Download Batch │
│  (PNG/JPG/PDF)  │     │ (CSV/TXT/DOCX)  │     │ (Slider, Color) │     │ (jsPDF Engine)  │     │ (Streaming ZIP) │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Upload Template (`StepTemplate`)**
   - Drag and drop or browse for an image (`.png`, `.jpg`, `.jpeg`) or document (`.pdf`).
   - Automatically determines natural dimensions and aspect ratio.
   - Applies an embedded resolution cap to balance print clarity with browser performance.
2. **Upload Recipient Names (`StepNames`)**
   - Load names from spreadsheet exports (`.csv`), plain text (`.txt`), or Word documents (`.docx`).
   - DOCX files are parsed on-demand via `mammoth` in the browser without server dependencies.
   - Cleans formatting artifacts, trims whitespace, and strips leading numbering prefixes.
   - For multi-column CSVs, pick the exact column containing recipient names.
3. **Position & Name Formatting (`StepPosition`)**
   - **Position**: Adjust vertical placement percentage ($y$-axis slider) relative to template height.
   - **Styling**: Configure font size and select custom colors using an interactive color picker.
   - **Name Rules**: Control title casing and choose how many name segments display in full versus abbreviated as initials.
4. **Preview & Generate (`StepPreview`)**
   - Test layout with first recipient preview against core PDF fonts (**Times New Roman**, **Helvetica**, **Courier**).
   - Generates individual PDFs dynamically sized to match template aspect ratio (normalized to a 297mm long edge).
   - Live progress indicator with cancellation support (`AbortController`).
   - Built-in memory estimator warns before generating batches exceeding browser memory thresholds (>150 MB).
5. **Download the Batch (`StepDone`)**
   - Download the full batch as `Certificates_Batch.zip` containing sanitized, individually named files (`Certificate_<Name>.pdf`).
   - Stream directly to disk via the File System Access API where supported, or download via an in-memory blob fallback.
   - Download a sample single PDF to inspect the final export immediately.
   - One-click reset to start a new batch.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict mode) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) with custom `oklch` color tokens |
| **Component Primitives** | [shadcn](https://ui.shadcn.com/) (base-sera style) powered by [@base-ui/react](https://base-ui.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Theme / Dark Mode** | [`next-themes`](https://github.com/pacocoursey/next-themes) with zero hydration flicker |
| **PDF Generation** | [`jspdf`](https://github.com/parallax/jsPDF) (100% in-browser document generation) |
| **PDF Rendering** | [`pdfjs-dist`](https://github.com/mozilla/pdf.js) (client-side PDF template rasterization) |
| **Word Extraction** | [`mammoth`](https://github.com/mwilliamson/mammoth.js) (browser DOCX parser, dynamic import) |
| **Archive Packaging** | Modern File System Access API (`WritableStream`) + [`jszip`](https://stuk.github.io/jszip/) fallback |
| **Tooling & Quality** | [pnpm](https://pnpm.io/), [Biome](https://biomejs.dev/) (linter/formatter), [Vitest](https://vitest.dev/) |

---

## Architecture & Project Structure

```text
veni/
├── app/
│   ├── (site)/
│   │   ├── page.tsx               # Landing page with hero banner & workflow roadmap
│   │   ├── layout.tsx             # Marketing shell wrapper
│   │   └── generate/
│   │       ├── page.tsx           # Multi-step certificate generator orchestrator
│   │       └── layout.tsx         # Generator route layout
│   ├── globals.css                # Tailwind 4 theme tokens, OKLCH colors & fonts
│   ├── layout.tsx                 # Root layout, next-themes provider & font loaders
│   └── not-found.tsx              # Custom 404 error page
├── components/
│   ├── step-template.tsx          # Step 1: Template file upload & PDF rasterization
│   ├── step-names.tsx             # Step 2: Recipient file parsing & column picker
│   ├── step-position.tsx          # Step 3: Text positioning, sizing & name formatting
│   ├── step-preview.tsx           # Step 4: WYSIWYG preview & generation engine
│   ├── step-done.tsx              # Step 5: Batch completion & ZIP download actions
│   ├── header.tsx                 # App header with branding, navigation & theme toggle
│   ├── hero.tsx                   # Landing page hero call-to-action
│   ├── footer.tsx                 # Footer with automatic copyright year
│   ├── theme-toggle.tsx           # Accessible dropdown theme switcher (Light/Dark/System)
│   └── ui/                        # shadcn design system component library
├── lib/
│   ├── docxClient.ts              # Dynamic Mammoth loader for DOCX files
│   ├── nameFormat.ts              # Recipient name casing & abbreviation formatting
│   ├── namesUtils.ts              # CSV/TXT/DOCX list parsing & number stripping
│   ├── pdfClient.ts               # PDF.js worker setup & high-DPI canvas rasterizer
│   ├── pdfGenerate.ts             # jsPDF batch generator, memory calculator & cancellation
│   ├── templateUtils.ts           # Template dimension math, aspect ratio & downscaling
│   ├── utils.ts                   # Class name merger helper
│   └── zipUtils.ts                # Direct-to-disk streaming ZIP & JSZip fallback
├── docs/                          # Architecture specifications & verification logs
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js**: `20.x` or higher
- **pnpm**: `9.x` or higher (`pnpm@11` recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Danielkombou/veni.git
   cd veni
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the local development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts the Next.js development server with Turbopack on port 3000 |
| `pnpm build` | Creates an optimized static production build |
| `pnpm start` | Runs the production server |
| `pnpm test` | Runs the complete Vitest test suite |
| `pnpm lint` | Runs Biome code quality checks |
| `pnpm format` | Automatically formats codebase with Biome |

---

## Privacy & Security

Veni operates on a **zero-knowledge architecture**:

- **No Server Processing**: All files (images, PDFs, spreadsheets, Word documents) are parsed directly in your web browser via Web APIs (`FileReader`, `HTMLCanvasElement`, `Blob`, `URL.createObjectURL`).
- **No Analytics / Tracking of Sensitive Data**: Recipient lists and generated certificates are kept entirely in volatile client memory and discarded as soon as the session ends or resets.
- **Safe Large Exports**: High-volume generations utilize the browser's native File System Access API where available to stream bytes directly onto your local disk.

---

## Verification & Parity

Veni is engineered with automated verification ensuring 100% behavioral parity with its core reference implementation:

- **190+ Automated Tests**: Comprehensive unit and integration test coverage across font sizing, PDF dimensions, CSV/TXT/DOCX name extraction, string normalization, and ZIP streaming.
- **Strict Aspect Ratio Matching**: Automatically derives output PDF page orientation and aspect ratio from the uploaded template to eliminate distortive stretching.

---

## License

Private repository. All rights reserved &copy; Veni.
