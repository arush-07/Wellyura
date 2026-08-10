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
    genderPolicy: "Girls only",
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

  {
    slug: "disraeli-homestay-room-1",
    name: "Disraeli Homestay - Room 1",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 850,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A comfortable London homestay room with Wi-Fi, study desk access, shared kitchen and common washroom facilities. Suitable for students looking for a simple stay with access to major London universities.",
    amenities: [
      "Shared Kitchen",
      "Common Washroom",
      "Wi-Fi",
      "Study desk",
    ],
    images: [
      "/accommodation/disraeli-homestay-room-1/cover.jpeg",
      "/accommodation/disraeli-homestay-room-1/detail-1.jpeg",
      "/accommodation/disraeli-homestay-room-1/detail-2.jpeg",
      "/accommodation/disraeli-homestay-room-1/detail-3.jpeg",
      "/accommodation/disraeli-homestay-room-1/detail-4.jpeg",
    ],
  },


  {
    slug: "disraeli-homestay-room-2",
    name: "Disraeli Homestay - Room 2",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 850,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A furnished London homestay room with Wi-Fi, study desk access, shared kitchen and common washroom facilities. Suitable for students looking for a clean and practical stay near major London universities.",
    amenities: [
      "Shared Kitchen",
      "Common Washroom",
      "Wi-Fi",
      "Study desk",
    ],
    images: [
      "/accommodation/disraeli-homestay-room-2/cover.jpeg",
      "/accommodation/disraeli-homestay-room-2/detail-1.jpeg",
      "/accommodation/disraeli-homestay-room-2/detail-2.jpeg",
      "/accommodation/disraeli-homestay-room-2/detail-3.jpeg",
      "/accommodation/disraeli-homestay-room-2/detail-4.jpeg",
    ],
  },


  {
    slug: "disraeli-homestay-room-3",
    name: "Disraeli Homestay - Room 3",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 875,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A bright furnished London homestay room with Wi-Fi, study desk access, shared kitchen and common washroom facilities. Suitable for students looking for a clean stay near major London universities.",
    amenities: [
      "Shared Kitchen",
      "Common Washroom",
      "Wi-Fi",
      "Study desk",
    ],
    images: [
      "/accommodation/disraeli-homestay-room-3/cover.jpeg",
      "/accommodation/disraeli-homestay-room-3/detail-1.jpeg",
      "/accommodation/disraeli-homestay-room-3/detail-2.jpeg",
      "/accommodation/disraeli-homestay-room-3/detail-3.jpeg",
      "/accommodation/disraeli-homestay-room-3/detail-4.jpeg",
    ],
  },


  {
    slug: "disraeli-homestay-room-4",
    name: "Disraeli Homestay - Room 4",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 875,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A spacious furnished London homestay room with Wi-Fi, study desk access, central heating, double-glazed windows and shared facilities. Suitable for students looking for a comfortable stay near major London universities.",
    amenities: [
      "Shared Kitchen",
      "Common Washroom",
      "Wi-Fi",
      "Study desk",
      "Central heating and double-glazed windows",
      "Wooden laminate flooring",
    ],
    images: [
      "/accommodation/disraeli-homestay-room-4/cover.jpeg",
      "/accommodation/disraeli-homestay-room-4/detail-1.jpeg",
      "/accommodation/disraeli-homestay-room-4/detail-2.jpeg",
      "/accommodation/disraeli-homestay-room-4/detail-3.jpeg",
      "/accommodation/disraeli-homestay-room-4/detail-4.jpeg",
    ],
  },


  {
    slug: "disraeli-homestay-room-5",
    name: "Disraeli Homestay - Room 5",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 875,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A furnished London homestay room with Wi-Fi, study desk access, central heating, double-glazed windows, wooden laminate flooring and shared facilities. Suitable for students looking for a comfortable stay near major London universities.",
    amenities: [
      "Shared Kitchen",
      "Common Washroom",
      "Wi-Fi",
      "Study desk",
      "Central heating and double-glazed windows",
      "Wooden laminate flooring",
    ],
    images: [
      "/accommodation/disraeli-homestay-room-5/cover.jpeg",
      "/accommodation/disraeli-homestay-room-5/detail-1.jpeg",
      "/accommodation/disraeli-homestay-room-5/detail-2.jpeg",
      "/accommodation/disraeli-homestay-room-5/detail-3.jpeg",
      "/accommodation/disraeli-homestay-room-5/detail-4.jpeg",
    ],
  },


  {
    slug: "disraeli-homestay-en-suite",
    name: "Disraeli Homestay En-Suite",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 900,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A furnished London en-suite homestay room with a personal washroom, Wi-Fi, study desk access, central heating, double-glazed windows, wooden laminate flooring and shared kitchen access. Suitable for students looking for added privacy near major London universities.",
    amenities: [
      "Shared Kitchen",
      "Personal Washroom",
      "Wi-Fi",
      "Study desk",
      "Central heating and double-glazed windows",
      "Wooden laminate flooring",
    ],
    images: [
      "/accommodation/disraeli-homestay-en-suite/cover.jpeg",
      "/accommodation/disraeli-homestay-en-suite/detail-1.jpeg",
      "/accommodation/disraeli-homestay-en-suite/detail-2.jpeg",
      "/accommodation/disraeli-homestay-en-suite/detail-3.png",
      "/accommodation/disraeli-homestay-en-suite/detail-4.jpeg",
    ],
  },


  {
    slug: "disraeli-homestay-room-7",
    name: "Disraeli Homestay Room 7",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 900,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near UEL, Queen Mary University of London, UCL and King's College London",
    genderPolicy: "No preference",
    description:
      "A furnished London homestay room with Wi-Fi, study desk access, personal washroom access, central heating, double-glazed windows, wooden laminate flooring and shared kitchen access. Suitable for students looking for a comfortable stay near major London universities.",
    amenities: [
      "Shared Kitchen",
      "Personal Washroom",
      "Wi-Fi",
      "Study desk",
      "Central heating and double-glazed windows",
      "Wooden laminate flooring",
    ],
    images: [
      "/accommodation/disraeli-homestay-room-7/cover.jpeg",
      "/accommodation/disraeli-homestay-room-7/detail-1.jpeg",
      "/accommodation/disraeli-homestay-room-7/detail-2.jpeg",
      "/accommodation/disraeli-homestay-room-7/detail-3.jpeg",
      "/accommodation/disraeli-homestay-room-7/detail-4.jpeg",
    ],
  },


  {
    slug: "sergios-homestay",
    name: "Sergio's Homestay",
    type: "Homestay",
    city: "London",
    country: "United Kingdom",
    priceCad: 1480,
    billingPeriod: "month",
    rating: 0,
    commute:
      "Near London South Bank University, King's College London, London School of Economics and Political Science, and University College London",
    genderPolicy: "No preference",
    description:
      "A bright and comfortable London homestay located around SE1 6TU, New Kent Rd, London, UK. The stay includes access to a shared kitchen, personal washroom, Wi-Fi, study desk, heating and wooden laminate flooring.",
    amenities: [
      "Shared Kitchen",
      "Personal Washroom",
      "Wi-Fi",
      "Study desk",
      "Heating",
      "Wooden laminate flooring",
    ],
    images: [
      "/accommodation/sergios-homestay/cover.jpeg",
      "/accommodation/sergios-homestay/detail-1.jpeg",
      "/accommodation/sergios-homestay/detail-2.jpeg",
      "/accommodation/sergios-homestay/detail-3.jpeg",
      "/accommodation/sergios-homestay/detail-4.jpeg",
    ],
  },

];
