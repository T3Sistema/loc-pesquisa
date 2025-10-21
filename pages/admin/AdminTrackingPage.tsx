// pages/admin/AdminTrackingPage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getResearchers, getLocationsForDate } from '../../services/api';
import type { Researcher, ResearcherLocation } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

// As leaflet é uma variável global carregada no index.html
declare var L: any;

const AdminTrackingPage: React.FC = () => {
    const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [locations, setLocations] = useState<ResearcherLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedResearcherId, setSelectedResearcherId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersLayer = useRef<any>(null);
    const routeLayer = useRef<any>(null);

    useEffect(() => {
        const initMap = () => {
            if (mapRef.current && !mapInstance.current) {
                // Coordenadas iniciais centralizadas no Brasil
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
    
    // Efeito para buscar os pesquisadores, roda apenas uma vez
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

    // Efeito para buscar localizações e configurar o polling
    useEffect(() => {
        let intervalId: number | undefined;

        const fetchLocations = async () => {
            setIsLoading(true);
            try {
                const locationsData = await getLocationsForDate(selectedDate);
                setLocations(locationsData);
            } catch (error) {
                console.error("Failed to fetch tracking data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();

        // Configura o polling para atualizações em tempo real apenas se a data selecionada for hoje
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
            intervalId = window.setInterval(async () => {
                const locationsData = await getLocationsForDate(selectedDate);
                setLocations(locationsData);
            }, 20000); // Busca novas localizações a cada 20 segundos
        }

        // Função de limpeza para limpar o intervalo
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedDate]);
    
    const latestLocations = useMemo(() => {
        const latest: Record<string, ResearcherLocation> = {};
        locations.forEach(loc => {
            if (!latest[loc.researcherId] || new Date(loc.timestamp) > new Date(latest[loc.researcherId].timestamp)) {
                latest[loc.researcherId] = loc;
            }
        });
        return Object.values(latest);
    }, [locations]);

    useEffect(() => {
        if (!mapInstance.current || !markersLayer.current) return;
        
        markersLayer.current.clearLayers();

        if (latestLocations.length > 0) {
            const markerBounds: any[] = [];
            latestLocations.forEach(loc => {
                const researcher = researchers.find(r => r.id === loc.researcherId);
                if (researcher) {
                    const marker = L.marker([loc.latitude, loc.longitude])
                        .addTo(markersLayer.current)
                        .bindPopup(`<b>${researcher.name}</b><br>Última atualização: ${loc.timestamp.toLocaleTimeString('pt-BR')}`);
                    markerBounds.push([loc.latitude, loc.longitude]);
                }
            });
            if(markerBounds.length > 0 && !selectedResearcherId) {
                mapInstance.current.fitBounds(markerBounds, { padding: [50, 50] });
            }
        }
    }, [latestLocations, researchers, selectedResearcherId]);
    
    useEffect(() => {
        if (!mapInstance.current || !routeLayer.current) return;
        
        routeLayer.current.clearLayers();
        
        if (selectedResearcherId) {
            const researcherRoute = locations.filter(loc => loc.researcherId === selectedResearcherId);
            if(researcherRoute.length > 0) {
                const latLngs = researcherRoute.map(loc => [loc.latitude, loc.longitude]);
                L.polyline(latLngs, { color: 'blue' }).addTo(routeLayer.current);
                mapInstance.current.fitBounds(latLngs, { padding: [50, 50] });
            }
        }
    }, [selectedResearcherId, locations]);

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold">Rastreamento de Pesquisadores</h1>
            </div>

            <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-full md:w-80 lg:w-96 bg-light-background dark:bg-dark-card p-4 rounded-lg shadow-md flex-shrink-0 flex flex-col">
                    <h2 className="text-lg font-bold mb-2">Controles</h2>
                     <div className="mb-4">
                        <label htmlFor="date-filter" className="block text-sm font-medium mb-1">Data da Rota</label>
                        <input
                            type="date"
                            id="date-filter"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSelectedResearcherId(null);
                            }}
                            className="w-full input-style"
                        />
                    </div>
                    <h3 className="text-md font-semibold mb-2 border-t border-light-border dark:border-dark-border pt-2">Pesquisadores ({latestLocations.length})</h3>
                    {isLoading && locations.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                           <LoadingSpinner text="Carregando" />
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto pr-2">
                           {researchers.length > 0 ? (
                            <ul className="space-y-2">
                                {researchers.map(researcher => {
                                    const lastSeen = latestLocations.find(l => l.researcherId === researcher.id);
                                    return (
                                        <li key={researcher.id}>
                                            <button 
                                                onClick={() => setSelectedResearcherId(researcher.id)}
                                                className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${selectedResearcherId === researcher.id ? 'bg-light-primary/20' : 'hover:bg-gray-100 dark:hover:bg-dark-background'}`}
                                            >
                                                <img src={researcher.photoUrl} alt={researcher.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold truncate">{researcher.name}</p>
                                                    {lastSeen ? (
                                                        <p className="text-xs text-success">Online - {lastSeen.timestamp.toLocaleTimeString('pt-BR')}</p>
                                                    ) : (
                                                        <p className="text-xs text-gray-400">Offline</p>
                                                    )}
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