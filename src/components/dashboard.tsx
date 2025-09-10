'use client';

import {useEffect, useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import {WeatherCard} from '@/components/dashboard/weather-card';
import {SoilCard} from '@/components/dashboard/soil-card';
import {RecommendationsCard} from '@/components/dashboard/recommendations-card';
import {PestDetectionCard} from '@/components/dashboard/pest-detection-card';

export type Location = {lat: number; lon: number};
export type SoilType = string;

export function Dashboard() {
  const {toast} = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [soilType, setSoilType] = useState<SoilType | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setIsLocationLoading(false);
        },
        error => {
          console.error(error);
          setLocationError('Permission denied. Please allow location access.');
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not access your location. Please enable location services.',
          });
          setIsLocationLoading(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocationLoading(false);
    }
  }, [toast]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome, Farmer!
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered dashboard for intelligent agriculture. Get instant insights on weather, soil, pests, and crops.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <WeatherCard location={location} isLoading={isLocationLoading} error={locationError}/>
          <div className="grid md:grid-cols-2 gap-8">
            <SoilCard location={location} onSoilTypeChange={setSoilType} />
            <RecommendationsCard location={location} soilType={soilType} />
          </div>
        </div>
      </div>
      <PestDetectionCard />
    </div>
  );
}
