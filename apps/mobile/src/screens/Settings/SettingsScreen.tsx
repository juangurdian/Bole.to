import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SettingsScreenProps {
  navigation: any;
}

interface SettingSection {
  title: string;
  items: Array<{
    icon: string;
    label: string;
    screen?: string;
    badge?: string;
  }>;
}

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    title: "Account",
    items: [
      { icon: "👤", label: "Edit Profile", screen: "EditProfile" },
      { icon: "🎯", label: "Interests", screen: "Interests" },
      { icon: "🔗", label: "Connected Accounts", screen: "ConnectedAccounts" },
    ]
  },
  {
    title: "Privacy & Safety",
    items: [
      { icon: "🔒", label: "Privacy Settings", screen: "PrivacySettings" },
      { icon: "🚫", label: "Blocked & Muted", screen: "BlockedMuted" },
      { icon: "🛡️", label: "Safety Center", screen: "SafetyCenter" },
    ]
  },
  {
    title: "Notifications",
    items: [
      { icon: "🔔", label: "Push Notifications", screen: "NotificationsScreen" },
      { icon: "📧", label: "Email Preferences", screen: "EmailPreferences" },
      { icon: "🌙", label: "Quiet Hours", screen: "QuietHours" },
    ]
  },
  {
    title: "Payments",
    items: [
      { icon: "💳", label: "Payment Methods", screen: "PaymentMethods" },
      { icon: "🧾", label: "Receipts & History", screen: "Receipts" },
      { icon: "🏷️", label: "Promo Codes", screen: "PromoCodes" },
    ]
  },
  {
    title: "Security",
    items: [
      { icon: "🔑", label: "Change Password", screen: "ChangePassword" },
      { icon: "📱", label: "Two-Factor Auth", screen: "TwoFactorAuth" },
      { icon: "📊", label: "Sessions & Devices", screen: "Sessions" },
    ]
  },
  {
    title: "General",
    items: [
      { icon: "🌐", label: "Language & Region", screen: "LanguageRegion" },
      { icon: "♿", label: "Accessibility", screen: "Accessibility" },
      { icon: "📱", label: "App Preferences", screen: "AppPreferences" },
    ]
  },
  {
    title: "Support & Legal",
    items: [
      { icon: "❓", label: "Help Center", screen: "HelpCenter" },
      { icon: "📄", label: "Terms & Privacy", screen: "Legal" },
      { icon: "📤", label: "Export Data", screen: "ExportData" },
    ]
  },
  {
    title: "Danger Zone",
    items: [
      { icon: "🗑️", label: "Delete Account", screen: "DeleteAccount" },
    ]
  }
];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const handleItemPress = (screen?: string) => {
    if (screen) {
      navigation.navigate(screen);
    }
  };

  const renderSection = (section: SettingSection, index: number) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map((item, itemIndex) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.settingItem,
              itemIndex === section.items.length - 1 && styles.lastItem,
              section.title === "Danger Zone" && styles.dangerItem
            ]}
            onPress={() => handleItemPress(item.screen)}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>{item.icon}</Text>
              <Text style={[
                styles.settingLabel,
                section.title === "Danger Zone" && styles.dangerLabel
              ]}>
                {item.label}
              </Text>
            </View>
            
            <View style={styles.settingItemRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {SETTINGS_SECTIONS.map(renderSection)}
        
        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  dangerItem: {
    backgroundColor: "#FFF5F5",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dangerLabel: {
    color: "#dc3545",
  },
  settingItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  chevron: {
    fontSize: 18,
    color: "#c7c7cc",
    fontWeight: "300",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: "#666",
  },
});