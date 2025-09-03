const os = require('os');

/**
 * Check the health of the Hi.Events backend
 */
async function checkBackendHealth(backendUrl, timeout = 5000) {
  try {
    const { default: fetch } = await import('node-fetch');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Bole.to-Gateway/1.0.0',
      },
    });

    clearTimeout(timeoutId);

    const responseTime = response.headers.get('x-response-time') || 'unknown';
    const healthy = response.ok;

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      // Ignore JSON parsing errors for health checks
    }

    return {
      healthy,
      status: response.status,
      responseTime,
      data,
      url: `${backendUrl}/health`,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      code: error.code,
      url: `${backendUrl}/health`,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get basic system information
 */
function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
      free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
      used: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
    },
    cpu: {
      count: os.cpus().length,
      model: os.cpus()[0]?.model || 'unknown',
    },
    uptime: {
      system: Math.floor(os.uptime()),
      process: Math.floor(process.uptime()),
    },
  };
}

module.exports = {
  checkBackendHealth,
  getSystemInfo,
};