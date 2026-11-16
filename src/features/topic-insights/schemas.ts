import { z } from "zod";
import { ProjectId } from "../../mcp/schemas.js";

const MIN_TOPIC_INSIGHT_QUESTIONS = 10;
const MAX_TOPIC_INSIGHT_QUESTIONS = 15;

export const TopicInsightsListRequest = {
  projectId: ProjectId,
};

export const TopicInsightConstraintsRequest = {
  projectId: ProjectId,
};

export const TopicInsightReportRequest = {
  topicId: z.string().trim().min(1).describe("The topic to fetch the report for - use a topicId from list-topic-insights."),
  runId: z.string().trim().min(1).optional().describe("A specific generation run. Omit to use the topic's latest completed run."),
  projectId: ProjectId,
};

export const TopicInsightStatusRequest = {
  runIds: z.array(z.string().trim().min(1)).min(1).max(100)
    .describe("Between 1 and 100 run ids returned by create-topic-insight-report or regenerate-topic-insight-report to check generation status for."),
  projectId: ProjectId,
};

export const CreateTopicInsightRequest = {
  topicName: z.string().trim().min(1).max(100).describe("Name of the topic to analyze."),
  questions: z.array(z.string().trim().min(3).max(500)).min(MIN_TOPIC_INSIGHT_QUESTIONS).max(MAX_TOPIC_INSIGHT_QUESTIONS)
    .refine(questions => new Set(questions).size === questions.length, "Questions must be unique after trimming.")
    .describe(`Between ${MIN_TOPIC_INSIGHT_QUESTIONS} and ${MAX_TOPIC_INSIGHT_QUESTIONS} real questions users might ask AI assistants about this topic.`),
  projectId: ProjectId,
};

export const RegenerateTopicInsightRequest = {
  topicId: z.string().trim().min(1).describe("The existing topic to regenerate - use a topicId from list-topic-insights."),
  topicName: z.string().trim().min(1).max(100).describe("The topic's name."),
  projectId: ProjectId,
};

export const DeleteTopicInsightRequest = {
  topicId: z.string().trim().min(1).describe("The topic to delete - use a topicId from list-topic-insights."),
  projectId: ProjectId,
};
