export default {
  name: "bole.to (mock)",
  slug: "boleto-mock",
  scheme: "boleto",
  ios: { bundleIdentifier: "to.bole.mobile.mock" },
  android: { package: "to.bole.mobile.mock" },
  extra: {
    MOCK_MODE: true
  }
};