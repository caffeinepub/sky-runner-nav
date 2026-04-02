import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SavedStop {
    id: bigint;
    latitude: number;
    destinationId: bigint;
    order: bigint;
    name: string;
    longitude: number;
}
export interface SavedDestination {
    id: bigint;
    latitude: number;
    name: string;
    createdAt: bigint;
    longitude: number;
    notes: string;
}
export interface backendInterface {
    deleteDestination(destinationId: bigint): Promise<void>;
    deleteStop(stopId: bigint): Promise<void>;
    getAllDestinations(): Promise<Array<SavedDestination>>;
    getStopsForDestination(destinationId: bigint): Promise<Array<SavedStop>>;
    saveDestination(name: string, latitude: number, longitude: number): Promise<bigint>;
    saveStop(destinationId: bigint, name: string, latitude: number, longitude: number, order: bigint): Promise<bigint>;
    updateDestinationNotes(destinationId: bigint, notes: string): Promise<void>;
}
