# Stacky

AI-powered CLI tool for scaffolding web applications with automated tech stack configuration and project setup.

## Description

Stacky streamlines the process of creating new web applications by leveraging AI to recommend and configure tech stacks based on user preferences. It validates your development environment and automates the project setup process.

## Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/stacky.git
cd stacky

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm run local
```

## Setup

1. Create a `.env` file in the root directory:

```
DEEPSEEK_API_KEY=your_api_key_here
```

2. Configure TypeScript:

```sh
npm run build
```

## Running Stacky

### Create a new project

```sh
stacky create
```

### Development mode

```sh
npm run dev
```

## Development Commands

- `npm run build` - Build the project
- `npm run start` - Run the CLI

## Links

- [Deepseek API](https://api-docs.deepseek.com/)
