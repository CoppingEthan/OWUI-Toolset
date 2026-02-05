/**
 * ContainerManager - Singleton for Docker container lifecycle management
 *
 * Container Naming: sandbox-{chatUid}
 * Volume Mount: data/{email}/{chatUid}/volume -> /workspace
 *
 * Features:
 * - One container per chat session
 * - 5-minute inactivity timeout (auto-cleanup)
 * - Resource limits: 1GB RAM, 2 CPU, 100 PIDs
 * - Network isolation via sandbox_network
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

class ContainerManager {
  constructor() {
    // Map: chatUid -> { containerId, containerName, email, lastActivity, timeoutId }
    this.containers = new Map();
    this.INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    this.EXEC_TIMEOUT_SECONDS = 300; // 5 minutes per command
  }

  /**
   * Get or create a container for a chat session
   * @param {string} chatUid - Conversation/chat ID
   * @param {string} email - User email (for volume path)
   * @returns {Promise<string>} Container ID
   */
  async getOrCreateContainer(chatUid, email) {
    // Check if we already have this container
    if (this.containers.has(chatUid)) {
      const entry = this.containers.get(chatUid);

      // Verify container is still running
      if (await this.isContainerRunning(entry.containerId)) {
        this.touchContainer(chatUid);
        return entry.containerId;
      }

      // Container died, remove from tracking
      console.log(`🐳 Container ${entry.containerName} died, will recreate`);
      this.containers.delete(chatUid);
    }

    // Create volume directory
    const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const safeConvId = chatUid.replace(/[^a-zA-Z0-9_-]/g, '_');
    const volumePath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume');

    fs.mkdirSync(volumePath, { recursive: true });

    // Check if a container with this name already exists (orphaned from previous run)
    const containerName = `sandbox-${safeConvId}`;
    await this.removeOrphanContainer(containerName);

    // Create new container
    const args = [
      'run', '-d',
      '--name', containerName,
      '--memory', '1g',
      '--memory-swap', '1g',
      '--cpus', '2',
      '--pids-limit', '100',
      '--read-only',
      '--tmpfs', '/tmp:size=256m,mode=1777',
      '--tmpfs', '/var/tmp:size=64m,mode=1777',
      '--network', 'sandbox_network',
      '--cap-drop', 'ALL',
      '--security-opt', 'no-new-privileges:true',
      '-v', `${volumePath}:/workspace`,
      'owui-sandbox-base:latest'
    ];

    try {
      const containerId = execSync(`docker ${args.join(' ')}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      // Track container
      const entry = {
        containerId,
        containerName,
        email,
        chatUid,
        volumePath,
        lastActivity: Date.now(),
        timeoutId: this.scheduleCleanup(chatUid)
      };
      this.containers.set(chatUid, entry);

      console.log(`🐳 Created sandbox container: ${containerName} (${containerId.substring(0, 12)})`);
      return containerId;

    } catch (err) {
      console.error(`Failed to create container: ${err.message}`);
      throw new Error(`Failed to create sandbox container: ${err.message}`);
    }
  }

  /**
   * Remove orphan container if it exists
   * @param {string} containerName - Container name to check
   */
  async removeOrphanContainer(containerName) {
    try {
      // Check if container exists
      execSync(`docker inspect ${containerName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Container exists, remove it
      console.log(`🧹 Removing orphan container: ${containerName}`);
      execSync(`docker rm -f ${containerName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch {
      // Container doesn't exist, that's fine
    }
  }

  /**
   * Check if a container is running
   * @param {string} containerId - Container ID
   * @returns {Promise<boolean>}
   */
  async isContainerRunning(containerId) {
    try {
      const result = execSync(
        `docker inspect -f '{{.State.Running}}' ${containerId}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      return result === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Execute a command in a container (non-streaming)
   * @param {string} chatUid - Chat UID
   * @param {string} command - Command to execute
   * @param {string} workdir - Working directory
   * @returns {Promise<{stdout, stderr, exitCode, oomKilled}>}
   */
  async execCommand(chatUid, command, workdir = '/workspace') {
    const entry = this.containers.get(chatUid);
    if (!entry) {
      throw new Error(`No container for chat ${chatUid}`);
    }

    this.touchContainer(chatUid);

    return new Promise((resolve) => {
      const args = [
        'exec',
        '-w', workdir,
        entry.containerId,
        'timeout', '-s', 'KILL', String(this.EXEC_TIMEOUT_SECONDS),
        'bash', '-c', command
      ];

      const proc = spawn('docker', args);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', async (exitCode) => {
        // Check for OOM kill
        let oomKilled = false;
        try {
          const inspect = execSync(
            `docker inspect -f '{{.State.OOMKilled}}' ${entry.containerId}`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
          ).trim();
          oomKilled = inspect === 'true';
        } catch {
          // Ignore inspection errors
        }

        resolve({
          stdout,
          stderr,
          exitCode: exitCode || 0,
          oomKilled,
          timedOut: exitCode === 137 && !oomKilled
        });
      });

      proc.on('error', (err) => {
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          oomKilled: false,
          timedOut: false
        });
      });
    });
  }

  /**
   * Reset inactivity timer for a container
   * @param {string} chatUid - Chat UID
   */
  touchContainer(chatUid) {
    const entry = this.containers.get(chatUid);
    if (entry) {
      clearTimeout(entry.timeoutId);
      entry.lastActivity = Date.now();
      entry.timeoutId = this.scheduleCleanup(chatUid);
    }
  }

  /**
   * Schedule cleanup after inactivity
   * @param {string} chatUid - Chat UID
   * @returns {NodeJS.Timeout}
   */
  scheduleCleanup(chatUid) {
    return setTimeout(async () => {
      console.log(`⏰ Inactivity timeout for sandbox-${chatUid}`);
      await this.cleanupContainer(chatUid);
    }, this.INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Cleanup a specific container
   * @param {string} chatUid - Chat UID
   */
  async cleanupContainer(chatUid) {
    const entry = this.containers.get(chatUid);
    if (!entry) return;

    clearTimeout(entry.timeoutId);

    try {
      execSync(`docker stop -t 5 ${entry.containerId}`, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch {
      // Container may already be stopped
    }

    try {
      execSync(`docker rm ${entry.containerId}`, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(`🗑️ Cleaned up sandbox: ${entry.containerName}`);
    } catch (err) {
      console.error(`Failed to remove container ${entry.containerName}:`, err.message);
    }

    this.containers.delete(chatUid);
  }

  /**
   * Cleanup all managed containers (for shutdown)
   */
  async cleanupAll() {
    const chatUids = Array.from(this.containers.keys());
    console.log(`🐳 Cleaning up ${chatUids.length} sandbox container(s)...`);

    for (const chatUid of chatUids) {
      await this.cleanupContainer(chatUid);
    }
  }

  /**
   * Get container stats (memory, CPU, PIDs, disk)
   * @param {string} chatUid - Chat UID
   * @returns {Promise<object|null>}
   */
  async getContainerStats(chatUid) {
    const entry = this.containers.get(chatUid);
    if (!entry) return null;

    try {
      // Get Docker stats
      const statsJson = execSync(
        `docker stats --no-stream --format '{"memory":"{{.MemUsage}}","cpu":"{{.CPUPerc}}","pids":"{{.PIDs}}"}' ${entry.containerId}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();

      const stats = JSON.parse(statsJson);

      // Get disk usage of workspace volume
      let diskUsage = 'unknown';
      try {
        const duOutput = execSync(`du -sh "${entry.volumePath}"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        diskUsage = duOutput.split('\t')[0];
      } catch {
        // du might fail on Windows or if path doesn't exist
      }

      return {
        memory: stats.memory,
        cpu: stats.cpu,
        pids: stats.pids,
        disk: diskUsage,
        volumePath: entry.volumePath,
        containerName: entry.containerName,
        containerId: entry.containerId.substring(0, 12)
      };
    } catch (err) {
      console.error(`Failed to get stats for ${chatUid}:`, err.message);
      return null;
    }
  }

  /**
   * Get the volume path for a chat session
   * @param {string} email - User email
   * @param {string} chatUid - Chat UID
   * @returns {string}
   */
  getVolumePath(email, chatUid) {
    const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const safeConvId = chatUid.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume');
  }

  /**
   * Check if sandbox network exists
   * @returns {Promise<boolean>}
   */
  async isNetworkReady() {
    try {
      execSync('docker network inspect sandbox_network', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if sandbox image exists
   * @returns {Promise<boolean>}
   */
  async isImageReady() {
    try {
      execSync('docker image inspect owui-sandbox-base:latest', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const containerManager = new ContainerManager();
