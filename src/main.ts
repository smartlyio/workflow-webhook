import * as core from '@actions/core';
import { buildPayload, signPayload, postWebhook, WebhookPayload } from './webhook';

async function run(): Promise<void> {
  try {
    const webhookUrl: string = core.getInput('webhook_url');
    const webhookSecret: string = core.getInput('webhook_secret');
    const webhookAuth: string = core.getInput('webhook_auth');
    const data: Record<string, unknown> = JSON.parse(core.getInput('data'));

    const payload: WebhookPayload = buildPayload(data);
    const serializedPayload: string = JSON.stringify(payload);
    const signature: string = signPayload(serializedPayload, webhookSecret);

    await postWebhook(webhookUrl, webhookAuth, serializedPayload, signature);
  } catch (error) {
    if (error.response.status == 400) {
      core.setFailed(JSON.stringify(error.response.data));
    } else {
      core.setFailed(error.message);
    }
  }
}

run()
