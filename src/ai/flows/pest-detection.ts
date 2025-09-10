'use server';

/**
 * @fileOverview Pest detection AI agent.
 *
 * - detectPest - A function that handles the pest detection process.
 * - DetectPestInput - The input type for the detectPest function.
 * - DetectPestOutput - The return type for the detectPest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPestInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a pest, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
});
export type DetectPestInput = z.infer<typeof DetectPestInputSchema>;

const DetectPestOutputSchema = z.object({
  detected: z.string().describe('The name of the detected pest.'),
  confidence: z.number().describe('The confidence score of the detection (0-1).'),
  advice: z.string().describe('Recommended treatment for the pest.'),
});
export type DetectPestOutput = z.infer<typeof DetectPestOutputSchema>;

export async function detectPest(input: DetectPestInput): Promise<DetectPestOutput> {
  return detectPestFlow(input);
}

const pestDetectionPrompt = ai.definePrompt({
  name: 'pestDetectionPrompt',
  input: {schema: DetectPestInputSchema},
  output: {schema: DetectPestOutputSchema},
  prompt: `You are an expert in pest identification and treatment for crops.

  Analyze the image of the pest and provide the following information:

  - detected: The name of the detected pest.
  - confidence: A confidence score (0-1) indicating the certainty of the identification.
  - advice: Recommended treatment for the pest.

  Use the following image to identify the pest and provide treatment advice:

  Image: {{media url=photoDataUri}}
  `,
});

const detectPestFlow = ai.defineFlow(
  {
    name: 'detectPestFlow',
    inputSchema: DetectPestInputSchema,
    outputSchema: DetectPestOutputSchema,
  },
  async input => {
    const {output} = await pestDetectionPrompt(input);
    return output!;
  }
);
