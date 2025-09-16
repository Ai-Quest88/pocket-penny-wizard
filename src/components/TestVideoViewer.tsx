import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Download, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TestVideoViewerProps {
  videoPath?: string;
  testTitle: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
}

export function TestVideoViewer({ videoPath, testTitle, status }: TestVideoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Mock video path for demonstration
  const mockVideoPath = `/test-results/videos/${testTitle.replace(/\s+/g, '-').toLowerCase()}.webm`;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{testTitle}</span>
          <span className={`text-xs px-2 py-1 rounded ${
            status === 'passed' ? 'bg-green-100 text-green-800' : 
            status === 'failed' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {videoPath || status === 'running' ? (
              <video 
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              >
                <source src={videoPath || mockVideoPath} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full text-white/70">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No video recording available</p>
                </div>
              </div>
            )}
            
            {/* Live Recording Indicator */}
            {status === 'running' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                RECORDING
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={!videoPath && status !== 'running'}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRestart}
                  disabled={!videoPath && status !== 'running'}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{testTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video className="w-full h-full object-contain" controls>
                        <source src={videoPath || mockVideoPath} type="video/webm" />
                      </video>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!videoPath}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}