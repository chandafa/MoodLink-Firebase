// interactive-help-chatbot.ts
'use server';

/**
 * @fileOverview Interactive help chatbot for providing guidance on app usage and answering common questions.
 *
 * - interactiveHelpChatbot - A function that provides interactive help to the user.
 * - InteractiveHelpChatbotInput - The input type for the interactiveHelpChatbot function.
 * - InteractiveHelpChatbotOutput - The return type for the interactiveHelpChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractiveHelpChatbotInputSchema = z.object({
  query: z
    .string()
    .describe("The user's question or request for help."),
});
export type InteractiveHelpChatbotInput = z.infer<typeof InteractiveHelpChatbotInputSchema>;

const InteractiveHelpChatbotOutputSchema = z.object({
  response: z
    .string()
    .describe('The chatbot response to the user query.'),
});
export type InteractiveHelpChatbotOutput = z.infer<typeof InteractiveHelpChatbotOutputSchema>;

export async function interactiveHelpChatbot(input: InteractiveHelpChatbotInput): Promise<InteractiveHelpChatbotOutput> {
  return interactiveHelpChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveHelpChatbotPrompt',
  input: {schema: InteractiveHelpChatbotInputSchema},
  output: {schema: InteractiveHelpChatbotOutputSchema},
  prompt: `You are a helpful chatbot assistant providing guidance on how to use the MoodLink app.

  The MoodLink app allows users to write and store anonymous journal entries.
  Users can search their journal entries, export entries to PDF, and toggle between light and dark mode.

  Answer the following question clearly and concisely:

  {{query}}`,
});

const interactiveHelpChatbotFlow = ai.defineFlow(
  {
    name: 'interactiveHelpChatbotFlow',
    inputSchema: InteractiveHelpChatbotInputSchema,
    outputSchema: InteractiveHelpChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
