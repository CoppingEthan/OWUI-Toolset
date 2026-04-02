/**
 * LlamaServerManager - Controls llama-server lifecycle for VRAM coordination
 *
 * llama-server runs in an LXC container. This manager stops/starts it via SSH
 * when other GPU workloads (ComfyUI) need exclusive VRAM access on the RTX 3090.
 *
 * The health check doubles as a routing signal: if unhealthy, new LLM
 * requests fall back to Anthropic via the pre-stream fallback in server.js.
 *
 * Config (from process.env, passed via toolConfig):
 *   LLAMA_SERVER_URL  - HTTP URL for health checks (e.g. http://10.0.0.23:8080)
 *   LLAMA_SSH_HOST    - SSH host for the LXC container
 *   LLAMA_SSH_PORT    - SSH port (default 22)
 *   LLAMA_SSH_USER    - SSH user (default root)
 *   LLAMA_SSH_PASSWORD - SSH password
 *   LLAMA_START_CMD   - Full command to start llama-server
 */

import { Client } from 'ssh2';

class LlamaServerManager {
  constructor(config) {
    this.baseUrl = config.LLAMA_SERVER_URL || config.llama_server_url || 'http://localhost:8080';
    this.sshConfig = {
      host: config.LLAMA_SSH_HOST,
      port: parseInt(config.LLAMA_SSH_PORT || '22', 10),
      username: config.LLAMA_SSH_USER || 'root',
      password: config.LLAMA_SSH_PASSWORD,
    };
    this.startCmd = config.LLAMA_START_CMD;
    this.restarting = false;
  }

  /**
   * Whether SSH control is configured
   */
  get hasSshControl() {
    return !!(this.sshConfig.host && this.sshConfig.password);
  }

  /**
   * Check if llama-server is running and responsive
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Execute a command on the LXC via SSH
   * @param {string} command - Shell command to run
   * @param {number} timeoutMs - Timeout in ms
   * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
   */
  _sshExec(command, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const timer = setTimeout(() => {
        conn.end();
        reject(new Error(`SSH command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            conn.end();
            return reject(err);
          }

          let stdout = '';
          let stderr = '';

          stream.on('data', (data) => { stdout += data.toString(); });
          stream.stderr.on('data', (data) => { stderr += data.toString(); });

          stream.on('close', (code) => {
            clearTimeout(timer);
            conn.end();
            resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code || 0 });
          });
        });
      });

      conn.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      conn.connect(this.sshConfig);
    });
  }

  /**
   * Stop llama-server to free VRAM.
   * Sends SIGTERM via SSH to gracefully shut down.
   */
  async stop() {
    if (this.restarting) return;
    this.restarting = true;

    try {
      console.log('🔄 Stopping llama-server to free VRAM for ComfyUI...');

      if (!this.hasSshControl) {
        console.warn('⚠️ SSH not configured — cannot stop llama-server. ComfyUI may fail if VRAM is insufficient.');
        return;
      }

      // Kill llama-server process (SIGTERM for graceful shutdown)
      const result = await this._sshExec('pkill -f llama-server || true');
      console.log(`🔄 pkill sent (exit=${result.code})`);

      // Wait for it to actually die
      await this.waitForShutdown(15000);
      console.log('✅ llama-server stopped, VRAM freed');
    } catch (err) {
      console.error('Failed to stop llama-server:', err.message);
    }
  }

  /**
   * Restart llama-server after VRAM is free.
   * Launches the process in the background via SSH.
   */
  async start() {
    try {
      console.log('🔄 Restarting llama-server...');

      if (!this.hasSshControl) {
        console.warn('⚠️ SSH not configured — cannot restart llama-server. It must be started manually.');
        this.restarting = false;
        return;
      }

      if (!this.startCmd) {
        console.warn('⚠️ LLAMA_START_CMD not configured — cannot restart llama-server.');
        this.restarting = false;
        return;
      }

      // Write a startup script then execute it — avoids shell quoting issues
      // with env vars and complex flags being mangled through SSH + nohup.
      // Split any leading VAR=value assignments into export lines so exec works.
      let exports = '';
      let cmd = this.startCmd;
      const envPattern = /^([A-Z_][A-Z0-9_]*)=(\S+)\s+/;
      let match;
      while ((match = cmd.match(envPattern))) {
        exports += `export ${match[1]}=${match[2]}\\n`;
        cmd = cmd.slice(match[0].length);
      }
      const writeScript = `printf '#!/bin/bash\\n${exports}exec ${cmd.replace(/'/g, "'\\''")}\\n' > /root/start-llama.sh && chmod +x /root/start-llama.sh`;
      await this._sshExec(writeScript, 5000);

      // Launch in background, redirect output to log file
      await this._sshExec('nohup /root/start-llama.sh > /tmp/llama-server.log 2>&1 &', 5000);

      // Wait for it to become healthy (model loading takes 5-10s)
      await this.waitForHealthy(60000);
      this.restarting = false;
      console.log('✅ llama-server is healthy again');
    } catch (err) {
      console.error('Failed to restart llama-server:', err.message);
      this.restarting = false;
    }
  }

  /**
   * Poll until llama-server is no longer responding
   */
  async waitForShutdown(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!(await this.isHealthy())) return;
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('llama-server shutdown timeout');
  }

  /**
   * Poll until llama-server is healthy
   */
  async waitForHealthy(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.isHealthy()) return;
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('llama-server startup timeout');
  }
}

export default LlamaServerManager;
