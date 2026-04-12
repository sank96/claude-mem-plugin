'use strict';

module.exports = Object.freeze({
  adapter: 'codex',
  provider: 'codex',
  name: 'codex',
  phases: Object.freeze({
    context: 'context',
    observation: 'observation',
    summarize: 'summarize',
    complete: 'complete',
  }),
  hooks: Object.freeze({
    sessionStart: 'hooks/session-start.js',
    postToolUse: 'hooks/post-tool-use.js',
    stop: 'hooks/stop.js',
    sessionEnd: 'hooks/session-end.js',
  }),
});
