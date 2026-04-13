'use strict';

module.exports = Object.freeze({
  adapter: 'copilot',
  provider: 'copilot',
  name: 'copilot',
  phases: Object.freeze({
    context: 'context',
    observation: 'observation',
    summarize: 'summarize',
    complete: 'complete',
  }),
  hooks: Object.freeze({
    sessionStart: 'hooks/session-start.sh',
    sessionStartWindows: 'hooks/session-start.ps1',
  }),
});
