'use client';

import {useEffect, useState, useMemo, memo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  Cloud,
  Droplets,
  Loader2,
  Thermometer,
  Wind,
  Sun,
  Sunset,
  Sunrise,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {getWeatherForecast} from '@/lib/actions';
import Image from 'next/image';
import {useToast} from '@/hooks/use-toast';
import {Skeleton} from '../ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {BarChart, CartesianGrid, XAxis, YAxis, Bar} from 'recharts';
import {format} from 'date-fns';
import type {Location} from '../dashboard';

type WeatherData = any; // Simplified for WeatherAPI response

type WeatherCardProps = {
    location: Location | null;
    isLoading: boolean;
    error: string | null;
}

function WeatherCardComponent({ location, isLoading: isLocationLoading, error: locationError }: WeatherCardProps) {
  const {toast} = useToast();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    if (location) {
      handleWeatherFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleWeatherFetch = async () => {
    if (!location) return;
    setIsWeatherLoading(true);
    setWeather(null);
    try {
      const weatherData = await getWeatherForecast(location.lat, location.lon);
      setWeather(weatherData);
    } catch (error) {
      console.error(error);
      toast({variant: 'destructive', title: 'Failed to fetch weather data.'});
    } finally {
      setIsWeatherLoading(false);
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
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Cloud className="text-accent" /> Location & 7-Day Weather Forecast
        </CardTitle>
          {isLocationLoading ? ( <Skeleton className="h-5 w-48 mt-1" /> ) : (
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
        {isLocationLoading || isWeatherLoading ? (
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
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="min" fill="var(--color-min)" radius={4} />
                    <Bar dataKey="max" fill="var(--color-max)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>
          </div>
        ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">Could not load weather data.</p>
              <Button onClick={handleWeatherFetch} disabled={isWeatherLoading || !location}>
                {isWeatherLoading ? <Loader2 className="animate-spin" /> : 'Retry Fetch'}
              </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

export const WeatherCard = memo(WeatherCardComponent);
