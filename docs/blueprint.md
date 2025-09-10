# **App Name**: KrishiRakshak

## Core Features:

- Anonymous Authentication: Implement Firebase Anonymous Authentication to identify users without requiring sign-up, storing the user ID in local storage.
- Automated Location Fetching: Automatically detect the user's location (latitude and longitude) using the browser's geolocation API, with fallback to IP-based geolocation.
- Soil Data Analysis: Fetch and display soil composition data (clay, sand, silt, pH, SOC) from the SoilGrids API based on user's location. Determine and present a derived soil type label based on the soil composition.
- Weather Alerts: Fetch weather alerts using the OpenWeather API based on the user's location and display farmer-friendly advice. This call must be proxied through a serverless function to protect the API key.
- Pest Detection with AI: Allow users to upload images of pests for analysis using a generative AI tool.  The tool will identify the pest, provide a confidence score, and recommend appropriate treatment. The AI API key will be securely managed using a serverless function.
- Data Storage in Firestore: Store user-related data, including location, soil data, pest reports, and weather alerts, in Firebase Firestore, associated with the anonymous user ID.
- Recommendations: Based on location and soil type, use a generative AI tool to provide relevant crop, fertilizer and pesticide recommendations to the farmer.  The tool will use reasoning to incorporate specific details in the generated output.

## Style Guidelines:

- Primary color: Earthy green (#8FBC8F) to reflect agriculture and nature.
- Background color: Light beige (#F5F5DC) for a natural and unobtrusive backdrop.
- Accent color: Warm orange (#E9967A) for highlighting calls to action and important information.
- Body and headline font: 'PT Sans' (humanist sans-serif) for clear and accessible text.
- Simple, clear SVG icons that are sizable for users with varying levels of literacy.
- Responsive design that adapts to different screen sizes, ensuring accessibility across devices.
- Subtle UI transitions to enhance user experience without being distracting.