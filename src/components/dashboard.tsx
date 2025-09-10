'use client';

import {useEffect, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {
  Cloud,
  Droplets,
  Leaf,
  Loader2,
  MapPin,
  Search,
  Thermometer,
  UploadCloud,
  Wind,
} from 'lucide-react';
import {useAuth} from './auth-provider';
import {getWeather} from '@/lib/actions';
import {classifySoil} from '@/lib/utils';
import {detectPest} from '@/ai/flows/pest-detection';
import {recommendCropsFertilizersAndPesticides} from '@/ai/flows/crop-recommendations';
import Image from 'next/image';
import {useToast} from '@/hooks/use-toast';
import {Skeleton} from './ui/skeleton';

type WeatherData = {
  main: {temp: number};
  weather: {description: string; icon: string}[];
  wind: {speed: number};
  main_humidity: number;
};
type SoilData = {
  properties: {
    clay: {mean: number};
    sand: {mean: number};
    silt: {mean: number};
    phh2o: {mean: number};
    soc: {mean: number};
  };
};

type CropRecommendation = {
  cropRecommendations: string[];
  fertilizerRecommendations: string;
  pesticideRecommendations: string;
};

type PestDetectionResult = {
  detected: string;
  confidence: number;
  advice: string;
};

export function Dashboard() {
  const {user} = useAuth();
  const {toast} = useToast();
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any | null>(null);
  const [soil, setSoil] = useState<any | null>(null);
  const [soilType, setSoilType] = useState<string | null>(null);
  const [pestImage, setPestImage] = useState<File | null>(null);
  const [pestImagePreview, setPestImagePreview] = useState<string | null>(null);
  const [pestResult, setPestResult] = useState<PestDetectionResult | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation | null>(null);

  const [isLoading, setIsLoading] = useState({
    location: true,
    weather: false,
    soil: false,
    recommendations: false,
    pest: false,
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setIsLoading(prev => ({...prev, location: false}));
        },
        error => {
          setLocationError('Permission denied. Please allow location access.');
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not access your location. Please enable location services in your browser.',
          });
          setIsLoading(prev => ({...prev, location: false}));
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLoading(prev => ({...prev, location: false}));
    }
  }, [toast]);

  useEffect(() => {
    if (location) {
      handleWeatherFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleWeatherFetch = async () => {
    if (!location) return;
    setIsLoading(prev => ({...prev, weather: true}));
    try {
      const weatherData = await getWeather(location.lat, location.lon);
      setWeather(weatherData);
    } catch (error) {
      toast({variant: 'destructive', title: 'Failed to fetch weather data.'});
    } finally {
      setIsLoading(prev => ({...prev, weather: false}));
    }
  };

  const handleSoilAnalysis = async () => {
    if (!location) return;
    setIsLoading(prev => ({...prev, soil: true}));
    try {
      const props = ['clay', 'sand', 'silt', 'phh2o', 'soc'];
      const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${location.lat}&lon=${location.lon}&property=${props.join(',')}&depth=0-5cm&value=mean`;
      const res = await fetch(url);
      const soilData = await res.json();
      setSoil(soilData);

      const {clay, sand, silt} = soilData.properties;
      const classifiedSoil = classifySoil(
        sand['mean'],
        silt['mean'],
        clay['mean']
      );
      setSoilType(classifiedSoil);
      handleGetRecommendations(classifiedSoil);
    } catch (error) {
      toast({variant: 'destructive', title: 'Failed to fetch soil data.'});
    } finally {
      setIsLoading(prev => ({...prev, soil: false}));
    }
  };
  
  const handleGetRecommendations = async (currentSoilType: string) => {
    if (!location || !currentSoilType) return;
    setIsLoading(prev => ({...prev, recommendations: true}));
    try {
      const result = await recommendCropsFertilizersAndPesticides({
        location: {latitude: location.lat, longitude: location.lon},
        soilType: currentSoilType
      });
      setRecommendations(result);
    } catch (error) {
      toast({variant: 'destructive', title: 'Failed to get recommendations.'});
    } finally {
      setIsLoading(prev => ({...prev, recommendations: false}));
    }
  };

  const handlePestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPestImage(file);
      setPestImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePestDetection = async () => {
    if (!pestImage) return;
    setIsLoading(prev => ({...prev, pest: true}));
    setPestResult(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(pestImage);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const result = await detectPest({photoDataUri: base64Image});
        setPestResult(result);
      };
    } catch (error) {
       toast({variant: 'destructive', title: 'Pest detection failed.'});
    } finally {
      setIsLoading(prev => ({...prev, pest: false}));
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline">Welcome, Farmer!</h2>
        <p className="text-muted-foreground">Your AI-powered agricultural assistant.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin/> Location & Weather</CardTitle>
            <CardDescription>Current conditions in your area.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading.location ? <Skeleton className="h-24 w-full" /> : (
              location ? (
                isLoading.weather ? <Skeleton className="h-24 w-full" /> : (
                  weather ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{weather.name}</span>
                        <span className="text-sm text-muted-foreground">{location.lat.toFixed(2)}, {location.lon.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <Image src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt={weather.weather[0].description} width={80} height={80}/>
                        <div className="text-5xl font-bold">{Math.round(weather.main.temp)}°C</div>
                      </div>
                      <div className="text-center capitalize">{weather.weather[0].description}</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50"><Wind size={20}/><span className="font-semibold">{weather.wind.speed} m/s</span><span className="text-xs text-muted-foreground">Wind</span></div>
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50"><Droplets size={20}/><span className="font-semibold">{weather.main.humidity}%</span><span className="text-xs text-muted-foreground">Humidity</span></div>
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50"><Thermometer size={20}/><span className="font-semibold">{Math.round(weather.main.feels_like)}°C</span><span className="text-xs text-muted-foreground">Feels Like</span></div>
                      </div>
                    </div>
                  ) : <Button onClick={handleWeatherFetch} disabled={isLoading.weather}> {isLoading.weather ? <Loader2 className="animate-spin" /> : 'Fetch Weather'} </Button>
                )
              ) : <p className="text-destructive">{locationError}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search/> Soil Analysis & Recommendations</CardTitle>
            <CardDescription>Analyze your soil to get crop recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!soil && (
              <div className="flex flex-col items-center justify-center text-center h-full p-8">
                  <Image src="https://picsum.photos/seed/102/600/400" alt="Soil in hands" width={200} height={150} className="rounded-lg mb-4" data-ai-hint="soil hands"/>
                  <p className="mb-4 text-muted-foreground">Discover the potential of your land.</p>
                  <Button onClick={handleSoilAnalysis} disabled={isLoading.soil || !location}>
                      {isLoading.soil ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze My Soil'}
                  </Button>
                  {!location && <p className="text-xs text-destructive mt-2">Location not available.</p>}
              </div>
            )}
            {soil && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Soil Composition</h4>
                  <div className="space-y-2 text-sm p-4 rounded-lg bg-muted/50">
                    <p><strong>Soil Type:</strong> {soilType || 'N/A'}</p>
                    <p><strong>Clay:</strong> {soil.properties.clay.mean.toFixed(1)}%</p>
                    <p><strong>Sand:</strong> {soil.properties.sand.mean.toFixed(1)}%</p>
                    <p><strong>Silt:</strong> {soil.properties.silt.mean.toFixed(1)}%</p>
                    <p><strong>pH:</strong> {soil.properties.phh2o.mean / 10}</p>
                    <p><strong>Organic Carbon:</strong> {soil.properties.soc.mean.toFixed(1)} g/kg</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">AI Recommendations</h4>
                  {isLoading.recommendations ? <Skeleton className="h-40 w-full" /> : (
                    recommendations ? (
                      <div className="space-y-3 text-sm p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                        <p><strong>Crops:</strong> {recommendations.cropRecommendations.join(', ')}</p>
                        <p><strong>Fertilizer:</strong> {recommendations.fertilizerRecommendations}</p>
                        <p><strong>Pesticide:</strong> {recommendations.pesticideRecommendations}</p>
                      </div>
                    ) : (
                      <p>Could not load recommendations.</p>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Leaf /> Pest Detection</CardTitle>
          <CardDescription>Upload an image of a pest to identify it and get treatment advice.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pest-image">Upload Image</Label>
              <div className="flex items-center gap-2">
                 <Input id="pest-image" type="file" accept="image/*" onChange={handlePestFileChange} />
                 <Button onClick={handlePestDetection} disabled={!pestImage || isLoading.pest}>
                    {isLoading.pest ? <Loader2 className="animate-spin" /> : <Search />}
                 </Button>
              </div>
            </div>
            {pestImagePreview && (
              <div className="relative aspect-video w-full">
                <Image src={pestImagePreview} alt="Pest preview" layout="fill" objectFit="cover" className="rounded-md" />
              </div>
            )}
          </div>
          <div className="h-full">
            {isLoading.pest ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 p-4 rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Analyzing image...</p>
              </div>
            ) : pestResult ? (
              <div className="p-4 rounded-lg bg-muted/50 h-full">
                <h4 className="font-semibold mb-2">Detection Result</h4>
                <div className="space-y-2">
                  <p><strong>Detected:</strong> {pestResult.detected}</p>
                  <p><strong>Confidence:</strong> {(pestResult.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Advice:</strong> {pestResult.advice}</p>
                </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-4 rounded-lg border-dashed border-2">
                 <UploadCloud className="h-10 w-10 text-muted-foreground mb-2"/>
                 <p className="text-muted-foreground">Upload an image to start detection.</p>
                 <p className="text-xs text-muted-foreground">Your pest analysis will appear here.</p>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
