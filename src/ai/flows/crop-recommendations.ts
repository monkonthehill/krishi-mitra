'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing crop, fertilizer, and pesticide recommendations
 * based on the user's location and soil type.
 *
 * @file Crop Recommendations Flow
 * This flow takes location and soil type as input and provides crop, fertilizer, and pesticide recommendations.
 *   - recommendCropsFertilizersAndPesticides - A function that calls the flow.
 *   - CropRecommendationsInput - The input type for the recommendCropsFertilizersAndPesticides function.
 *   - CropRecommendationsOutput - The return type for the recommendCropsFertilizersAndPesticides function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropRecommendationsInputSchema = z.object({
  location: z
    .object({
      latitude: z.number().describe('Latitude of the location.'),
      longitude: z.number().describe('Longitude of the location.'),
    })
    .describe('The location for which recommendations are needed.'),
  soilType: z.string().describe('The type of soil (e.g., Loam, Sandy Loam).'),
});
export type CropRecommendationsInput = z.infer<typeof CropRecommendationsInputSchema>;

const CropRecommendationsOutputSchema = z.object({
  cropRecommendations: z.array(z.string()).describe('Recommended crops for the given location and soil type.'),
  fertilizerRecommendations: z
    .string()
    .describe('Fertilizer recommendations for the recommended crops.'),
  pesticideRecommendations: z
    .string()
    .describe('Pesticide recommendations for the recommended crops.'),
});
export type CropRecommendationsOutput = z.infer<typeof CropRecommendationsOutputSchema>;

export async function recommendCropsFertilizersAndPesticides(
  input: CropRecommendationsInput
): Promise<CropRecommendationsOutput> {
  return recommendCropsFertilizersAndPesticidesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cropRecommendationPrompt',
  input: {schema: CropRecommendationsInputSchema},
  output: {schema: CropRecommendationsOutputSchema},
  prompt: `You are an expert agricultural advisor. Based on the farmer's location and soil type, provide crop, fertilizer, and pesticide recommendations.

Location: Latitude: {{{location.latitude}}}, Longitude: {{{location.longitude}}}
Soil Type: {{{soilType}}}

Consider the location and soil type to recommend the most suitable crops. Also, provide specific fertilizer and pesticide recommendations for those crops.
Format the output as a JSON object with 'cropRecommendations', 'fertilizerRecommendations', and 'pesticideRecommendations' fields.`, 
});

const recommendCropsFertilizersAndPesticidesFlow = ai.defineFlow(
  {
    name: 'recommendCropsFertilizersAndPesticidesFlow',
    inputSchema: CropRecommendationsInputSchema,
    outputSchema: CropRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
