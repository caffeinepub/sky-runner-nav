import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

actor {
  // Types
  type SavedDestination = {
    id : Nat;
    name : Text;
    latitude : Float;
    longitude : Float;
    createdAt : Int;
    notes : Text;
  };

  type SavedStop = {
    id : Nat;
    destinationId : Nat;
    name : Text;
    latitude : Float;
    longitude : Float;
    order : Nat;
  };

  // Modules
  module SavedDestination {
    public func compare(d1 : SavedDestination, d2 : SavedDestination) : Order.Order {
      Int.compare(d2.createdAt, d1.createdAt);
    };
  };

  module SavedStop {
    public func compare(s1 : SavedStop, s2 : SavedStop) : Order.Order {
      Nat.compare(s1.order, s2.order);
    };
  };

  // State
  var nextDestinationId = 1;
  var nextStopId = 1;

  let destinationStorage = Map.empty<Principal, Map.Map<Nat, SavedDestination>>();
  let stopStorage = Map.empty<Principal, Map.Map<Nat, SavedStop>>();

  // Helpers
  func getUserDestinationMap(user : Principal) : Map.Map<Nat, SavedDestination> {
    switch (destinationStorage.get(user)) {
      case (?map) { map };
      case (null) {
        Runtime.trap("User destination map not found");
      };
    };
  };

  func getUserStopMap(user : Principal) : Map.Map<Nat, SavedStop> {
    switch (stopStorage.get(user)) {
      case (?map) { map };
      case (null) {
        Runtime.trap("User stop map not found");
      };
    };
  };

  // Save a new destination
  public shared ({ caller }) func saveDestination(name : Text, latitude : Float, longitude : Float) : async Nat {
    let id = nextDestinationId;
    nextDestinationId += 1;

    let newDestination : SavedDestination = {
      id;
      name;
      latitude;
      longitude;
      createdAt = Time.now();
      notes = "";
    };

    let userMap = switch (destinationStorage.get(caller)) {
      case (null) { Map.empty<Nat, SavedDestination>() };
      case (?map) { map };
    };

    userMap.add(id, newDestination);
    destinationStorage.add(caller, userMap);

    id;
  };

  // Get all saved destinations for user (sorted by createdAt descending)
  public query ({ caller }) func getAllDestinations() : async [SavedDestination] {
    switch (destinationStorage.get(caller)) {
      case (null) { [] };
      case (?map) {
        map.values().toArray().sort();
      };
    };
  };

  // Update notes for a destination
  public shared ({ caller }) func updateDestinationNotes(destinationId : Nat, notes : Text) : async () {
    let userMap = getUserDestinationMap(caller);

    if (not userMap.containsKey(destinationId)) {
      Runtime.trap("Destination not found");
    };

    let d : SavedDestination = switch (userMap.get(destinationId)) {
      case (null) { Runtime.trap("Destination not found") };
      case (?destination) { destination };
    };

    let updatedDestination : SavedDestination = {
      d with
      notes;
    };

    userMap.add(destinationId, updatedDestination);
  };

  // Delete a destination
  public shared ({ caller }) func deleteDestination(destinationId : Nat) : async () {
    let userMap = getUserDestinationMap(caller);
    userMap.remove(destinationId);
  };

  // Save a stop linked to a destination
  public shared ({ caller }) func saveStop(destinationId : Nat, name : Text, latitude : Float, longitude : Float, order : Nat) : async Nat {
    let id = nextStopId;
    nextStopId += 1;

    let newStop : SavedStop = {
      id;
      destinationId;
      name;
      latitude;
      longitude;
      order;
    };

    let userMap = switch (stopStorage.get(caller)) {
      case (null) { Map.empty<Nat, SavedStop>() };
      case (?map) { map };
    };

    userMap.add(id, newStop);
    stopStorage.add(caller, userMap);

    id;
  };

  // Get stops for a destination (sorted by order)
  public query ({ caller }) func getStopsForDestination(destinationId : Nat) : async [SavedStop] {
    switch (stopStorage.get(caller)) {
      case (null) { [] };
      case (?map) {
        let stops = List.empty<SavedStop>();
        map.values().forEach(func(stop) { if (stop.destinationId == destinationId) { stops.add(stop) } });
        stops.toArray().sort();
      };
    };
  };

  // Delete a stop
  public shared ({ caller }) func deleteStop(stopId : Nat) : async () {
    let userMap = getUserStopMap(caller);
    userMap.remove(stopId);
  };
};
