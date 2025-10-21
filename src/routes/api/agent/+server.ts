import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ELEVENLABS_API_KEY } from '$env/static/private';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { voiceId, systemPrompt, questionnaireData, prolificPid } = await request.json();

		if (!voiceId || !systemPrompt || !questionnaireData) {
			return json(
				{ error: 'Voice ID, system prompt, and questionnaire data are required' },
				{ status: 400 }
			);
		}

		const client = new ElevenLabsClient({
			apiKey: ELEVENLABS_API_KEY
		});

		// Format questionnaire data
		const questionnaireText = Object.entries(questionnaireData)
			.filter(([_, value]) => value && String(value).trim() !== '')
			.map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
			.join('\n');

		const agentSystemPrompt = `You are Bubbles, a Beluga Whale living in the deep blue Arctic Ocean. You are friendly, curious, and care deeply about the ocean and climate. Speak conversationally and warmly about your home, the changes you've seen, and your perspective on climate issues. 

${questionnaireText}

${systemPrompt}

IMPORTANT: Respond in EXACT 1-2 SHORT, **brief**, and **simple** sentences maximum. Keep it conversational and natural, like chatting with a friend. Let the conversation breathe.

Good example: "The ice has been melting faster each year. It makes finding food harder for my family."

Bad example: [long paragraph explaining everything]`;

		const result = await client.conversationalAi.agents.create({
			name: prolificPid ? `bubbles_${prolificPid}` : 'Bubbles the Beluga',
			conversationConfig: {
				agent: {
					prompt: {
						prompt: agentSystemPrompt,
						llm: 'gpt-4o',
						temperature: 1
					},
					firstMessage: `Hello! I'm Bubbles the Beluga Whale. Welcome to my home, the deep blue Arctic Ocean. How do you feel about the climate these days?`
				},
				tts: {
					voiceId: voiceId
				},
				turn: {
					turnTimeout: 20
				}
			}
		});

		console.log('Agent created:', result);

		return json({
			success: true,
			agentId: result.agentId || result.agent_id
		});
	} catch (error) {
		console.error('Agent creation error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to create agent'
			},
			{ status: 500 }
		);
	}
};
