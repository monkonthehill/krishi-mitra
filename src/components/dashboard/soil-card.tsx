'use client';

import {useState, memo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Loader2, Search} from 'lucide-react';
import {classifySoil} from '@/lib/utils';
import Image from 'next/image';
import {useToast} from '@/hooks/use-toast';
import type {Location, SoilType} from '../dashboard';

type SoilData = {
  properties: {
    clay: {mean: number};
    sand: {mean: number};
    silt: {mean: number};
    phh2o: {mean: number};
    soc: {mean: number};
  };
};

type SoilCardProps = {
    location: Location | null;
    onSoilTypeChange: (soilType: SoilType | null) => void;
}

function SoilCardComponent({ location, onSoilTypeChange }: SoilCardProps) {
  const {toast} = useToast();
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [soilType, setSoilTypeState] = useState<SoilType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSoilAnalysis = async () => {
    if (!location) return;
    setIsLoading(true);
    setSoil(null);
    setSoilTypeState(null);
    onSoilTypeChange(null);
    try {
      const props = ['clay', 'sand', 'silt', 'phh2o', 'soc'];
      const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${location.lat}&lon=${location.lon}&property=${props.join(
        ','
      )}&depth=0-5cm&value=mean`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch from SoilGrids API');
      }
      const soilData = await res.json();
      setSoil(soilData);

      const {clay, sand, silt} = soilData.properties;
      const classifiedSoil = classifySoil(sand['mean'], silt['mean'], clay['mean']);
      setSoilTypeState(classifiedSoil);
      onSoilTypeChange(classifiedSoil);
    } catch (error) {
      console.error(error);
      toast({variant: 'destructive', title: 'Failed to fetch soil data.'});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl"><Search className="text-accent" /> Soil Analysis</CardTitle>
        <CardDescription>Analyze your soil to get crop recommendations.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {!soil ? (
          <div className="flex flex-col items-center justify-center text-center h-full p-8 bg-muted/30 rounded-lg">
              <Image src="https://picsum.photos/seed/102/600/400" alt="Soil in hands" width={200} height={150} className="rounded-lg mb-4 shadow-md" data-ai-hint="soil hands"/>
              <p className="mb-4 text-muted-foreground">Discover the potential of your land.</p>
              <Button onClick={handleSoilAnalysis} disabled={isLoading || !location} size="lg">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze My Soil'}
              </Button>
              {!location && <p className="text-xs text-destructive mt-2">Enable location to analyze soil.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Soil Composition</h4>
            <div className="space-y-2 text-base p-4 rounded-lg bg-muted/30">
              <div className="flex justify-between"><strong>Soil Type:</strong> <span className="font-mono p-1 bg-primary/10 rounded-md text-primary">{soilType || 'N/A'}</span></div>
              <div className="flex justify-between"><strong>Clay:</strong> <span>{soil.properties.clay.mean.toFixed(1)}%</span></div>
              <div className="flex justify-between"><strong>Sand:</strong> <span>{soil.properties.sand.mean.toFixed(1)}%</span></div>
              <div className="flex justify-between"><strong>Silt:</strong> <span>{soil.properties.silt.mean.toFixed(1)}%</span></div>
              <div className="flex justify-between"><strong>pH Level:</strong> <span>{soil.properties.phh2o.mean / 10}</span></div>
              <div className="flex justify-between"><strong>Organic Carbon:</strong> <span>{soil.properties.soc.mean.toFixed(1)} g/kg</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const SoilCard = memo(SoilCardComponent);
