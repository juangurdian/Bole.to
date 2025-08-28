/**
 * Health check utilities
 */

const http = require('http');
const https = require('https');

/**
 * Check if Hi.Events backend is healthy
 * @param {string} backendUrl - The backend URL to check
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<Object>} Health check result
 */
async function checkBackendHealth(backendUrl, timeout = 5000) {
  return new Promise((resolve) => {
    const url = new URL(`${backendUrl}/api/public/color-themes`);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Bole.to-Gateway/1.0.0 (Health Check)'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          healthy: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          responseTime: Date.now() - startTime,
          url: url.toString()
        });
      });
    });

    const startTime = Date.now();
    
    req.on('error', (error) => {
      resolve({
        healthy: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        url: url.toString()
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        healthy: false,
        error: 'Request timeout',
        responseTime: timeout,
        url: url.toString()
      });
    });

    req.end();
  });
}

/**
 * Get system information for health checks
 * @returns {Object} System information
 */
function getSystemInfo() {
  const process_info = process;
  return {
    nodeVersion: process_info.version,
    platform: process_info.platform,
    arch: process_info.arch,
    uptime: Math.floor(process_info.uptime()),
    memory: {
      used: Math.round(process_info.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process_info.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process_info.memoryUsage().external / 1024 / 1024),
      rss: Math.round(process_info.memoryUsage().rss / 1024 / 1024)
    },
    pid: process_info.pid,
    ppid: process_info.ppid
  };
}

module.exports = {
  checkBackendHealth,
  getSystemInfo
};