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
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Loader2, Search, UploadCloud} from 'lucide-react';
import {detectPest} from '@/ai/flows/pest-detection';
import Image from 'next/image';
import {useToast} from '@/hooks/use-toast';

type PestDetectionResult = {
  detected: string;
  confidence: number;
  advice: string;
};

function PestDetectionCardComponent() {
  const {toast} = useToast();
  const [pestImage, setPestImage] = useState<File | null>(null);
  const [pestImagePreview, setPestImagePreview] = useState<string | null>(null);
  const [pestResult, setPestResult] = useState<PestDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
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
                  <Button onClick={handlePestDetection} disabled={!pestImage || isLoading} size="icon">
                     {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
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
            {isLoading ? (
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
  );
}

export const PestDetectionCard = memo(PestDetectionCardComponent);
