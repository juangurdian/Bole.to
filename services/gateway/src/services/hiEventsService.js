const axios = require('axios');
const { GatewayError } = require('../middleware/errorHandler');

class HiEventsService {
  constructor() {
    this.baseURL = process.env.HIEVENTS_API_URL || 'http://localhost:8000/api';
    this.apiKey = process.env.HIEVENTS_API_KEY;
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Bole.to-Gateway/1.0.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });

    this.setupInterceptors();
    this.validateConfiguration();
  }

  /**
   * Validate Hi.Events service configuration
   */
  validateConfiguration() {
    if (!this.baseURL) {
      console.warn('⚠️  HIEVENTS_API_URL not configured, Hi.Events integration disabled');
      return;
    }

    if (!this.apiKey) {
      console.warn('⚠️  HIEVENTS_API_KEY not configured, using anonymous access');
    }

    console.log('✅ Hi.Events service configured:', this.baseURL);
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[HiEvents] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('[HiEvents] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('[HiEvents] Response error:', error.response?.data || error.message);
        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  /**
   * Handle axios errors and convert to GatewayError
   */
  handleAxiosError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return new GatewayError(
        data?.error?.code || `HTTP_${status}`,
        data?.error?.message || data?.message || 'Hi.Events API error',
        status,
        data?.error?.details || data
      );
    } else if (error.request) {
      // Network error
      return new GatewayError(
        'HIEVENTS_UNREACHABLE',
        'Hi.Events service is unreachable',
        502
      );
    } else {
      // Request setup error
      return new GatewayError(
        'HIEVENTS_REQUEST_ERROR',
        'Failed to setup Hi.Events request',
        500
      );
    }
  }

  /**
   * Find user by email in Hi.Events
   */
  async findUserByEmail(email) {
    try {
      const response = await this.client.get('/users', {
        params: {
          'filter[email]': email,
          per_page: 1
        }
      });

      const users = response.data?.data || [];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      if (error.status === 404) {
        return null; // User not found
      }
      console.error('Failed to find user by email:', error);
      throw error;
    }
  }

  /**
   * Create new user in Hi.Events
   */
  async createUser(userData) {
    try {
      const response = await this.client.post('/users', {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        email_verified_at: userData.emailVerified ? new Date().toISOString() : null,
        status: 'ACTIVE',
        role: 'ATTENDEE'
      });

      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to create user in Hi.Events:', error);
      throw error;
    }
  }

  /**
   * Update user in Hi.Events
   */
  async updateUser(userId, userData) {
    try {
      const response = await this.client.put(`/users/${userId}`, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        email_verified_at: userData.emailVerified ? new Date().toISOString() : null,
        ...(userData.profile?.bio && { bio: userData.profile.bio }),
        ...(userData.profile?.avatar && { avatar: userData.profile.avatar })
      });

      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to update user in Hi.Events:', error);
      throw error;
    }
  }

  /**
   * Get user accounts from Hi.Events
   */
  async getUserAccounts(userId) {
    try {
      const response = await this.client.get(`/users/${userId}/accounts`);
      return response.data?.data || [];
    } catch (error) {
      if (error.status === 404) {
        return []; // No accounts found
      }
      console.error('Failed to get user accounts:', error);
      throw error;
    }
  }

  /**
   * Link OAuth provider to Hi.Events user
   */
  async linkOAuthProvider(userId, provider, providerUserId, providerData) {
    try {
      // Store OAuth provider link in user metadata or separate table
      // This might require extending Hi.Events API or using metadata fields
      
      const response = await this.client.put(`/users/${userId}`, {
        // Store OAuth provider info in metadata field if available
        oauth_providers: {
          [provider]: {
            id: providerUserId,
            linked_at: new Date().toISOString(),
            email: providerData.email,
            verified: providerData.emailVerified
          }
        }
      });

      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to link OAuth provider:', error);
      throw error;
    }
  }

  /**
   * Handle identity linking logic
   */
  async handleIdentityLinking(oauthProfile) {
    try {
      let hiEventsUser = null;
      let isNewUser = false;
      let accounts = [];

      // First, try to find existing user by email
      if (oauthProfile.email && !oauthProfile.isPrivateRelay) {
        hiEventsUser = await this.findUserByEmail(oauthProfile.email);
      }

      if (hiEventsUser) {
        // Link OAuth provider to existing user
        await this.linkOAuthProvider(
          hiEventsUser.id,
          oauthProfile.provider,
          oauthProfile.id,
          oauthProfile
        );

        // Get user accounts
        accounts = await this.getUserAccounts(hiEventsUser.id);
      } else {
        // Create new user
        isNewUser = true;
        
        // Use OAuth profile data to create user
        const newUserData = {
          firstName: oauthProfile.firstName || 'Unknown',
          lastName: oauthProfile.lastName || 'User',
          email: oauthProfile.email || `${oauthProfile.provider}.${oauthProfile.id}@bole.to`,
          emailVerified: oauthProfile.emailVerified || false
        };

        hiEventsUser = await this.createUser(newUserData);

        // Link OAuth provider to new user
        await this.linkOAuthProvider(
          hiEventsUser.id,
          oauthProfile.provider,
          oauthProfile.id,
          oauthProfile
        );
      }

      // Transform Hi.Events user to our user format
      const user = this.transformHiEventsUser(hiEventsUser, oauthProfile);

      return {
        user,
        accounts,
        isNewUser
      };
    } catch (error) {
      console.error('Identity linking failed:', error);
      throw error;
    }
  }

  /**
   * Transform Hi.Events user format to our user format
   */
  transformHiEventsUser(hiEventsUser, oauthProfile = null) {
    return {
      id: hiEventsUser.id.toString(),
      firstName: hiEventsUser.first_name || '',
      lastName: hiEventsUser.last_name || '',
      email: hiEventsUser.email || '',
      role: hiEventsUser.role || 'attendee',
      emailVerified: !!hiEventsUser.email_verified_at,
      phoneVerified: false, // Hi.Events doesn't track phone verification
      profile: {
        avatar: hiEventsUser.avatar || oauthProfile?.picture || null,
        bio: hiEventsUser.bio || '',
        location: hiEventsUser.location || null,
        preferences: {
          notifications: true,
          marketing: false,
          language: 'en',
          timezone: 'UTC'
        }
      },
      socialAccounts: oauthProfile ? [{
        provider: oauthProfile.provider,
        linkedAt: new Date().toISOString()
      }] : [],
      createdAt: hiEventsUser.created_at || new Date().toISOString(),
      updatedAt: hiEventsUser.updated_at || new Date().toISOString()
    };
  }

  /**
   * Get user profile from Hi.Events
   */
  async getUserProfile(userId) {
    try {
      const response = await this.client.get(`/users/${userId}`);
      const hiEventsUser = response.data?.data || response.data;
      
      return this.transformHiEventsUser(hiEventsUser);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Get event details by ID
   */
  async getEvent(eventId) {
    try {
      const response = await this.client.get(`/events/${eventId}`);
      return response.data?.data || response.data;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      console.error('Failed to get event:', error);
      throw error;
    }
  }

  /**
   * Get event attendees with pagination
   */
  async getEventAttendees(eventId, options = {}) {
    try {
      const {
        page = 1,
        perPage = 50,
        checkInListId = null,
        status = null,
        includeTickets = true
      } = options;

      let endpoint = `/events/${eventId}/attendees?page=${page}&per_page=${perPage}`;
      
      if (checkInListId) {
        endpoint += `&filter[check_in_list]=${checkInListId}`;
      }
      
      if (status) {
        endpoint += `&filter[status]=${status}`;
      }

      if (includeTickets) {
        endpoint += `&include=tickets,ticket_type`;
      }

      const response = await this.client.get(endpoint);
      return {
        data: response.data?.data || [],
        meta: response.data?.meta || {},
        links: response.data?.links || {}
      };
    } catch (error) {
      console.error('Failed to get event attendees:', error);
      throw error;
    }
  }

  /**
   * Get event check-in lists
   */
  async getEventCheckInLists(eventId) {
    try {
      const response = await this.client.get(`/events/${eventId}/check-in-lists`);
      return response.data?.data || [];
    } catch (error) {
      if (error.status === 404) {
        // Return default check-in list if endpoint doesn't exist
        return [];
      }
      console.error('Failed to get check-in lists:', error);
      throw error;
    }
  }

  /**
   * Check user permissions for an event
   */
  async getUserEventPermissions(eventId, userId, accountId) {
    try {
      // This would typically check against event staff assignments
      // For now, simplified to account ownership
      const event = await this.getEvent(eventId);
      if (!event) {
        return { canView: false, canManage: false, canScan: false };
      }

      const isOwner = accountId && event.account_id && 
        event.account_id.toString() === accountId.toString();

      return {
        canView: isOwner,
        canManage: isOwner,
        canScan: isOwner, // In reality, this would check staff permissions
        event
      };
    } catch (error) {
      console.error('Failed to get user event permissions:', error);
      throw error;
    }
  }

  /**
   * Test Hi.Events connection
   */
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: response.status === 200,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: error.status || 500
      };
    }
  }
}

// Export singleton instance
module.exports = new HiEventsService();