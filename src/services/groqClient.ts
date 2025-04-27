import { Groq } from 'groq-sdk';

const groq = new Groq({
	apiKey: process.env.GROQ_API_KEYS as string
});

export { groq };
