/**
 * Implementation Examples for Bole.to Design System
 * 
 * This file demonstrates how to implement the new design system components
 * and provides practical examples for common use cases.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ModernButton, ButtonGroup, IconButton } from '../ModernButton';
import { Icon, QuickActionIcon, IconWithBackground } from '../IconSystem';
import { enhancedTheme, enhancedColors } from '../enhancedTheme';

// Example: Modern Button Variants
export const ButtonExamples: React.FC = () => {
  const handlePress = (variant: string) => {
    Alert.alert('Button Pressed', `You pressed the ${variant} button`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Button Variants</Text>
      
      {/* Primary Buttons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Primary Buttons</Text>
        <ModernButton
          title="Buy Tickets"
          variant="primary"
          size="large"
          leftIcon="tickets"
          onPress={() => handlePress('primary')}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Sign In"
          variant="primary"
          size="medium"
          onPress={() => handlePress('primary medium')}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Follow"
          variant="primary"
          size="small"
          onPress={() => handlePress('primary small')}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Secondary Buttons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Secondary Buttons</Text>
        <ModernButton
          title="View Details"
          variant="secondary"
          size="large"
          rightIcon="chevron.right"
          onPress={() => handlePress('secondary')}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Share Event"
          variant="secondary"
          leftIcon="share"
          onPress={() => handlePress('secondary with icon')}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Tertiary Buttons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Tertiary Buttons</Text>
        <ModernButton
          title="Learn More"
          variant="tertiary"
          onPress={() => handlePress('tertiary')}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Skip"
          variant="tertiary"
          size="small"
          onPress={() => handlePress('tertiary small')}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Ghost Buttons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Ghost Buttons</Text>
        <ModernButton
          title="Add to Calendar"
          variant="ghost"
          leftIcon="calendar"
          onPress={() => handlePress('ghost')}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Bookmark"
          variant="ghost"
          leftIcon="bookmark"
          onPress={() => handlePress('ghost bookmark')}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Danger Buttons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Danger Buttons</Text>
        <ModernButton
          title="Cancel Order"
          variant="danger"
          onPress={() => handlePress('danger')}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Delete Event"
          variant="danger"
          leftIcon="delete"
          size="medium"
          onPress={() => handlePress('danger delete')}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Button with Subtitle */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Buttons with Subtitles</Text>
        <ModernButton
          title="Premium Pass"
          subtitle="Access all events"
          variant="primary"
          size="large"
          leftIcon="tickets"
          onPress={() => handlePress('premium')}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Button States */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Button States</Text>
        <ModernButton
          title="Loading..."
          variant="primary"
          loading={true}
          onPress={() => {}}
          style={styles.buttonSpacing}
        />
        <ModernButton
          title="Disabled Button"
          variant="primary"
          disabled={true}
          onPress={() => {}}
          style={styles.buttonSpacing}
        />
      </View>
      
      {/* Button Groups */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Button Groups</Text>
        <ButtonGroup direction="horizontal" spacing={12}>
          <ModernButton
            title="Cancel"
            variant="secondary"
            onPress={() => handlePress('cancel')}
          />
          <ModernButton
            title="Confirm"
            variant="primary"
            onPress={() => handlePress('confirm')}
          />
        </ButtonGroup>
        
        <View style={styles.buttonSpacing} />
        
        <ButtonGroup direction="vertical" spacing={8}>
          <ModernButton
            title="Edit Profile"
            variant="secondary"
            fullWidth
            leftIcon="edit"
            onPress={() => handlePress('edit')}
          />
          <ModernButton
            title="Settings"
            variant="ghost"
            fullWidth
            leftIcon="settings"
            onPress={() => handlePress('settings')}
          />
        </ButtonGroup>
      </View>
      
      {/* Icon Buttons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Icon Buttons</Text>
        <View style={styles.iconButtonRow}>
          <IconButton
            icon="heart"
            variant="ghost"
            accessibilityLabel="Like event"
            onPress={() => handlePress('like')}
          />
          <IconButton
            icon="share"
            variant="ghost"
            accessibilityLabel="Share event"
            onPress={() => handlePress('share')}
          />
          <IconButton
            icon="bookmark"
            variant="ghost"
            accessibilityLabel="Bookmark event"
            onPress={() => handlePress('bookmark')}
          />
          <IconButton
            icon="settings"
            variant="secondary"
            accessibilityLabel="Settings"
            onPress={() => handlePress('settings')}
          />
        </View>
      </View>
    </ScrollView>
  );
};

// Example: Professional Icon Replacements
export const IconExamples: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Professional Icon System</Text>
      
      {/* Old vs New Icons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Emoji to Icon Replacements</Text>
        
        <View style={styles.iconComparisonRow}>
          <View style={styles.iconComparison}>
            <Text style={styles.emojiIcon}>🔍</Text>
            <Text style={styles.comparisonArrow}>→</Text>
            <Icon name="search" size="lg" color={enhancedColors.primary[400]} />
            <Text style={styles.iconLabel}>Search</Text>
          </View>
          
          <View style={styles.iconComparison}>
            <Text style={styles.emojiIcon}>📍</Text>
            <Text style={styles.comparisonArrow}>→</Text>
            <Icon name="location" size="lg" color={enhancedColors.primary[400]} />
            <Text style={styles.iconLabel}>Location</Text>
          </View>
          
          <View style={styles.iconComparison}>
            <Text style={styles.emojiIcon}>🔔</Text>
            <Text style={styles.comparisonArrow}>→</Text>
            <Icon name="notifications" size="lg" color={enhancedColors.primary[400]} />
            <Text style={styles.iconLabel}>Notifications</Text>
          </View>
          
          <View style={styles.iconComparison}>
            <Text style={styles.emojiIcon}>🎁</Text>
            <Text style={styles.comparisonArrow}>→</Text>
            <Icon name="promotions" size="lg" color={enhancedColors.primary[400]} />
            <Text style={styles.iconLabel}>Promotions</Text>
          </View>
        </View>
      </View>
      
      {/* Icon Sizes */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Icon Sizes</Text>
        <View style={styles.iconSizeRow}>
          <View style={styles.iconSizeExample}>
            <Icon name="heart" size="xs" color={enhancedColors.error[500]} />
            <Text style={styles.iconSizeLabel}>XS (12px)</Text>
          </View>
          <View style={styles.iconSizeExample}>
            <Icon name="heart" size="sm" color={enhancedColors.error[500]} />
            <Text style={styles.iconSizeLabel}>SM (16px)</Text>
          </View>
          <View style={styles.iconSizeExample}>
            <Icon name="heart" size="md" color={enhancedColors.error[500]} />
            <Text style={styles.iconSizeLabel}>MD (20px)</Text>
          </View>
          <View style={styles.iconSizeExample}>
            <Icon name="heart" size="lg" color={enhancedColors.error[500]} />
            <Text style={styles.iconSizeLabel}>LG (24px)</Text>
          </View>
          <View style={styles.iconSizeExample}>
            <Icon name="heart" size="xl" color={enhancedColors.error[500]} />
            <Text style={styles.iconSizeLabel}>XL (32px)</Text>
          </View>
        </View>
      </View>
      
      {/* Quick Action Icons */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Quick Action Icons</Text>
        <View style={styles.quickActionRow}>
          <View style={styles.quickActionExample}>
            <QuickActionIcon type="search" size="lg" />
            <Text style={styles.iconLabel}>Search</Text>
          </View>
          <View style={styles.quickActionExample}>
            <QuickActionIcon type="location" size="lg" />
            <Text style={styles.iconLabel}>Location</Text>
          </View>
          <View style={styles.quickActionExample}>
            <QuickActionIcon type="tickets" size="lg" />
            <Text style={styles.iconLabel}>Tickets</Text>
          </View>
          <View style={styles.quickActionExample}>
            <QuickActionIcon type="promotions" size="lg" />
            <Text style={styles.iconLabel}>Promotions</Text>
          </View>
        </View>
      </View>
      
      {/* Icons with Background */}
      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Icons with Background</Text>
        <View style={styles.iconBackgroundRow}>
          <IconWithBackground
            name="calendar"
            backgroundColor={enhancedColors.primary[400]}
            borderRadius={12}
            padding={12}
          />
          <IconWithBackground
            name="location"
            backgroundColor={enhancedColors.secondary[400]}
            borderRadius={12}
            padding={12}
          />
          <IconWithBackground
            name="notifications"
            backgroundColor={enhancedColors.success[500]}
            borderRadius={12}
            padding={12}
          />
          <IconWithBackground
            name="settings"
            backgroundColor={enhancedColors.neutrals.dark[400]}
            borderRadius={12}
            padding={12}
          />
        </View>
      </View>
    </ScrollView>
  );
};

// Example: Updated QuickActionsRow Implementation
export const ModernQuickActionsExample: React.FC = () => {
  const handleQuickAction = (action: string) => {
    Alert.alert('Quick Action', `You tapped ${action}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Modern Quick Actions</Text>
      <Text style={styles.description}>
        Professional icons replace emojis while maintaining the existing visual design
      </Text>
      
      <View style={styles.quickActionsContainer}>
        {/* Search/Discover */}
        <View style={styles.modernQuickAction}>
          <View style={styles.modernActionIcon}>
            <Icon name="search" size="lg" color="#FFFFFF" />
          </View>
          <Text style={styles.modernActionTitle}>Discover</Text>
          <Text style={styles.modernActionSubtitle}>Find events</Text>
        </View>
        
        {/* Location/Nearby */}
        <View style={styles.modernQuickAction}>
          <View style={styles.modernActionIcon}>
            <Icon name="location" size="lg" color="#FFFFFF" />
          </View>
          <Text style={styles.modernActionTitle}>Nearby</Text>
          <Text style={styles.modernActionSubtitle}>Local events</Text>
        </View>
        
        {/* Promotions */}
        <View style={styles.modernQuickAction}>
          <View style={styles.modernActionIcon}>
            <Icon name="promotions" size="lg" color="#FFFFFF" />
          </View>
          <Text style={styles.modernActionTitle}>Offers</Text>
          <Text style={styles.modernActionSubtitle}>Special deals</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: enhancedTheme.colors.bg,
    padding: enhancedTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: enhancedTheme.typography.sizes.xxl,
    fontWeight: enhancedTheme.typography.weights.bold,
    color: enhancedTheme.colors.text.primary,
    marginBottom: enhancedTheme.spacing.lg,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: enhancedTheme.typography.sizes.lg,
    fontWeight: enhancedTheme.typography.weights.semibold,
    color: enhancedTheme.colors.text.primary,
    marginBottom: enhancedTheme.spacing.md,
  },
  description: {
    fontSize: enhancedTheme.typography.sizes.md,
    color: enhancedTheme.colors.text.secondary,
    marginBottom: enhancedTheme.spacing.lg,
    textAlign: 'center',
    lineHeight: enhancedTheme.typography.lineHeights.relaxed * enhancedTheme.typography.sizes.md,
  },
  section: {
    marginBottom: enhancedTheme.spacing.xl,
  },
  buttonSpacing: {
    marginBottom: enhancedTheme.spacing.md,
  },
  iconButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  // Icon comparison styles
  iconComparisonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconComparison: {
    alignItems: 'center',
    width: '45%',
    marginBottom: enhancedTheme.spacing.lg,
  },
  emojiIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  comparisonArrow: {
    fontSize: 16,
    color: enhancedTheme.colors.text.tertiary,
    marginVertical: 4,
  },
  iconLabel: {
    fontSize: enhancedTheme.typography.sizes.sm,
    color: enhancedTheme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Icon size styles
  iconSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconSizeExample: {
    alignItems: 'center',
    flex: 1,
  },
  iconSizeLabel: {
    fontSize: enhancedTheme.typography.sizes.xs,
    color: enhancedTheme.colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Quick action styles
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickActionExample: {
    alignItems: 'center',
  },
  
  // Icon background styles
  iconBackgroundRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  // Modern quick actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: enhancedTheme.spacing.md,
  },
  modernQuickAction: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: enhancedTheme.colors.surface.secondary,
    borderRadius: enhancedTheme.borderRadius.lg,
    padding: enhancedTheme.spacing.md,
    margin: enhancedTheme.spacing.xs,
    borderWidth: 1,
    borderColor: enhancedTheme.colors.border.primary,
  },
  modernActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: enhancedColors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: enhancedTheme.spacing.sm,
  },
  modernActionTitle: {
    fontSize: enhancedTheme.typography.sizes.sm,
    fontWeight: enhancedTheme.typography.weights.semibold,
    color: enhancedTheme.colors.text.primary,
    marginBottom: 2,
  },
  modernActionSubtitle: {
    fontSize: enhancedTheme.typography.sizes.xs,
    color: enhancedTheme.colors.text.secondary,
    textAlign: 'center',
  },
});