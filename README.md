<div align="center">

# BuildSense

### Passive Thermal Analysis for Early-Stage Building Design


***

*Enter your building's location, envelope, and design strategies and get an overheating risk score in seconds.*

</div>

***

## What is BuildSense?

**BuildSense** is a mobile app built for architecture students and early-stage designers to evaluate the **passive thermal performance** of buildings in Indian climates — before a single brick is laid.

Instead of expensive simulation software, BuildSense lets you input your building's key parameters, fetches real-time climate data for your city, and returns an actionable **overheating risk score** with design recommendations — all from your phone.

***

## Features

- **Live Climate Data** — Fetches real-time weather (temperature, humidity, wind, cloud cover) for any Indian city via OpenWeatherMap
 
- **5-Step Project Builder** — Guided flow: Location → Building Details → Envelope → Passive Strategies → Review & Score
 
- **Thermal Score Engine** — Calculates overheating risk score (0–100) based on building orientation, wall/roof materials, WWR, and passive strategies
 
- **Cloud Sync** — All projects saved to Supabase, accessible across sessions
 
- **Climate Explorer** — Search any city and instantly see Cooling Stress, Heating Demand, and Ventilation Potential scores
 
- **Saved Projects** — Full history of all your building analyses with search and swipe-to-delete
 
- **Dark / Light Mode** — Full theme support with persistent preference
 
- **User Profiles** — Auth with avatar upload, verified account status, and project stats

***

## Getting Started

### Prerequisites

- Node.js v18+
- Expo CLI
- A Supabase project ([create one free at supabase.com](https://supabase.com))
- An OpenWeatherMap API key ([get one free at openweathermap.org](https://openweathermap.org/api))

### Installation

```bash
# Clone the repository
git clone https://github.com/AdityaSontakke23/Buildsense.git
cd Buildsense

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Open .env and fill in your own API keys (see below)

# Start the development server
npx expo start
```

### Environment Variables

You will need to supply your own API keys. Create a `.env` file in the root by copying `.env.example` and filling in the values:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key
```

> ⚠️ **Note:** The `.env` file is not included in this repository for security reasons. You must create your own Supabase project and OpenWeatherMap account to run this app locally.

***

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo) |
| Routing | Expo Router (file-based) |
| Backend & Auth | Supabase |
| State Management | Zustand |
| Forms | React Hook Form |
| Animations | React Native Animated API |
| Icons | Expo Vector Icons (Ionicons) |
| Weather API | OpenWeatherMap |
| List Performance | Shopify FlashList |

***

## 📂 Project Structure

```
app/
├── (auth)/          # Login, Signup, Password Reset
├── (tabs)/          # Home, Explore, Saved, Profile
├── new-project/     # 5-step project creation flow
└── details/[id].jsx # Dynamic project report screen

src/
├── components/      # Reusable UI (Button, Card, Input, Modal...)
├── hooks/           # useAuth, useProjects, useWeather, useTheme
├── services/        # Supabase, Auth, Projects, Weather API
├── store/           # Zustand stores (auth, projects, app)
└── utils/           # Constants, helpers, validators, error handler
```

***

## 📐 How the Score Works

BuildSense calculates a **thermal performance score (0–100)** based on:

- 📍 **Location climate** — temperature, humidity, solar radiation proxy
- 🧭 **Building orientation** — N/S/E/W facing penalty/bonus
- 🧱 **Envelope materials** — wall type (AAC, Brick, RCC) and roof type (Cool Roof, RCC Slab)
- 🪟 **Window-to-Wall Ratio (WWR)** — higher WWR in hot climates = higher risk
- 🌿 **Passive strategies** — shading, cross ventilation, courtyard, insulation

**Score thresholds:**
| Score | Risk Level |
|-------|-----------|
| > 70 | 🟢 Low Risk |
| 40 – 70 | 🟡 Medium Risk |
| < 40 | 🔴 High Risk |

***

## 📦 Download

The latest APK can be downloaded directly from the [Releases](https://github.com/AdityaSontakke23/Buildsense/releases) page.

[

> **Note:** You may need to enable *"Install from unknown sources"* in your Android settings to install the APK.

***

## Privacy

BuildSense collects only the information you provide (email, building project data). No data is sold or shared. Weather lookups are made server-side via OpenWeatherMap. All user data is stored securely on Supabase with Row Level Security (RLS) enabled.

***

## Author

**Aditya Sontakke**
- GitHub: [@AdityaSontakke23](https://github.com/AdityaSontakke23)

***

<div align="center">
  Made for architecture students in India
</div>


