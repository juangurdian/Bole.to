import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth, AppleRequestScope, AppleRequestOperation } from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { GatewayError } from './gateway-auth-service';

export interface OAuthProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  startOAuth: () => Promise<string>;
}

class GoogleOAuthProvider implements OAuthProvider {
  name = 'google';
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      this.initialized = true;
    } catch (error) {
      console.warn('Google Sign-In configuration failed:', error);
      throw new GatewayError('GOOGLE_CONFIG_ERROR', 'Failed to configure Google Sign-In', 500);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch (error) {
      console.warn('Google Play Services not available:', error);
      return false;
    }
  }

  async startOAuth(): Promise<string> {
    try {
      await this.initialize();
      
      // Sign out first to ensure account selection
      await GoogleSignin.signOut();
      
      const userInfo = await GoogleSignin.signIn();
      
      if ('idToken' in userInfo && !userInfo.idToken) {
        throw new GatewayError('GOOGLE_ID_TOKEN_ERROR', 'Google ID token not received', 400);
      }

      // Return the authorization code or ID token for Gateway processing
      if ('serverAuthCode' in userInfo && userInfo.serverAuthCode) {
        return userInfo.serverAuthCode;
      }
      if ('idToken' in userInfo && userInfo.idToken) {
        return userInfo.idToken;
      }
      
      throw new GatewayError('GOOGLE_OAUTH_ERROR', 'No valid token received from Google', 400);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new GatewayError('OAUTH_CANCELLED', 'Google sign-in was cancelled', 400);
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new GatewayError('OAUTH_IN_PROGRESS', 'Google sign-in already in progress', 400);
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GatewayError('GOOGLE_PLAY_SERVICES_ERROR', 'Google Play Services not available', 500);
      }
      
      console.error('Google OAuth error:', error);
      throw new GatewayError('GOOGLE_OAUTH_ERROR', 'Google authentication failed', 500);
    }
  }

}

class AppleOAuthProvider implements OAuthProvider {
  name = 'apple';

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    try {
      return appleAuth.isSupported;
    } catch (error) {
      console.warn('Apple Sign-In not available:', error);
      return false;
    }
  }

  async startOAuth(): Promise<string> {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleRequestOperation.LOGIN,
        requestedScopes: [AppleRequestScope.EMAIL, AppleRequestScope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new GatewayError('APPLE_ID_TOKEN_ERROR', 'Apple ID token not received', 400);
      }

      // For Apple, we return the identity token which contains the authorization
      return appleAuthRequestResponse.identityToken;
    } catch (error: any) {
      if (error.code === '1001') {
        throw new GatewayError('OAUTH_CANCELLED', 'Apple sign-in was cancelled', 400);
      }
      
      console.error('Apple OAuth error:', error);
      throw new GatewayError('APPLE_OAUTH_ERROR', 'Apple authentication failed', 500);
    }
  }

}

// Export provider instances
export const googleProvider = new GoogleOAuthProvider();
export const appleProvider = new AppleOAuthProvider();

// Provider registry
export const oauthProviders: Record<string, OAuthProvider> = {
  google: googleProvider,
  apple: appleProvider,
};

// Helper function to get available providers
export async function getAvailableProviders(): Promise<OAuthProvider[]> {
  const providers = Object.values(oauthProviders);
  const availableProviders: OAuthProvider[] = [];
  
  for (const provider of providers) {
    try {
      if (await provider.isAvailable()) {
        availableProviders.push(provider);
      }
    } catch (error) {
      console.warn(`Provider ${provider.name} availability check failed:`, error);
    }
  }
  
  return availableProviders;
}

