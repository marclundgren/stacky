# Setting Up an Expo Project

## System Requirements
- Node.js LTS version
- Supported platforms:
  - macOS
  - Windows (PowerShell and WSL 2)
  - Linux

## Quick Start

Create a new Expo project using the following command:

```bash
npx create-expo-app@latest
```

This will create a new project with the default template, which includes example code to help you get started.

## Custom Templates

You can use a different template by adding the `--template` flag:

```bash
npx create-expo-app@latest your-app-name --template <template-name>
```

## Project Structure
After creation, your project structure will look like this:

```
your-expo-app/
├── assets/
├── node_modules/
├── .gitignore
├── app.json
├── App.js
├── babel.config.js
├── package.json
└── README.md
```

## Next Steps
1. Install the Expo Go app on your mobile device
2. Start the development server
3. Scan the QR code with your mobile device
4. Begin developing your app

## Development Commands
```bash
# Start the development server
npx expo start

# Start with clearing cache
npx expo start -c

# Start on a specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Additional Resources
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Expo GitHub Repository](https://github.com/expo/expo)