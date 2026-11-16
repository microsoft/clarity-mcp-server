import {
  TOPIC_INSIGHTS_CONSTRAINTS_TOOL,
  TOPIC_INSIGHTS_CREATE_TOOL,
  TOPIC_INSIGHTS_DELETE_TOOL,
  TOPIC_INSIGHTS_LIST_TOOL,
  TOPIC_INSIGHTS_REGENERATE_TOOL,
  TOPIC_INSIGHTS_REPORT_TOOL,
  TOPIC_INSIGHTS_STATUS_TOOL,
} from "./tools.js";

export const TOPIC_INSIGHT_INSTRUCTIONS = `
#### Topic Insights

Topic Insights (also called AI Economy simulations in the dashboard) simulate how AI assistants answer questions about a topic, then measure how often the project's domain is cited and how it ranks against competitors. Topic Insights require a verified AI Visibility domain, like citations. Use these tools for anything about topic simulations, citation rate or competitive share for a topic, content strengths/opportunities, or generating a topic report.

- \`${TOPIC_INSIGHTS_CONSTRAINTS_TOOL}\`: Get the current validation rules - topic name length, allowed question count and length, weekly report limit, and regeneration cooldown. Call this and state the rules to the user before collecting a topic to create or update.
- \`${TOPIC_INSIGHTS_LIST_TOOL}\`: List the project's topics with their questions and generated reports, plus reportsMetadata. Returns two groups, exactly as the dashboard shows: \`topics\` are the user's own topics (approved or already generated) and \`suggestedTopics\` are auto-generated suggestions the user has not adopted. When the user asks about "my topics," report only \`topics\`; mention \`suggestedTopics\` only as suggestions or when explicitly asked.
- \`${TOPIC_INSIGHTS_REPORT_TOOL}\`: Get one topic's report - simulation metrics, per-domain ranking vs competitors, content strengths, content opportunities, and simulated questions. Use a topicId from \`${TOPIC_INSIGHTS_LIST_TOOL}\`.
- \`${TOPIC_INSIGHTS_STATUS_TOOL}\`: Check generation progress for run ids returned by create/regenerate.
- \`${TOPIC_INSIGHTS_CREATE_TOOL}\`: Create a new topic (name + questions) and start generating its report. To refresh an existing topic, use \`${TOPIC_INSIGHTS_REGENERATE_TOOL}\` instead.
- \`${TOPIC_INSIGHTS_REGENERATE_TOOL}\`: Regenerate the report for an existing topic.
- \`${TOPIC_INSIGHTS_DELETE_TOOL}\`: Delete a topic and its reports. Destructive - confirm with the user first.

Before collecting a topic to create or update, call \`${TOPIC_INSIGHTS_CONSTRAINTS_TOOL}\` and state its rules to the user so they get their input right the first time. Do not call \`${TOPIC_INSIGHTS_CREATE_TOOL}\` until the user's input satisfies those rules, and do not assume or hardcode the numbers - they come from that tool, not from memory.

Generation is asynchronous. After \`${TOPIC_INSIGHTS_CREATE_TOOL}\` or \`${TOPIC_INSIGHTS_REGENERATE_TOOL}\` returns a runId, poll \`${TOPIC_INSIGHTS_STATUS_TOOL}\` until the status is Completed, then read the numbers with \`${TOPIC_INSIGHTS_REPORT_TOOL}\`. Never fabricate topic metrics before a run completes.
Status calls accept at most 100 run ids and return unknown ids in \`notFoundRunIds\`. A completed report returns its resolved \`runId\`, \`status\`, and \`dataReady\`; if \`dataReady\` is false, wait for ingestion instead of interpreting missing metrics as zero. \`answerCount\` counts answers citing your domain; \`totalAnswerCount\` is the total used in the citation metrics, not the submitted question count.

Generation is limited exactly as in the dashboard. When a create/regenerate response has \`generated: false\`, relay its \`reason\` to the user (limit reached or cooldown) instead of retrying. \`${TOPIC_INSIGHTS_CREATE_TOOL}\` always creates a new topic; to refresh an existing one use \`${TOPIC_INSIGHTS_REGENERATE_TOOL}\`.

If a topic change reports that Microsoft Clarity does not support it through MCP yet, tell the user they can make it in the Clarity dashboard; do not retry.
`;
