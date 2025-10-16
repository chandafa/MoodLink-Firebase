'use server';
/**
 * @fileOverview An AI flow to analyze a user's activity and award badges.
 *
 * - analyzeUserEssence - A function that handles the user analysis process.
 * - AnalyzeUserEssenceInput - The input type for the analyzeUserEssence function.
 * - AnalyzeUserEssenceOutput - The return type for the analyzeUserEssence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUserEssenceInputSchema = z.object({
  userId: z.string().describe('The ID of the user being analyzed.'),
  recentPosts: z.array(z.string()).describe('A list of the user\'s 5 most recent posts.'),
  recentComments: z.array(z.string()).describe('A list of the user\'s 10 most recent comments.'),
  existingBadges: z.array(z.string()).describe('A list of badge IDs the user already possesses.'),
});
export type AnalyzeUserEssenceInput = z.infer<typeof AnalyzeUserEssenceInputSchema>;

const AnalyzeUserEssenceOutputSchema = z.object({
  badgeAwarded: z.boolean().describe('Whether a new badge was awarded based on this analysis.'),
  badgeId: z.string().optional().describe('The machine-readable ID of the awarded badge (e.g., "dream_builder").'),
  badgeName: z.string().optional().describe('The human-readable name of the awarded badge (e.g., "Dream Builder").'),
  reasoning: z.string().describe('A brief explanation of why the badge was or was not awarded.'),
});
export type AnalyzeUserEssenceOutput = z.infer<typeof AnalyzeUserEssenceOutputSchema>;

export async function analyzeUserEssence(input: AnalyzeUserEssenceInput): Promise<AnalyzeUserEssenceOutput> {
  return analyzeUserEssenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserEssencePrompt',
  input: {schema: AnalyzeUserEssenceInputSchema},
  output: {schema: AnalyzeUserEssenceOutputSchema},
  prompt: `You are an AI judge for the MoodLink journaling app. Your task is to analyze a user's recent activity to determine if they qualify for a special "Essence Badge".

Here are the available badges and their criteria:

1.  **Dream Builder (ID: dream_builder)**: Awarded to users who frequently write about positive aspirations, new ideas, creative projects, or hopeful future plans. Their posts are generally optimistic and forward-looking.
2.  **Echo Thinker (ID: echo_thinker)**: Awarded to users who consistently provide thoughtful, insightful, or supportive replies to other users' posts. Their comments add value to the conversation.

User's Profile:
- User ID: {{userId}}
- Existing Badges: {{#if existingBadges}}{{#each existingBadges}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

User's Recent Activity:

Recent Posts:
{{#each recentPosts}}
- "{{this}}"
{{else}}
- No recent posts.
{{/each}}

Recent Comments:
{{#each recentComments}}
- "{{this}}"
{{else}}
- No recent comments.
{{/each}}

Instructions:
1.  Review the user's posts and comments.
2.  Determine if the user strongly fits the criteria for ONE of the badges listed above.
3.  The user can only be awarded ONE badge per analysis. Prioritize the one they fit best.
4.  Do NOT award a badge if the user already has it (check "Existing Badges").
5.  If they meet the criteria for a new badge, set 'badgeAwarded' to true, and fill in 'badgeId' and 'badgeName'.
6.  If they do not meet any criteria, or if their activity is neutral/negative, or if they already have the badge they would qualify for, set 'badgeAwarded' to false.
7.  Provide a brief, encouraging 'reasoning' for your decision in all cases.
`,
});

const analyzeUserEssenceFlow = ai.defineFlow(
  {
    name: 'analyzeUserEssenceFlow',
    inputSchema: AnalyzeUserEssenceInputSchema,
    outputSchema: AnalyzeUserEssenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
