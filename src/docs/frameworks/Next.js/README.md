# Setting Up a Next.js Project

## System Requirements
- Node.js 18.18 or later
- Supported platforms: macOS, Windows (including WSL), and Linux

## Quick Start (Recommended)

Using `create-next-app`:

```bash
npx create-next-app@latest
```

You'll be prompted to configure:
- Project name
- TypeScript usage
- ESLint configuration
- Tailwind CSS integration
- Source directory structure
- App Router implementation
- Turbopack for development
- Import alias customization

## Manual Setup

1. Install required packages:
```bash
npm install next@latest react@latest react-dom@latest
```

2. Add scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

3. Create basic app structure:

Create the following files:

`app/layout.tsx`:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx`:
```tsx
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}
```

4. Optional: Create a `public` folder in the root directory for static assets.

## Running the Project

1. Start development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000` in your browser

## Additional Configuration

### TypeScript Setup
- Rename files to `.ts`/`.tsx`
- Next.js will automatically install dependencies and create `tsconfig.json`

### ESLint Setup
1. Add lint script to `package.json` if not already present
2. Run:
```bash
npm run lint
```
3. Choose configuration:
   - Strict (recommended)
   - Base
   - Custom

### Module Path Aliases
Configure in `tsconfig.json` or `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src/",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

This enables imports like:
```tsx
import { Component } from '@/components/component'
```