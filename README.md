# FitMetrics — Expo React Native App

A cross-platform health calculator application built with **Expo SDK 51**, **TypeScript**, **React Navigation**, and **Material-inspired dark mode styling**.

---

## 📱 Features

- **Progress & Analytics**: 30-day weight goal progress tracker, quick stats summary.
- **BMI Calculator**: Body Mass Index with color-coded categories.
- **BMR Calculator**: Basal Metabolic Rate using Mifflin-St Jeor formula.
- **Body Fat Calculator**: US Navy logarithmic calculation (Male/Female).
- **Ideal Weight Calculator**: Devine formula with ±10% healthy weight range.

---

## 📂 Folder Structure

```
fitmetrics-expo/
├── App.tsx                       # App Entry Point & Navigation Container
├── app.json                      # Expo App Configuration
├── tsconfig.json                 # TypeScript Configuration
├── package.json                  # Dependencies & Scripts
├── .gitignore                    # Node modules & Expo cache exclusions
└── src/
    ├── components/               # Header, InputCard, ResultCard
    ├── data/                     # Storage data layer
    ├── hooks/                    # Custom hooks
    ├── navigation/               # React Navigation BottomTabNavigator
    ├── screens/                  # Progress, BMI, BMR, Body Fat, Ideal Weight, About
    └── utils/                    # Math Calculators (BMI, BMR, Body Fat, Ideal Weight)
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
npm start
```

### 3. Run on Mobile / Emulator
- **Android**: Press `a` in the terminal or run `npm run android`
- **iOS**: Press `i` in the terminal or run `npm run ios`
- **Expo Go App**: Scan the QR code from your physical device
