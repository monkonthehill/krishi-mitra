'use client';

import {useState, useEffect, memo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Leaf, Loader2} from 'lucide-react';
import {recommendCropsFertilizersAndPesticides} from '@/ai/flows/crop-recommendations';
import {useToast} from '@/hooks/use-toast';
import {Skeleton} from '../ui/skeleton';
import type {Location, SoilType} from '../dashboard';

type CropRecommendation = {
  cropRecommendations: string[];
  fertilizerRecommendations: string;
  pesticideRecommendations: string;
};

type RecommendationsCardProps = {
  location: Location | null;
  soilType: SoilType | null;
};

function RecommendationsCardComponent({ location, soilType }: RecommendationsCardProps) {
  const {toast} = useToast();
  const [recommendations, setRecommendations] = useState<CropRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location && soilType) {
      handleGetRecommendations(soilType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soilType]); 

  const handleGetRecommendations = async (currentSoilType: string) => {
    if (!location || !currentSoilType) return;
    setIsLoading(true);
    setRecommendations(null);
    try {
      const result = await recommendCropsFertilizersAndPesticides({
        location: {latitude: location.lat, longitude: location.lon},
        soilType: currentSoilType,
      });
      setRecommendations(result);
    } catch (error) {
      toast({variant: 'destructive', title: 'Failed to get recommendations.'});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl"><Leaf className="text-accent" /> AI Recommendations</CardTitle>
        <CardDescription>Personalized advice based on your data.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center">
          {isLoading ? <Skeleton className="h-48 w-full" /> : recommendations ? (
            <div className="space-y-4 text-base p-4 rounded-lg bg-muted/30 h-full">
              <div>
                  <h5 className="font-bold mb-1">Recommended Crops:</h5>
                  <p className="text-muted-foreground">{recommendations.cropRecommendations.join(', ')}</p>
              </div>
                <div>
                  <h5 className="font-bold mb-1">Fertilizer Advice:</h5>
                  <p className="text-muted-foreground">{recommendations.fertilizerRecommendations}</p>
              </div>
                <div>
                  <h5 className="font-bold mb-1">Pesticide Advice:</h5>
                  <p className="text-muted-foreground">{recommendations.pesticideRecommendations}</p>
              </div>
            </div>
          ) : (
          <div className="text-center p-4 text-muted-foreground">
            <p>Analyze your soil to receive AI-powered recommendations for crops, fertilizers, and pesticides.</p>
          </div>
          )}
      </CardContent>
    </Card>
  );
}

export const RecommendationsCard = memo(RecommendationsCardComponent);
