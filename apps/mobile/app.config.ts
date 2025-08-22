import 'dotenv/config';

export default () => ({
  name: "Bole.to",
  slug: "boleto",
  scheme: "boleto",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "to.bole.mobile",
    infoPlist: {
      NSCameraUsageDescription: "This app uses the camera to scan QR codes for event check-ins.",
      NSPhotoLibraryUsageDescription: "This app needs access to your photo library to upload event photos."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "to.bole.mobile",
    permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    API_CORE_URL: process.env.API_CORE_URL || "http://localhost:8000",
    API_SOCIAL_URL: process.env.API_SOCIAL_URL || "http://localhost:4001",
    API_CAMERA_URL: process.env.API_CAMERA_URL || "http://localhost:4002",
    eas: {
      projectId: "your-project-id"
    }
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-barcode-scanner",
      {
        "cameraPermission": "Allow Bole.to to access your camera for scanning tickets."
      }
    ],
    [
      "expo-camera",
      {
        "cameraPermission": "Allow Bole.to to access your camera for taking photos at events."
      }
    ]
  ]
});