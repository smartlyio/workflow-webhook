import { createHmac } from 'crypto';
import * as github from '@actions/github';
import axios from 'axios';

export interface WebhookPayload {
  readonly repository: string;
  readonly ref: string;
  readonly commit: string;
  readonly trigger: string;
  readonly workflow: string;
  readonly data: {
    [key: string]: unknown;
  };
}

export async function buildPayload(data: Record<string, unknown>): Promise<WebhookPayload> {
  const { owner, repo } = github.context.repo;
  const payload: WebhookPayload = {
    repository: `${owner}/${repo}`,
    ref: github.context.ref,
    commit: github.context.sha,
    trigger: github.context.eventName,
    workflow: github.context.workflow,
    data: data
  };
  return payload;
}

export function signPayload(serializedPayload: string, webhookSecret: string): string {
  return createHmac('sha1', webhookSecret)
    .update(serializedPayload)
    .digest('hex');
}

export async function postWebhook(
  webhookUrl: string,
  webhookAuth: string,
  serializedPayload: string,
  signature: string
): Promise<void> {
  await axios.post(webhookUrl, {
    headers: {
      'User-Agent': 'smartlyio-workflow-webhook',
      'x-hub-signature': signature,
      'x-gitHub-delivery': `${github.context.runNumber}`,
      'x-github-event': `${github.context.eventName}`,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${webhookAuth}`
    },
    data: serializedPayload
  });
}
