# InstantSolve

A powerful AI-powered question-answering application built with React Native and modern AI APIs.View in mobile dimensions for best experience.
Demo-https://instant-solve-bvhott926-krushna8080s-projects.vercel.app 

## 🌟 Features

- **Multiple Answer Modes**:
  - Quick Answer: Get concise responses to simple questions
  - Logical Math: Solve mathematical problems with step-by-step explanations
  - Detailed Explanations: Receive comprehensive answers with in-depth analysis
  - Image Analysis: Get insights from images (coming soon)
  - Creative Mode: Generate creative content and ideas

- **Advanced AI Integration**:
  - Primary Models: Microsoft Phi-3, Meta's Llama 3
  - Backup Models: Google Gemini, Zephyr
  - Automatic fallback system for reliable responses

- **Modern UI/UX**:
  - Clean, minimalist interface
  - Dark/Light mode support
  - Responsive design for all devices
  - Smooth animations and transitions

## 🚀 Live Demo

Try InstantSolve: [https://instantsolve-app.com](https://instantsolve-app.com)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/InstantSolve.git
cd InstantSolve
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## 🔧 Environment Setup

Create a `.env` file in the root directory with your API keys:

```env
OPENROUTER_API_KEY=your_api_key_here
```

## 📱 Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Available Scripts

- `npm start`: Start the Expo development server
- `npm run web`: Start the web version
- `npm run android`: Run on Android device/emulator
- `npm run ios`: Run on iOS simulator
- `npm run build`: Build web version for production

## 🏗️ Project Structure

```
InstantSolve/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/       # React Context providers
│   ├── screens/       # Screen components
│   ├── services/      # API and utility services
│   └── utils/         # Helper functions
├── assets/           # Images and static files
└── App.js            # Root component
```

## 🚀 Deployment

### Web Deployment

1. Build the production version:
```bash
npm run build
```

2. Deploy the `web-build` directory to your hosting service

> **Note**: For optimal visualization of the mobile app experience in web browsers:
> 1. Open Chrome DevTools (Press F12 or right-click and select "Inspect")
> 2. Click the "Toggle device toolbar" button (Ctrl+Shift+M) or click the mobile device icon
> 3. Select a mobile device preset or adjust the dimensions manually
> 4. The app will now render in mobile view for better visualization

### Mobile Deployment

Follow the [Expo publishing guide](https://docs.expo.dev/workflow/publishing/) to deploy to app stores.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License & Usage Restrictions

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### ⚠️ Important Usage Notice

- **Permission Required**: Any use, modification, or distribution of this project requires explicit written permission from the project owner.
- **No Commercial Use**: This project cannot be used for commercial purposes without prior authorization.
- **Attribution**: Proper attribution must be given to the original authors when permitted to use the project.
- **Intellectual Property**: All intellectual property rights are reserved by the project owners.

To request permission for usage, please contact the project maintainers.

## 👥 Authors

Krushna - Initial work

## 🙏 Acknowledgments

- OpenRouter for AI API access
- Microsoft, Meta, and Google for their AI models
- The React Native and Expo communities
