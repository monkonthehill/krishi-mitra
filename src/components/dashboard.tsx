'use client';

import {useEffect, useState, useMemo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Sun,
  Sunset,
  Sunrise,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {useAuth} from './auth-provider';
import {getWeatherForecast} from '@/lib/actions';
import {classifySoil} from '@/lib/utils';
import {detectPest} from '@/ai/flows/pest-detection';
import {recommendCropsFertilizersAndPesticides} from '@/ai/flows/crop-recommendations';
import Image from 'next/image';
import {useToast} from '@/hooks/use-toast';
import {Skeleton} from './ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {format} from 'date-fns';

type WeatherData = any; // Simplified for WeatherAPI response
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
  const [weather, setWeather] = useState<WeatherData | null>(null);
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
            description: 'Could not access your location. Please enable location services.',
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
      const weatherData = await getWeatherForecast(location.lat, location.lon);
      setWeather(weatherData);
    } catch (error) {
      console.error(error);
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
      const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${location.lat}&lon=${location.lon}&property=${props.join(
        ','
      )}&depth=0-5cm&value=mean`;
      const res = await fetch(url);
      const soilData = await res.json();
      setSoil(soilData);

      const {clay, sand, silt} = soilData.properties;
      const classifiedSoil = classifySoil(sand['mean'], silt['mean'], clay['mean']);
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
        soilType: currentSoilType,
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
      setPestResult(null); // Clear previous result
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

  const weatherChartData = useMemo(() => {
    if (!weather?.forecast?.forecastday) return [];
    return weather.forecast.forecastday.map((day: any) => ({
      date: format(new Date(day.date), 'EEE'),
      max: day.day.maxtemp_c,
      min: day.day.mintemp_c,
    }));
  }, [weather]);

  const chartConfig = {
    max: {
      label: 'Max Temp',
      color: 'hsl(var(--chart-2))',
    },
    min: {
      label: 'Min Temp',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

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
           {/* Weather Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Cloud className="text-accent" /> Location & 7-Day Weather Forecast
              </CardTitle>
               {isLoading.location ? ( <Skeleton className="h-5 w-48 mt-1" /> ) : (
                 location ? (
                    <CardDescription>
                      {weather?.location?.name}, {weather?.location?.country} ({location.lat.toFixed(2)}, {location.lon.toFixed(2)})
                    </CardDescription>
                 ) : (
                    <CardDescription className="text-destructive">{locationError || 'Location not available.'}</CardDescription>
                 )
               )}
            </CardHeader>
            <CardContent>
              {isLoading.location || isLoading.weather ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : weather ? (
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg bg-muted/30">
                     <Image src={`https:${weather.current.condition.icon}`} alt={weather.current.condition.text} width={100} height={100} className="-mt-4 -mb-2"/>
                     <p className="text-6xl font-bold">{Math.round(weather.current.temp_c)}°C</p>
                     <p className="text-xl capitalize text-muted-foreground">{weather.current.condition.text}</p>
                     <div className="flex gap-4 text-sm mt-4">
                       <span>Feels like {Math.round(weather.current.feelslike_c)}°C</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30"><Wind size={24} className="text-primary"/><span className="font-bold text-lg">{weather.current.wind_kph} km/h</span><span className="text-xs text-muted-foreground">Wind</span></div>
                      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30"><Droplets size={24} className="text-primary"/><span className="font-bold text-lg">{weather.current.humidity}%</span><span className="text-xs text-muted-foreground">Humidity</span></div>
                      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30"><Sun size={24} className="text-primary"/><span className="font-bold text-lg">{weather.current.uv}</span><span className="text-xs text-muted-foreground">UV Index</span></div>
                      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30"><Sunrise size={24} className="text-primary"/><span className="font-bold text-lg">{weather.forecast.forecastday[0].astro.sunrise}</span><span className="text-xs text-muted-foreground">Sunrise</span></div>
                      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30"><Sunset size={24} className="text-primary"/><span className="font-bold text-lg">{weather.forecast.forecastday[0].astro.sunset}</span><span className="text-xs text-muted-foreground">Sunset</span></div>
                       <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30"><Thermometer size={24} className="text-primary"/><div className="font-bold text-lg flex items-center"><ArrowUp size={14}/>{Math.round(weather.forecast.forecastday[0].day.maxtemp_c)}° <ArrowDown size={14}/>{Math.round(weather.forecast.forecastday[0].day.mintemp_c)}°</div><span className="text-xs text-muted-foreground">High/Low</span></div>
                  </div>
                   <div className="md:col-span-2">
                     <ChartContainer config={chartConfig} className="w-full h-64">
                       <BarChart data={weatherChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                         <CartesianGrid vertical={false} />
                         <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                         <YAxis tickLine={false} axisLine={false} tickMargin={8} unit="°C" />
                         <ChartTooltip content={<ChartTooltipContent />} />
                         <Legend content={<ChartLegend content={<ChartLegendContent />} />} />
                         <Bar dataKey="min" fill="var(--color-min)" radius={4} />
                         <Bar dataKey="max" fill="var(--color-max)" radius={4} />
                       </BarChart>
                     </ChartContainer>
                   </div>
                </div>
              ) : (
                 <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">Could not load weather data.</p>
                    <Button onClick={handleWeatherFetch} disabled={isLoading.weather || !location}>
                      {isLoading.weather ? <Loader2 className="animate-spin" /> : 'Retry Fetch'}
                    </Button>
                 </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Soil Analysis Card */}
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
                      <Button onClick={handleSoilAnalysis} disabled={isLoading.soil || !location} size="lg">
                          {isLoading.soil ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze My Soil'}
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

            {/* AI Recommendations Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl"><Leaf className="text-accent" /> AI Recommendations</CardTitle>
                <CardDescription>Personalized advice based on your data.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center">
                 {isLoading.recommendations ? <Skeleton className="h-48 w-full" /> : recommendations ? (
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
          </div>
        </div>
      </div>

      {/* Pest Detection Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M15 6.202a2 2 0 0 1 3.465 1.054l1.458 4.373a1 1 0 0 1-.689 1.258l-2.738.913a1 1 0 0 1-1.258-.689l-1.054-3.465Z"></path><path d="m5.215 13.344 3.465 1.054a1 1 0 0 0 1.258-.689l.913-2.738a1 1 0 0 0-.689-1.258l-3.465-1.054a2 2 0 0 0-2.517 1.378l-1.054 3.465a2 2 0 0 0 1.378 2.517Z"></path><path d="M12 20a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1Z"></path><path d="M18.72 15.6a1 1 0 0 0 .56 1.63l1.96.65a1 1 0 0 0 1.26-.68l.33-1.1a1 1 0 0 0-.68-1.26l-1.96-.65a1 1 0 0 0-1.63.56l-.33 1.1Z"></path><path d="m20.94 7.6-1.63-.56a1 1 0 0 0-1.26.68l-1.1 3.3a1 1 0 0 0 .56 1.63l1.63.56a1 1 0 0 0 1.26-.68l1.1-3.3a1 1 0 0 0-.56-1.63Z"></path><path d="m3.3 11.5 1.1-.33a1 1 0 0 0 .68-1.26l-.65-1.96a1 1 0 0 0-1.26-.68l-1.1.33a1 1 0 0 0-.68 1.26l.65 1.96a1 1 0 0 0 1.26.68Z"></path></svg> Pest Detection</CardTitle>
          <CardDescription>Upload an image of a pest to identify it and get instant treatment advice.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="pest-image" className="text-base">Upload Pest Image</Label>
               <div className="flex items-center gap-2">
                  <Input id="pest-image" type="file" accept="image/*" onChange={handlePestFileChange} className="file:text-primary file:font-semibold"/>
                  <Button onClick={handlePestDetection} disabled={!pestImage || isLoading.pest} size="icon">
                     {isLoading.pest ? <Loader2 className="animate-spin" /> : <Search />}
                  </Button>
               </div>
             </div>
            {pestImagePreview && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border shadow-inner">
                <Image src={pestImagePreview} alt="Pest preview" layout="fill" objectFit="cover" />
              </div>
            )}
          </div>
          <div className="h-full">
            {isLoading.pest ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 p-4 rounded-lg bg-muted/30">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Analyzing image...</p>
              </div>
            ) : pestResult ? (
              <div className="p-6 rounded-lg bg-muted/30 h-full space-y-4">
                <h4 className="font-bold text-xl mb-2">Detection Result</h4>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="font-semibold">Detected Pest:</span>
                      <span className="font-mono p-1 px-2 bg-primary/10 rounded-md text-primary">{pestResult.detected}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="font-semibold">Confidence Score:</span>
                      <span className="font-mono p-1 px-2 bg-primary/10 rounded-md text-primary">{(pestResult.confidence * 100).toFixed(1)}%</span>
                   </div>
                   <div>
                     <p className="font-semibold mb-1">Recommended Advice:</p>
                     <p className="text-muted-foreground">{pestResult.advice}</p>
                   </div>
                </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-4 rounded-lg border-dashed border-2 bg-muted/20">
                 <UploadCloud className="h-12 w-12 text-muted-foreground mb-3"/>
                 <h3 className="font-semibold text-lg">Upload an Image</h3>
                 <p className="text-sm text-muted-foreground mt-1">Your pest analysis and treatment advice will appear here.</p>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
