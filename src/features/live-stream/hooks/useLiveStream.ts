import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { liveStreamService, type StartLiveStreamRequest, type StartLiveStreamResponse } from '../services/live-stream.service';

export function useLiveStream() {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [currentStream, setCurrentStream] = useState<StartLiveStreamResponse['liveStream'] | null>(null);

  const startStream = useCallback(async (data: StartLiveStreamRequest) => {
    console.log(' [useLiveStream] startStream llamado con:', data);
    setIsStarting(true);
    try {
      console.log('[useLiveStream] Enviando request al backend...');
      const response = await liveStreamService.startLiveStream(data);
      console.log(' [useLiveStream] Respuesta recibida:', response);
      
      if (response.success) {
        setCurrentStream(response.liveStream);
        toast.success('¡Transmisión iniciada!');
        console.log('[useLiveStream] Stream guardado en estado:', response.liveStream);
        return response.liveStream;
      } else {
        console.error('[useLiveStream] Respuesta no exitosa:', response);
        toast.error('Error al iniciar transmisión');
        return null;
      }
    } catch (error) {
      console.error(' [useLiveStream] Error capturado:', error);
      toast.error('No se pudo iniciar la transmisión');
      return null;
    } finally {
      setIsStarting(false);
      console.log(' [useLiveStream] Proceso finalizado');
    }
  }, []);

  const endStream = useCallback(async (streamId: string) => {
    setIsEnding(true);
    try {
      await liveStreamService.endLiveStream(streamId);
      setCurrentStream(null);
      toast.success('Transmisión finalizada');
      return true;
    } catch (error) {
      console.error('Error ending live stream:', error);
      toast.error('Error al finalizar transmisión');
      return false;
    } finally {
      setIsEnding(false);
    }
  }, []);

  const getStreamStatus = useCallback(async () => {
    try {
      const status = await liveStreamService.getStreamStatus();
      return status;
    } catch (error) {
      console.error('Error getting stream status:', error);
      return null;
    }
  }, []);

  return {
    isStarting,
    isEnding,
    currentStream,
    startStream,
    endStream,
    getStreamStatus,
  };
}
