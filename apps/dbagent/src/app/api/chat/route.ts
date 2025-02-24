import { streamText } from 'ai';
import { chatSystemPrompt, getModelInstance, getTools } from '~/lib/ai/aidba';
import { getConnection } from '~/lib/db/connections';
import { getTargetDbConnection } from '~/lib/targetdb/db';

export const runtime = 'nodejs';
export const maxDuration = 30;

export function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  console.log(JSON.stringify(error));

  return JSON.stringify(error);
}

export async function POST(req: Request) {
  const { messages, connectionId, model } = await req.json();

  const connection = await getConnection(connectionId);
  if (!connection) {
    return new Response('Connection not found', { status: 404 });
  }
  const targetClient = await getTargetDbConnection(connection.connstring);

  const context = chatSystemPrompt;

  console.log(context);

  const modelInstance = getModelInstance(model);

  const result = streamText({
    model: modelInstance,
    messages,
    system: context,
    tools: await getTools(connection, targetClient),
    maxSteps: 20,
    toolCallStreaming: true
  });

  return result.toDataStreamResponse({
    getErrorMessage: errorHandler
  });
}
