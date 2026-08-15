import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { WifiOff, Wifi, RefreshCw, CloudOff, Check } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export const OfflineSyncIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null; // Ne rien afficher si tout est OK
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2 h-8',
            !isOnline && 'text-destructive'
          )}
        >
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline">Hors ligne</span>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Sync...</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <CloudOff className="h-4 w-4" />
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingCount}
              </Badge>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="hidden sm:inline">Synchronisé</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  Connecté
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-destructive" />
                  Hors ligne
                </>
              )}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {isOnline
                ? 'Vous êtes connecté à Internet'
                : 'Vous travaillez en mode hors ligne'}
            </p>
          </div>

          {pendingCount > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">
                Modifications en attente
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {pendingCount} modification{pendingCount > 1 ? 's' : ''} sera
                {pendingCount > 1 ? 'ont' : ''} synchronisée
                {pendingCount > 1 ? 's' : ''} automatiquement.
              </p>
              {isOnline && (
                <Button
                  onClick={syncNow}
                  disabled={isSyncing}
                  size="sm"
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Synchroniser maintenant
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {!isOnline && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Vos modifications seront automatiquement synchronisées dès que
                la connexion sera rétablie.
              </p>
            </div>
          )}

          {isOnline && pendingCount === 0 && !isSyncing && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Toutes les données sont synchronisées
                </span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
