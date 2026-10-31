import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './queryKeys';

export function useNearbyBuildingsQuery(radius, enabled = true) {
  return useQuery({
    queryKey: queryKeys.spatial.nearbyBuildings(radius),
    queryFn: () => api.nearbyBuildings(radius),
    enabled: enabled && !!radius,
    staleTime: 1000 * 60,
  });
}

export function useSpatialNearbyQuery({ lat, lon, radius }, enabled = false) {
  return useQuery({
    queryKey: queryKeys.spatial.nearby(lat, lon, radius),
    queryFn: () => api.spatialNearby({ lat: Number(lat), lon: Number(lon), radius: Number(radius) }),
    enabled: enabled && lat !== '' && lon !== '' && !!radius,
    staleTime: 1000 * 60,
  });
}

export function useSpatialRoomsQuery({ lat, lon, radius }, enabled = false) {
  return useQuery({
    queryKey: queryKeys.spatial.nearbyRooms(lat, lon, radius),
    queryFn: () => api.spatialNearbyRooms({ lat: Number(lat), lon: Number(lon), radius: Number(radius) }),
    enabled: enabled && lat !== '' && lon !== '' && !!radius,
    staleTime: 1000 * 60,
  });
}
