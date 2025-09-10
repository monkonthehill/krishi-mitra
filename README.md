# KrishiRakshak

KrishiRakshak is a farmer-focused web application designed to provide crucial agricultural insights. It leverages modern technology to offer soil analysis, weather alerts, AI-powered pest detection, and personalized crop recommendations.

## Features

- **Anonymous User Profiles**: Seamless experience with no sign-up required, powered by Firebase Anonymous Authentication.
- **Automated Location**: Automatically fetches the user's location to provide localized data.
- **Soil Analysis**: Integrates with the SoilGrids API to deliver detailed soil composition data (clay, sand, silt, pH, SOC) and a derived soil type.
- **Weather Alerts**: Provides farmer-friendly weather alerts and advice using the OpenWeather API.
- **AI Pest Detection**: Upload a photo of a potential pest and get an instant analysis, confidence score, and treatment advice from a generative AI model.
- **AI Crop Recommendations**: Receive tailored crop, fertilizer, and pesticide recommendations based on your location and soil type.
- **Secure Data Storage**: All user data is securely stored in Firebase Firestore.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS with shadcn/ui
- **Authentication**: Firebase Anonymous Authentication
- **Database**: Firebase Firestore
- **File Storage**: Firebase Storage
- **Generative AI**: Google AI (Gemini) via Genkit
- **APIs**: SoilGrids, OpenWeather

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, pnpm, or yarn
- A Firebase project
- An OpenWeather API key
- A Google AI (Gemini) API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```

    Now, open the `.env` file and add your credentials.

    - **Firebase:** Find your Firebase project configuration in the Firebase console (`Project settings > General > Your apps > Web app`).
    - **OpenWeather:** Get your API key from [OpenWeather](https://openweathermap.org/api).
    - **Google AI:** Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    Your `.env` file should look like this:

    ```env
    # Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY=AI...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-...

    # Sensitive Keys
    OPENWEATHER_API_KEY=...
    GOOGLE_API_KEY=...
    ```

### Running the Development Server

You can run the application with the following command:

```bash
npm run dev
```

This will start the Next.js development server, typically on [http://localhost:9002](http://localhost:9002).

## Security

- **API Keys**: All sensitive API keys (OpenWeather, Google AI) are used only in server-side code (Next.js Server Actions) and are not exposed to the client.
- **Firebase Rules**: It is recommended to configure Firestore security rules to ensure users can only write to their own data. For example:
  ```json
  {
    "rules": {
      "users": {
        "$uid": {
          ".read": "request.auth.uid == $uid",
          ".write": "request.auth.uid == $uid"
        }
      }
    }
  }
  ```
