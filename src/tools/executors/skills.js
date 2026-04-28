/**
 * load_skill executor.
 *
 * Returns the on-demand body of a named skill so the model can follow its
 * playbook for the current task. The list of available skills is injected
 * into the system prompt at chat time (see src/skills/loader.js); this tool
 * pulls the body for one skill when the model decides it's needed.
 */

import { formatToolResult, toolError } from '../../utils/tool-result.js';
import { loadSkillBody, hasSkill, listSkills } from '../../skills/loader.js';

export async function executeLoadSkill(params) {
  const name = params?.name;
  if (!name || typeof name !== 'string') {
    return toolError('load_skill', 'No skill name provided');
  }

  if (!hasSkill(name)) {
    const available = listSkills().map(s => s.name).join(', ') || '(none)';
    return toolError(
      'load_skill',
      `No skill named "${name}". Available: ${available}`,
    );
  }

  const body = loadSkillBody(name);
  if (!body) {
    return toolError('load_skill', `Skill "${name}" exists but its body could not be read`);
  }

  console.log(`📖 [LOAD_SKILL] ${name} (${body.length} chars)`);

  return {
    result: formatToolResult(
      'load_skill',
      `Skill "${name}" loaded. Follow the instructions below for this task.\n\n${body}`,
    ),
    sources: [],
    error: null,
  };
}
