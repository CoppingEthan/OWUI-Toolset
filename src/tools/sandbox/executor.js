/**
 * Sandbox Command Executor with Streaming Output
 *
 * Features:
 * - Real-time stdout/stderr streaming
 * - OOM detection via container inspection
 * - Timeout handling (exit code 137)
 * - Exit code capture
 */

import { containerManager } from './manager.js';
import { spawn, execSync } from 'child_process';

const EXEC_TIMEOUT_SECONDS = 300; // 5 minutes

/**
 * Execute command in sandbox with streaming output
 * @param {string} chatUid - Chat session ID
 * @param {string} email - User email
 * @param {string} command - Shell command to execute
 * @param {Object} options - Execution options
 * @param {string} options.workdir - Working directory (default: /workspace)
 * @param {function} options.onStdout - Callback for stdout chunks
 * @param {function} options.onStderr - Callback for stderr chunks
 * @returns {Promise<{stdout, stderr, exitCode, oomKilled, timedOut}>}
 */
export async function executeWithStreaming(chatUid, email, command, options = {}) {
  const workdir = options.workdir || '/workspace';
  const onStdout = options.onStdout || (() => {});
  const onStderr = options.onStderr || (() => {});

  // Ensure container exists
  const containerId = await containerManager.getOrCreateContainer(chatUid, email);

  return new Promise((resolve) => {
    const args = [
      'exec',
      '-w', workdir,
      containerId,
      'timeout', '-s', 'KILL', String(EXEC_TIMEOUT_SECONDS),
      'bash', '-c', command
    ];

    const proc = spawn('docker', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      try {
        onStdout(text);
      } catch (err) {
        console.error('Error in onStdout callback:', err.message);
      }
    });
    proc.stdout.on('error', () => {});

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      try {
        onStderr(text);
      } catch (err) {
        console.error('Error in onStderr callback:', err.message);
      }
    });
    proc.stderr.on('error', () => {});

    proc.on('close', async (exitCode) => {
      // Check for OOM kill
      let oomKilled = false;
      try {
        const inspect = execSync(
          `docker inspect -f '{{.State.OOMKilled}}' ${containerId}`,
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        oomKilled = inspect === 'true';
      } catch {
        // Ignore inspection errors
      }

      // Reset OOM flag on container if it was OOM killed
      // (Docker doesn't auto-reset this, but container restart would)

      resolve({
        stdout,
        stderr,
        exitCode: exitCode || 0,
        oomKilled,
        timedOut: exitCode === 137 && !oomKilled
      });
    });

    proc.on('error', (err) => {
      console.error('Process spawn error:', err.message);
      resolve({
        stdout: '',
        stderr: `Failed to execute command: ${err.message}`,
        exitCode: 1,
        oomKilled: false,
        timedOut: false
      });
    });
  });
}

/**
 * Execute command without streaming (simpler interface)
 * @param {string} chatUid - Chat session ID
 * @param {string} email - User email
 * @param {string} command - Shell command to execute
 * @param {string} workdir - Working directory (default: /workspace)
 * @returns {Promise<{stdout, stderr, exitCode, oomKilled, timedOut}>}
 */
export async function execute(chatUid, email, command, workdir = '/workspace') {
  return executeWithStreaming(chatUid, email, command, { workdir });
}
