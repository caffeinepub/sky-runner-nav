import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SavedDestination, SavedStop } from "../backend.d.ts";
import { useActor } from "./useActor";

export function useGetAllDestinations() {
  const { actor, isFetching } = useActor();
  return useQuery<SavedDestination[]>({
    queryKey: ["destinations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDestinations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStopsForDestination(destinationId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<SavedStop[]>({
    queryKey: ["stops", destinationId?.toString()],
    queryFn: async () => {
      if (!actor || destinationId === null) return [];
      return actor.getStopsForDestination(destinationId);
    },
    enabled: !!actor && !isFetching && destinationId !== null,
  });
}

export function useSaveDestination() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { name: string; lat: number; lng: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveDestination(args.name, args.lat, args.lng);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
    },
  });
}

export function useDeleteDestination() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (destinationId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteDestination(destinationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
    },
  });
}

export function useSaveStop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      destinationId: bigint;
      name: string;
      lat: number;
      lng: number;
      order: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveStop(
        args.destinationId,
        args.name,
        args.lat,
        args.lng,
        args.order,
      );
    },
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({
        queryKey: ["stops", args.destinationId.toString()],
      });
    },
  });
}
