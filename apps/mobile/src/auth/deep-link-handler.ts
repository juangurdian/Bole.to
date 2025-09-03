import * as Linking from 'expo-linking';
import { GatewayAuthService } from './gateway-auth-service';

export interface DeepLinkHandler {
  initialize: () => void;
  cleanup: () => void;
  handleURL: (url: string) => Promise<void>;
}

class MobileDeepLinkHandler implements DeepLinkHandler {
  private linkingSubscription: any = null;
  private gatewayAuth = GatewayAuthService.getInstance();
  
  // Callback handlers for different deep link types
  private onAccountSelection?: (accounts: any[]) => void;

  initialize() {
    // Listen for incoming links when the app is already open
    this.linkingSubscription = Linking.addEventListener('url', this.handleLinkingEvent);
    
    // Handle the initial URL if the app was opened via a link
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleURL(url);
      }
    }).catch(error => {
      console.warn('Error getting initial URL:', error);
    });
  }

  cleanup() {
    if (this.linkingSubscription) {
      this.linkingSubscription.remove();
      this.linkingSubscription = null;
    }
  }

  private handleLinkingEvent = (event: { url: string }) => {
    this.handleURL(event.url);
  };

  async handleURL(url: string): Promise<void> {
    try {
      console.log('Handling deep link:', url);
      
      // Parse the URL
      const parsed = Linking.parse(url);
      
      // Handle account selection callback
      if (this.isAccountSelectionURL(parsed)) {
        await this.handleAccountSelection(url);
        return;
      }

      // Handle other deep link types (profile, events, etc.)
      await this.handleGeneralDeepLink(parsed);
    } catch (error) {
      console.error('Deep link handling failed:', error);
    }
  }


  private isAccountSelectionURL(parsed: any): boolean {
    return parsed.hostname === 'app.bole.to' && 
           parsed.path?.startsWith('/auth/select-account');
  }


  private async handleAccountSelection(url: string): Promise<void> {
    const parsed = Linking.parse(url);
    const accountId = parsed.queryParams?.accountId as string;
    const token = parsed.queryParams?.token as string;

    if (!accountId || !token) {
      throw new Error('Invalid account selection URL');
    }

    try {
      // Complete account selection with Gateway
      const response = await this.gatewayAuth.client.request('/auth/select-account', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          selectionToken: token,
        }),
      });

      const { user, tokens } = response.data;
      
      // Note: storeTokens and storeUser are private methods
      // The actual token storage will be handled by the auth service internally
      console.log('Account selection completed successfully');
    } catch (error) {
      console.error('Account selection failed:', error);
    }
  }

  private async handleGeneralDeepLink(parsed: any): Promise<void> {
    // Handle other deep link types
    console.log('General deep link:', parsed);
    
    // Example: Handle event links, profile links, etc.
    if (parsed.path?.startsWith('/event/')) {
      // Navigate to event screen
      // This would typically be handled by your navigation system
    }
    
    if (parsed.path?.startsWith('/profile/')) {
      // Navigate to profile screen
    }
    
    // Add more deep link handlers as needed
  }

  // Callback setters
  setAccountSelectionCallback(callback: (accounts: any[]) => void) {
    this.onAccountSelection = callback;
  }

  // Security helpers
  private validateCallbackSecurity(url: string): boolean {
    try {
      const parsed = Linking.parse(url);
      
      // Ensure the URL is from our trusted domain
      if (parsed.hostname !== 'app.bole.to') {
        console.warn('Deep link from untrusted domain:', parsed.hostname);
        return false;
      }

      // Ensure HTTPS (except for localhost in development)
      if (parsed.scheme !== 'https' && 
          !__DEV__ && 
          !parsed.hostname?.includes('localhost')) {
        console.warn('Deep link not using HTTPS:', parsed.scheme);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Deep link validation failed:', error);
      return false;
    }
  }

}

// Export singleton instance
export const deepLinkHandler = new MobileDeepLinkHandler();

// Export types and utilities
export type { DeepLinkHandler };

// Helper function to initialize deep linking in the app
export function initializeDeepLinking() {
  deepLinkHandler.initialize();
  return deepLinkHandler;
}

// Helper function to clean up deep linking
export function cleanupDeepLinking() {
  deepLinkHandler.cleanup();
}