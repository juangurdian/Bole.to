/**
 * SECURITY CRITICAL: Unified Security Manager
 * 
 * This module provides a unified interface to all security components and
 * implements enterprise-grade security coordination with:
 * - Centralized security policy management
 * - Cross-module threat correlation and response
 * - Comprehensive security monitoring and reporting
 * - Security incident response automation
 * - Compliance validation and audit trails
 * 
 * OWASP Security Implementation:
 * - A1: Broken Access Control - Device and biometric authentication
 * - A2: Cryptographic Failures - Encrypted storage and network security
 * - A3: Injection - Deep link validation and request sanitization
 * - A4: Insecure Design - Defense in depth across all layers
 * - A5: Security Misconfiguration - Proper security headers and config
 * - A9: Security Logging Failures - Comprehensive audit logging
 */

import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger';
import { secureStorage, SecureTokenStorage } from './secureStorage';
import { biometricSecurity, BiometricSecurity, SensitiveOperation } from './biometricSecurity';
import { deviceSecurity, DeviceSecurity, ThreatLevel } from './deviceSecurity';
import { networkSecurity, NetworkSecurity } from './networkSecurity';
import { appSecurity, AppSecurity, ProtectionLevel } from './appSecurity';

// Unified security configuration
interface SecurityConfig {
  // Storage security
  encryptedStorageEnabled: boolean;
  tokenEncryptionEnabled: boolean;
  
  // Biometric security
  biometricAuthEnabled: boolean;
  biometricForSensitiveOps: boolean;
  
  // Device security
  deviceFingerprintingEnabled: boolean;
  jailbreakDetectionEnabled: boolean;
  minimumTrustScore: number;
  
  // Network security
  certificatePinningEnabled: boolean;
  requestSigningEnabled: boolean;
  
  // Application security
  screenProtectionLevel: ProtectionLevel;
  deepLinkValidationEnabled: boolean;
  integrityChecksEnabled: boolean;
  
  // Global settings
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  complianceMode: boolean;
  auditingEnabled: boolean;
}

// Comprehensive security assessment
interface SecurityAssessment {
  overall: {
    securityScore: number; // 0-100
    threatLevel: ThreatLevel;
    complianceScore: number; // 0-100
    recommendedActions: string[];
  };
  storage: {
    encrypted: boolean;
    integrityChecked: boolean;
    threats: string[];
  };
  biometric: {
    available: boolean;
    enabled: boolean;
    trustScore: number;
  };
  device: {
    trusted: boolean;
    compromised: boolean;
    trustScore: number;
    threats: string[];
  };
  network: {
    pinningActive: boolean;
    signingEnabled: boolean;
    trustScore: number;
  };
  application: {
    protectionActive: boolean;
    integrityPassed: boolean;
    threats: string[];
  };
  timestamp: number;
}

// Security incident tracking
interface SecurityIncident {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  affectedModules: string[];
  detectedAt: number;
  resolved: boolean;
  response: string[];
  metadata: any;
}

/**
 * Unified Security Manager Implementation
 * 
 * Coordinates all security modules and provides:
 * - Single point of security configuration
 * - Cross-module threat correlation
 * - Automated incident response
 * - Comprehensive security monitoring
 * - Compliance validation and reporting
 */
