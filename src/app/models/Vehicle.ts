export interface DateRange {
  from: string; // ISO date e.g. "2026-02-10"
  until: string; // ISO date e.g. "2026-02-13"
}

export interface VehicleCardVm {
  vehicleId: number;

  make: string;
  model: string;
  year: number;

  vehicleFullName: string;
  vehicleFirstImage?: string | null;

  rating?: number | null;
  ratingStatus?: "Excellent" | "Good" | "Average" | "New" | null;

  isVettedHost?: boolean;

  colorName: string;
  colorHex: string;

  province: string;
  city: string;
  address: string;

  rate: number;

  /** NEW: booked dates to drive availability badge */
  bookings?: DateRange[];
}

export const MOCK_VEHICLES: VehicleCardVm[] = [
  {
    vehicleId: 101,
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    vehicleFullName: "Toyota Corolla SE (2020)",
    vehicleFirstImage:
      "https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Toyota%20Corolla%20SE,%20front%202.29.20.jpg",
    rating: 4.7,
    ratingStatus: "Excellent",
    isVettedHost: true,
    colorName: "White",
    colorHex: "#FFFFFF",
    province: "Gauteng",
    city: "Johannesburg",
    address: "Sandton, Rivonia Rd",
    rate: 650,
    bookings: [
      { from: "2026-02-06", until: "2026-02-09" },
      { from: "2026-02-15", until: "2026-02-18" },
    ],
  },
  {
    vehicleId: 102,
    make: "Volkswagen",
    model: "Polo",
    year: 2019,
    vehicleFullName: "VW Polo (Silver Edition)",
    vehicleFirstImage:
      "https://commons.wikimedia.org/wiki/Special:FilePath/VW%20Polo%20IV%20Facelift%20Silver%20Edition%2020090620%20front.JPG",
    rating: 4.5,
    ratingStatus: "Good",
    isVettedHost: true,
    colorName: "Silver",
    colorHex: "#C0C0C0",
    province: "Western Cape",
    city: "Cape Town",
    address: "Sea Point, Main Rd",
    rate: 700,
    bookings: [{ from: "2026-02-04", until: "2026-02-07" }],
  },
  {
    vehicleId: 103,
    make: "Ford",
    model: "Ranger Wildtrak",
    year: 2024,
    vehicleFullName: "Ford Ranger Wildtrak (2024)",
    vehicleFirstImage:
      "https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Ford%20Ranger%20Wildtrak%20X%20EcoBlue%204x4%20-%201996cc%202.0%20(205PS)%20Diesel%20-%20Blue%20Lightning%20-%2002-2025,%20Front.jpg",
    rating: 4.8,
    ratingStatus: "Excellent",
    isVettedHost: true,
    colorName: "Blue",
    colorHex: "#1E5AA8",
    province: "KwaZulu-Natal",
    city: "Durban",
    address: "Umhlanga, Gateway",
    rate: 1200,
    bookings: [],
  },
  {
    vehicleId: 104,
    make: "BMW",
    model: "3 Series (F30)",
    year: 2015,
    vehicleFullName: "BMW 3 Series F30 (2015)",
    vehicleFirstImage:
      "https://commons.wikimedia.org/wiki/Special:FilePath/White%20BMW%20335i%20xDrive%20(F30).jpg",
    rating: null,
    ratingStatus: "New",
    isVettedHost: false,
    colorName: "White",
    colorHex: "#FFFFFF",
    province: "Gauteng",
    city: "Pretoria",
    address: "Hatfield, Burnett St",
    rate: 1400,
    bookings: [{ from: "2026-02-20", until: "2026-02-25" }],
  },
];
