export type Accommodation = {
  slug: string;
  name: string;
  city: string;
  country: string;
  type: string;
  genderPolicy: string;
  priceCad: number;
  billingPeriod: string;
  rating: number;
  description: string;
  amenities: string[];
  images: string[];
  commute: string;
};

export const accommodations: Accommodation[] = [
  {
    slug: "knaresborough",
    name: "Knaresborough House",
    city: "London",
    country: "United Kingdom",
    type: "Curated homestay",
    genderPolicy: "All students",
    priceCad: 900,
    billingPeriod: "month",
    rating: 5,
    description:
      "A quiet, furnished student stay in south-west London with utilities and Wi-Fi included.",
    amenities: ["Wi-Fi", "Furnished kitchen", "Heating", "Laundry", "Bills included"],
    images: [
      "/images/knaresborough/image1.jpeg",
      "/images/knaresborough/image2.jpeg",
      "/images/knaresborough/image3.jpeg",
      "/images/knaresborough/image4.jpeg"
    ],
    commute: "25–30 min to central London campuses",
  },
  {
    slug: "sw18-female-homestay",
    name: "SW18 Student Homestay",
    city: "London",
    country: "United Kingdom",
    type: "Female-only homestay",
    genderPolicy: "Female students",
    priceCad: 900,
    billingPeriod: "month",
    rating: 5,
    description:
      "A clean, calm student room in SW18 with a study desk, shared kitchen and all core bills included.",
    amenities: ["Wi-Fi", "Study desk", "Kitchen", "Heating", "Laundry"],
    images: [
      "/images/sw18-female-homestay/1_clean.jpeg",
      "/images/sw18-female-homestay/2_clean.jpeg",
      "/images/sw18-female-homestay/3_clean.jpeg",
      "/images/sw18-female-homestay/4_clean.jpeg"
    ],
    commute: "Direct links to London universities",
  },
];
