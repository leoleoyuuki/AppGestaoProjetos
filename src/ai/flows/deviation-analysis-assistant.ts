'use server';
/**
 * @fileOverview A financial assistant that analyzes cost deviations in projects.
 *
 * - analyzeDeviation - A function that handles the deviation analysis process.
 * - AnalyzeDeviationInput - The input type for the analyzeDeviation function.
 * - AnalyzeDeviationOutput - The return type for the analyzeDeviation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDeviationInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  predictedCost: z.number().describe('The predicted total cost for the project.'),
  actualCost: z.number().describe('The actual total cost incurred for the project.'),
  deviationThresholdPercentage: z
    .number()
    .default(10)
    .describe('The percentage threshold above which a deviation is considered significant.'),
  projectDescription: z.string().optional().describe('A brief description of the project.'),
  costCategories: z
    .array(
      z.object({
        category: z.string().describe('The name of the cost category (e.g., Labor, Materials).'),
        predicted: z.number().describe('Predicted cost for this category.'),
        actual: z.number().describe('Actual cost for this category.'),
      })
    )
    .optional()
    .describe('Detailed breakdown of costs by category.'),
});
export type AnalyzeDeviationInput = z.infer<typeof AnalyzeDeviationInputSchema>;

const AiExplanationOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A detailed AI-generated explanation for the cost deviation.'),
});
export type AiExplanationOutput = z.infer<typeof AiExplanationOutputSchema>;

const AnalyzeDeviationOutputSchema = z.object({
  isSignificantDeviation: z
    .boolean()
    .describe('True if the actual cost significantly deviates from the predicted cost.'),
  deviationAmount: z.number().describe('The absolute amount of the cost deviation.'),
  deviationPercentage: z.number().describe('The percentage of the cost deviation.'),
  aiExplanation: z
    .string()
    .optional()
    .describe('An AI-generated explanation for the deviation, if significant.'),
});
export type AnalyzeDeviationOutput = z.infer<typeof AnalyzeDeviationOutputSchema>;

export async function analyzeDeviation(
  input: AnalyzeDeviationInput
): Promise<AnalyzeDeviationOutput> {
  return deviationAnalysisFlow(input);
}

const deviationExplanationPrompt = ai.definePrompt({
  name: 'deviationExplanationPrompt',
  input: {schema: AnalyzeDeviationInputSchema},
  output: {schema: AiExplanationOutputSchema},
  prompt: `You are an expert financial analyst. Analyze the following project cost data.

Project Name: {{{projectName}}}
Project Description: {{{projectDescription}}}
Predicted Total Cost: {{predictedCost}}
Actual Total Cost: {{actualCost}}
Deviation Amount: {{deviationAmount}}
Deviation Percentage: {{deviationPercentage}}%

Cost Categories Breakdown:
{{#if costCategories}}
{{#each costCategories}}
- Category: {{{category}}}, Predicted: {{predicted}}, Actual: {{actual}}
{{/each}}
{{else}}
No detailed cost category breakdown provided.
{{/if}}

Based on the provided information, identify potential reasons for this significant cost deviation. Consider factors such as unexpected expenses, scope changes, inaccurate initial estimates, market fluctuations, or operational inefficiencies. Provide a concise yet comprehensive explanation.
`,
});

const deviationAnalysisFlow = ai.defineFlow(
  {
    name: 'deviationAnalysisFlow',
    inputSchema: AnalyzeDeviationInputSchema,
    outputSchema: AnalyzeDeviationOutputSchema,
  },
  async input => {
    const deviationAmount = input.actualCost - input.predictedCost;
    const deviationPercentage = (deviationAmount / input.predictedCost) * 100;
    const isSignificantDeviation =
      Math.abs(deviationPercentage) >= input.deviationThresholdPercentage;

    let aiExplanation: string | undefined;

    if (isSignificantDeviation) {
      const promptInput = {
        ...input,
        deviationAmount: deviationAmount,
        deviationPercentage: deviationPercentage,
      };
      const {output} = await deviationExplanationPrompt(promptInput);
      aiExplanation = output?.explanation;
    }

    return {
      isSignificantDeviation,
      deviationAmount,
      deviationPercentage,
      aiExplanation,
    };
  }
);