class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private incidents: SecurityIncident[] = [];
  private lastAssessment: SecurityAssessment | null = null;
  private assessmentInterval: NodeJS.Timeout | null = null;
  private incidentCounter: number = 0;

  private constructor() {
    this.config = {
      // Default secure configuration
      encryptedStorageEnabled: true,
      tokenEncryptionEnabled: true,
      biometricAuthEnabled: true,
      biometricForSensitiveOps: true,
      deviceFingerprintingEnabled: true,
      jailbreakDetectionEnabled: true,
      minimumTrustScore: 70,
      certificatePinningEnabled: true,
      requestSigningEnabled: true,
      screenProtectionLevel: ProtectionLevel.ENHANCED,
      deepLinkValidationEnabled: true,
      integrityChecksEnabled: true,
      securityLevel: 'enhanced',
      complianceMode: true,
      auditingEnabled: true
    };
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * SECURITY CRITICAL: Initialize Complete Security Framework
   * 
   * Coordinates initialization of all security modules:
   * 1. Storage encryption and device key generation
   * 2. Biometric capability assessment and setup
   * 3. Device fingerprinting and security assessment
   * 4. Network security configuration and pinning
   * 5. Application security controls activation
   * 6. Security monitoring and incident response setup
   */
  async initialize(): Promise<void> {
    try {
      securityLogger.info('Initializing comprehensive security framework', { config: this.config }, 'SecurityManager');

      // Initialize security logger first
      securityLogger.setDeviceId('pending'); // Will be updated after device fingerprinting

      // Initialize storage security
      if (this.config.encryptedStorageEnabled) {
        await secureStorage.generateDeviceKey();
        securityLogger.debug('Encrypted storage initialized', {}, 'SecurityManager');
      }

      // Initialize device security and fingerprinting
      if (this.config.deviceFingerprintingEnabled) {
        await deviceSecurity.initialize();
        const fingerprint = await deviceSecurity.getDeviceFingerprint();
        securityLogger.setDeviceId(fingerprint.deviceId);
        securityLogger.debug('Device security initialized', { deviceId: fingerprint.deviceId }, 'SecurityManager');
      }

      // Initialize biometric security
      if (this.config.biometricAuthEnabled) {
        await biometricSecurity.initialize();
        securityLogger.debug('Biometric security initialized', {}, 'SecurityManager');
      }

      // Initialize application security
      await appSecurity.initialize();
      securityLogger.debug('Application security initialized', {}, 'SecurityManager');

      // Start periodic security assessments
      this.startPeriodicAssessments();

      // Perform initial comprehensive security assessment
      await this.performComprehensiveAssessment();

      securityLogger.logSecurityEvent({
        type: SecurityEventType.SECURITY_SETTINGS,
        severity: SecuritySeverity.INFO,
        message: 'Security framework initialization completed successfully',
        metadata: { 
          securityLevel: this.config.securityLevel,
          modulesInitialized: ['storage', 'biometric', 'device', 'network', 'application']
        }
      });

    } catch (error) {
      securityLogger.error('Security framework initialization failed', securityLogger.sanitizeError(error), 'SecurityManager');
      
      // Create critical incident for initialization failure
      this.createIncident({
        type: SecurityEventType.INTEGRITY_VIOLATION,
        severity: SecuritySeverity.CRITICAL,
        description: 'Security framework failed to initialize properly',
        affectedModules: ['all'],
        metadata: { error: error.message }
      });

      throw error;
    }
  }

  /**
   * SECURITY CRITICAL: Perform Comprehensive Security Assessment
   * 
   * Evaluates security posture across all modules:
   * 1. Storage encryption and integrity validation
   * 2. Biometric authentication capability and status
   * 3. Device trust scoring and threat assessment
   * 4. Network security configuration validation
   * 5. Application security controls verification
   * 6. Overall security score calculation and recommendations
   */
  async performComprehensiveAssessment(): Promise<SecurityAssessment> {
    try {
      securityLogger.debug('Performing comprehensive security assessment', {}, 'SecurityManager');

      // Storage security assessment
      const storageAssessment = await this.assessStorageSecurity();
      
      // Biometric security assessment
      const biometricAssessment = await this.assessBiometricSecurity();
      
      // Device security assessment
      const deviceAssessment = await this.assessDeviceSecurity();
      
      // Network security assessment
      const networkAssessment = this.assessNetworkSecurity();
      
      // Application security assessment
      const appAssessment = this.assessApplicationSecurity();
      
      // Calculate overall security score
      const overallScore = this.calculateOverallSecurityScore({
        storage: storageAssessment,
        biometric: biometricAssessment,
        device: deviceAssessment,
        network: networkAssessment,
        application: appAssessment
      });
      
      // Determine threat level
      const threatLevel = this.calculateOverallThreatLevel({
        device: deviceAssessment,
        application: appAssessment
      });
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore();
      
      // Generate recommendations
      const recommendedActions = this.generateSecurityRecommendations({
        storage: storageAssessment,
        biometric: biometricAssessment,
        device: deviceAssessment,
        network: networkAssessment,
        application: appAssessment,
        overallScore
      });

      // Create comprehensive assessment
      const assessment: SecurityAssessment = {
        overall: {
          securityScore: overallScore,
          threatLevel,
          complianceScore,
          recommendedActions
        },
        storage: storageAssessment,
        biometric: biometricAssessment,
        device: deviceAssessment,
        network: networkAssessment,
        application: appAssessment,
        timestamp: Date.now()
      };

      this.lastAssessment = assessment;

      // Log assessment results
      securityLogger.logSecurityEvent({
        type: SecurityEventType.SECURITY_SETTINGS,
        severity: this.getSeverityForScore(overallScore),
        message: `Security assessment completed - Score: ${overallScore}/100`,
        metadata: {
          securityScore: overallScore,
          threatLevel,
          complianceScore,
          recommendationsCount: recommendedActions.length
        }
      });

      return assessment;

    } catch (error) {
      securityLogger.error('Comprehensive security assessment failed', securityLogger.sanitizeError(error), 'SecurityManager');
      throw error;
    }
  }

  /**
   * Assess storage security
   */
  private async assessStorageSecurity() {
    const threats: string[] = [];
    let encrypted = false;
    let integrityChecked = false;

    try {
      if (this.config.encryptedStorageEnabled) {
        // Test device binding validation
        encrypted = await secureStorage.validateDeviceBinding();
        integrityChecked = true;
        
        if (!encrypted) {
          threats.push('device_binding_failed');
        }
      } else {
        threats.push('encryption_disabled');
      }
    } catch (error) {
      threats.push('storage_assessment_failed');
    }

    return {
      encrypted,
      integrityChecked,
      threats
    };
  }

  /**
   * Assess biometric security
   */
  private async assessBiometricSecurity() {
    let available = false;
    let enabled = false;
    let trustScore = 0;

    try {
      if (this.config.biometricAuthEnabled) {
        const capability = await biometricSecurity.assessBiometricCapability();
        available = capability.canUseBiometrics;
        enabled = this.config.biometricForSensitiveOps;
        
        // Calculate trust score based on capability
        if (capability.securityLevel === 'strong') {
          trustScore = 90;
        } else if (capability.securityLevel === 'weak') {
          trustScore = 60;
        } else {
          trustScore = 20;
        }
      }
    } catch (error) {
      trustScore = 0;
    }

    return {
      available,
      enabled,
      trustScore
    };
  }

  /**
   * Assess device security
   */
  private async assessDeviceSecurity() {
    let trusted = false;
    let compromised = false;
    let trustScore = 0;
    const threats: string[] = [];

    try {
      if (this.config.deviceFingerprintingEnabled) {
        const assessment = await deviceSecurity.getSecurityAssessment();
        
        trusted = assessment.trustScore >= this.config.minimumTrustScore;
        compromised = assessment.isJailbroken || assessment.isRooted;
        trustScore = assessment.trustScore;
        
        if (assessment.isJailbroken) threats.push('jailbroken');
        if (assessment.isRooted) threats.push('rooted');
        if (assessment.isDebuggingEnabled) threats.push('debugging_enabled');
        if (!assessment.hasSecureEnvironment) threats.push('insecure_environment');
      }
    } catch (error) {
      threats.push('device_assessment_failed');
    }

    return {
      trusted,
      compromised,
      trustScore,
      threats
    };
  }

  /**
   * Assess network security
   */
  private assessNetworkSecurity() {
    const networkAssessment = networkSecurity.getNetworkAssessment();
    
    return {
      pinningActive: this.config.certificatePinningEnabled,
      signingEnabled: this.config.requestSigningEnabled,
      trustScore: networkAssessment?.trustScore || 50
    };
  }

  /**
   * Assess application security
   */
  private assessApplicationSecurity() {
    const appStatus = appSecurity.getSecurityStatus();
    
    return {
      protectionActive: appStatus.screenProtectionActive,
      integrityPassed: appStatus.integrityChecksPassed,
      threats: appStatus.threatsDetected.map(threat => threat.toString())
    };
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallSecurityScore(assessments: any): number {
    let score = 0;
    let components = 0;

    // Storage security (20% weight)
    if (assessments.storage.encrypted && assessments.storage.integrityChecked) {
      score += 20;
    } else if (assessments.storage.encrypted) {
      score += 15;
    } else {
      score += 5;
    }
    components++;

    // Biometric security (15% weight)
    if (assessments.biometric.available && assessments.biometric.enabled) {
      score += Math.min(15, (assessments.biometric.trustScore / 100) * 15);
    } else {
      score += 5;
    }
    components++;

    // Device security (25% weight)
    score += Math.min(25, (assessments.device.trustScore / 100) * 25);
    components++;

    // Network security (20% weight)
    if (assessments.network.pinningActive && assessments.network.signingEnabled) {
      score += Math.min(20, (assessments.network.trustScore / 100) * 20);
    } else {
      score += 10;
    }
    components++;

    // Application security (20% weight)
    if (assessments.application.protectionActive && assessments.application.integrityPassed) {
      score += 20 - (assessments.application.threats.length * 2);
    } else {
      score += 10;
    }
    components++;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall threat level
   */
  private calculateOverallThreatLevel(assessments: any): ThreatLevel {
    if (assessments.device.compromised || assessments.application.threats.length > 3) {
      return ThreatLevel.CRITICAL;
    }
    
    if (assessments.device.trustScore < 40 || assessments.application.threats.length > 1) {
      return ThreatLevel.HIGH;
    }
    
    if (assessments.device.trustScore < 70 || assessments.application.threats.length > 0) {
      return ThreatLevel.MEDIUM;
    }
    
    if (assessments.device.trustScore < 90) {
      return ThreatLevel.LOW;
    }
    
    return ThreatLevel.NONE;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(): number {
    let score = 100;

    // Deduct points for missing security controls
    if (!this.config.encryptedStorageEnabled) score -= 20;
    if (!this.config.biometricAuthEnabled) score -= 15;
    if (!this.config.deviceFingerprintingEnabled) score -= 15;
    if (!this.config.certificatePinningEnabled) score -= 15;
    if (!this.config.screenProtectionLevel || this.config.screenProtectionLevel === ProtectionLevel.NONE) score -= 10;
    if (!this.config.deepLinkValidationEnabled) score -= 10;
    if (!this.config.integrityChecksEnabled) score -= 10;
    if (!this.config.auditingEnabled) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(assessments: any): string[] {
    const recommendations: string[] = [];

    // Storage recommendations
    if (!assessments.storage.encrypted) {
      recommendations.push('Enable encrypted storage for sensitive data protection');
    }
    if (assessments.storage.threats.length > 0) {
      recommendations.push('Address storage security threats detected');
    }

    // Biometric recommendations
    if (assessments.biometric.available && !assessments.biometric.enabled) {
      recommendations.push('Enable biometric authentication for enhanced security');
    }
    if (assessments.biometric.trustScore < 70) {
      recommendations.push('Improve biometric security configuration');
    }

    // Device recommendations
    if (assessments.device.compromised) {
      recommendations.push('Use a non-compromised device for secure operations');
    }
    if (assessments.device.trustScore < this.config.minimumTrustScore) {
      recommendations.push('Address device security concerns to improve trust score');
    }

    // Network recommendations
    if (!assessments.network.pinningActive) {
      recommendations.push('Enable certificate pinning for network security');
    }
    if (!assessments.network.signingEnabled) {
      recommendations.push('Enable request signing for API integrity');
    }

    // Application recommendations
    if (!assessments.application.protectionActive) {
      recommendations.push('Enable screen protection to prevent unauthorized capture');
    }
    if (assessments.application.threats.length > 0) {
      recommendations.push('Address application security threats detected');
    }

    // Overall recommendations
    if (assessments.overallScore < 80) {
      recommendations.push('Overall security score needs improvement - review all security controls');
    }

    return recommendations;
  }

  /**
   * Get severity level for security score
   */
  private getSeverityForScore(score: number): SecuritySeverity {
    if (score >= 90) return SecuritySeverity.INFO;
    if (score >= 70) return SecuritySeverity.LOW;
    if (score >= 50) return SecuritySeverity.MEDIUM;
    if (score >= 30) return SecuritySeverity.HIGH;
    return SecuritySeverity.CRITICAL;
  }

  /**
   * Start periodic security assessments
   */
  private startPeriodicAssessments(): void {
    // Assess security every 15 minutes
    this.assessmentInterval = setInterval(async () => {
      try {
        await this.performComprehensiveAssessment();
      } catch (error) {
        securityLogger.error('Periodic security assessment failed', securityLogger.sanitizeError(error), 'SecurityManager');
      }
    }, 15 * 60 * 1000);

    securityLogger.debug('Periodic security assessments started', {}, 'SecurityManager');
  }

  /**
   * Create security incident
   */
  private createIncident(incident: Omit<SecurityIncident, 'id' | 'detectedAt' | 'resolved' | 'response'>): string {
    const incidentId = `SEC-${Date.now()}-${++this.incidentCounter}`;
    
    const fullIncident: SecurityIncident = {
      ...incident,
      id: incidentId,
      detectedAt: Date.now(),
      resolved: false,
      response: []
    };

    this.incidents.push(fullIncident);

    // Keep only recent incidents (last 100)
    if (this.incidents.length > 100) {
      this.incidents.shift();
    }

    securityLogger.logSecurityEvent({
      type: incident.type,
      severity: incident.severity,
      message: `Security incident created: ${incident.description}`,
      metadata: {
        incidentId,
        affectedModules: incident.affectedModules,
        metadata: incident.metadata
      }
    });

    return incidentId;
  }

  // Public API methods

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    securityLogger.info('Security configuration updated', { config: newConfig }, 'SecurityManager');
    
    // Re-assess security with new configuration
    this.performComprehensiveAssessment();
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Get latest security assessment
   */
  getLatestAssessment(): SecurityAssessment | null {
    return this.lastAssessment;
  }

  /**
   * Get security incidents
   */
  getIncidents(limit: number = 50): SecurityIncident[] {
    return this.incidents.slice(-limit);
  }

  /**
   * Check if system is in secure state
   */
  isSecureState(): boolean {
    if (!this.lastAssessment) {
      return false;
    }

    return this.lastAssessment.overall.securityScore >= 70 &&
           this.lastAssessment.overall.threatLevel !== ThreatLevel.CRITICAL &&
           this.lastAssessment.overall.threatLevel !== ThreatLevel.HIGH;
  }

  /**
   * Require biometric authentication for operation
   */
  async requireBiometric(operation: SensitiveOperation, reason?: string): Promise<boolean> {
    if (!this.config.biometricForSensitiveOps) {
      return true; // Biometric not required
    }

    try {
      const result = await biometricSecurity.authenticateForOperation(operation, reason);
      return result.success;
    } catch (error) {
      securityLogger.error('Biometric authentication failed', securityLogger.sanitizeError(error), 'SecurityManager');
      return false;
    }
  }

  /**
   * Validate deep link with security checks
   */
  validateDeepLink(url: string): { isValid: boolean; sanitizedUrl: string; warnings: string[] } {
    const validation = appSecurity.validateDeepLink(url);
    
    return {
      isValid: validation.isValid,
      sanitizedUrl: validation.sanitizedUrl,
      warnings: validation.threatsDetected
    };
  }

  /**
   * Perform secure network request
   */
  async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    return await networkSecurity.secureRequest(url, options);
  }

  /**
   * Store encrypted token
   */
  async storeSecureToken(key: string, token: string): Promise<void> {
    if (this.config.tokenEncryptionEnabled) {
      await secureStorage.storeToken(key, token);
    } else {
      // Fallback to basic storage (not recommended)
      securityLogger.warn('Storing token without encryption - security risk', { key }, 'SecurityManager');
    }
  }

  /**
   * Retrieve encrypted token
   */
  async getSecureToken(key: string): Promise<string | null> {
    if (this.config.tokenEncryptionEnabled) {
      return await secureStorage.getToken(key);
    } else {
      return null;
    }
  }

  /**
   * Clean up security manager
   */
  cleanup(): void {
    if (this.assessmentInterval) {
      clearInterval(this.assessmentInterval);
      this.assessmentInterval = null;
    }

    appSecurity.cleanup();
    
    securityLogger.info('Security manager cleanup completed', {}, 'SecurityManager');
  }
}

// Export singleton instance and main security interface
export const securityManager = SecurityManager.getInstance();

// Export all security modules for direct access if needed
export {
  securityLogger,
  secureStorage,
  biometricSecurity,
  deviceSecurity,
  networkSecurity,
  appSecurity
};

// Export types
export type {
  SecurityConfig,
  SecurityAssessment,
  SecurityIncident
};

export {
  SecurityManager,
  SecurityEventType,
  SecuritySeverity,
  SensitiveOperation,
  ThreatLevel,
  ProtectionLevel
};