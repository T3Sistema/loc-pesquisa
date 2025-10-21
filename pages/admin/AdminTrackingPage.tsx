// pages/admin/AdminTrackingPage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getResearchers, getLocationsForDate } from '../../services/api';
import type { Researcher, ResearcherLocation } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

// As leaflet é uma variável global carregada no index.html
declare var L: any;

const FIVE_MINUTES = 5 * 60 * 1000;

const AdminTrackingPage: React.FC = () => {
    const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [locations, setLocations] = useState<ResearcherLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedResearcherId, setSelectedResearcherId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersLayer = useRef<any>(null);
    const routeLayer = useRef<any>(null);

    useEffect(() => {
        const initMap = () => {
            if (mapRef.current && !mapInstance.current) {
                mapInstance.current = L.map(mapRef.current).setView([-14.235, -51.925], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);
                markersLayer.current = L.layerGroup().addTo(mapInstance.current);
                routeLayer.current = L.layerGroup().addTo(mapInstance.current);
            }
        };
        initMap();
    }, []);
    
    useEffect(() => {
        const fetchResearchers = async () => {
            try {
                const researchersData = await getResearchers();
                setResearchers(researchersData.filter(r => r.isActive));
            } catch (error) {
                console.error("Failed to fetch researchers:", error);
            }
        };
        fetchResearchers();
    }, []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];

        const fetchLocations = async () => {
            try {
                const locationsData = await getLocationsForDate(today);
                setLocations(locationsData);
            } catch (error) {
                console.error("Failed to fetch tracking data:", error);
            } finally {
                // Garante que o spinner de carregamento seja desativado apenas uma vez
                if (isLoading) setIsLoading(false);
            }
        };

        fetchLocations(); // Fetch inicial

        const pollIntervalId = window.setInterval(fetchLocations, 20000);
        const timeUpdateIntervalId = window.setInterval(() => setCurrentTime(new Date()), 60000);

        return () => {
            clearInterval(pollIntervalId);
            clearInterval(timeUpdateIntervalId);
        };
    }, [isLoading]); // A dependência isLoading garante que o setIsLoading(false) seja chamado corretamente.
    
    const latestLocations = useMemo(() => {
        const latest: Record<string, ResearcherLocation> = {};
        locations.forEach(loc => {
            if (!latest[loc.researcherId] || new Date(loc.timestamp) > new Date(latest[loc.researcherId].timestamp)) {
                latest[loc.researcherId] = loc;
            }
        });
        return Object.values(latest);
    }, [locations]);

    const getResearcherStatus = (researcherId: string) => {
        const lastSeen = latestLocations.find(l => l.researcherId === researcherId);
        if (!lastSeen) {
            return { text: 'Offline', color: 'text-gray-400', isOnline: false };
        }
        
        const lastSeenTime = lastSeen.timestamp.getTime();
        const timeDiff = currentTime.getTime() - lastSeenTime;
        
        if (timeDiff < FIVE_MINUTES) {
            return { text: 'Online', color: 'text-success', isOnline: true };
        } else {
            return { text: `Visto às ${lastSeen.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, color: 'text-gray-400', isOnline: false };
        }
    };
    
    const onlineCount = useMemo(() => {
      return researchers.filter(r => getResearcherStatus(r.id).isOnline).length;
    }, [researchers, latestLocations, currentTime]);

    useEffect(() => {
        if (!mapInstance.current || !markersLayer.current) return;
        
        markersLayer.current.clearLayers();

        if (latestLocations.length > 0) {
            const markerBounds: any[] = [];
            latestLocations.forEach(loc => {
                const researcher = researchers.find(r => r.id === loc.researcherId);
                if (researcher) {
                    const status = getResearcherStatus(researcher.id);
                    const iconHtml = `<div style="background-color: ${status.isOnline ? '#22C55E' : '#6B7280'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`;
                    const customIcon = L.divIcon({
                      html: iconHtml,
                      className: 'custom-map-marker',
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    });

                    const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon })
                        .addTo(markersLayer.current)
                        .bindPopup(`<b>${researcher.name}</b><br>Status: ${status.text}`);
                    markerBounds.push([loc.latitude, loc.longitude]);
                }
            });
            if(markerBounds.length > 0 && !selectedResearcherId) {
                mapInstance.current.fitBounds(markerBounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [latestLocations, researchers, selectedResearcherId, currentTime]); // Adicionado currentTime para re-renderizar marcadores com status atualizado
    
    useEffect(() => {
        if (!mapInstance.current || !routeLayer.current) return;
        
        routeLayer.current.clearLayers();
        
        if (selectedResearcherId) {
            const researcherRoute = locations.filter(loc => loc.researcherId === selectedResearcherId);
            if(researcherRoute.length > 0) {
                const latLngs = researcherRoute.map(loc => [loc.latitude, loc.longitude]);
                L.polyline(latLngs, { color: 'blue' }).addTo(routeLayer.current);
                mapInstance.current.fitBounds(latLngs, { padding: [50, 50], maxZoom: 17 });
            }
        }
    }, [selectedResearcherId, locations]);

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold">Rastreamento em Tempo Real</h1>
            </div>

            <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-full md:w-80 lg:w-96 bg-light-background dark:bg-dark-card p-4 rounded-lg shadow-md flex-shrink-0 flex flex-col">
                    <h3 className="text-lg font-bold mb-3">Pesquisadores (Online: {onlineCount})</h3>
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center">
                           <LoadingSpinner text="Carregando" />
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto pr-2">
                           {researchers.length > 0 ? (
                            <ul className="space-y-2">
                                {researchers.map(researcher => {
                                    const status = getResearcherStatus(researcher.id);
                                    return (
                                        <li key={researcher.id}>
                                            <button 
                                                onClick={() => setSelectedResearcherId(researcher.id === selectedResearcherId ? null : researcher.id)}
                                                className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${selectedResearcherId === researcher.id ? 'bg-light-primary/20' : 'hover:bg-gray-100 dark:hover:bg-dark-background'}`}
                                            >
                                                <img src={researcher.photoUrl} alt={researcher.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold truncate">{researcher.name}</p>
                                                    <p className={`text-xs font-medium ${status.color}`}>{status.text}</p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            ) : (
                                <p className="text-sm text-gray-500 text-center pt-8">Nenhum pesquisador ativo encontrado.</p>
                            )}
                        </div>
                    )}
                </aside>
                
                {/* Map */}
                <main className="flex-grow rounded-lg shadow-md overflow-hidden relative">
                    {selectedResearcherId && (
                        <button 
                            onClick={() => setSelectedResearcherId(null)}
                            className="absolute top-3 right-3 z-[1000] bg-white dark:bg-dark-card py-1 px-3 rounded-full shadow-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Ver todos
                        </button>
                    )}
                    <div ref={mapRef} className="h-full w-full"></div>
                </main>
            </div>
        </div>
    );
};

export default AdminTrackingPage;
