export type Lodge = {
  id: number;
  name: string;
  state: "SD" | "ND" | "NE";
  city: string;
  lat: number;
  lng: number;
  species: string[];
  phone: string;
  description: string;
  amenities: string[];
  website: string;
};

export const lodges: Lodge[] = [
  {
    id: 1,
    name: "Baldhill Creek Adventures",
    state: "ND",
    city: "Luverne",
    lat: 47.45,
    lng: -97.15,
    species: ["Whitetail", "Pheasant", "Waterfowl"],
    phone: "(701) 840-8409",
    description:
      "Small family-run hunting lodge along the Sheyenne River and Baldhill Creek valleys. Privacy and prairie quiet in a newly built lodge.",
    amenities: ["Lodging", "Guides", "Meals"],
    website: "",
  },
  {
    id: 2,
    name: "Betty's Hunting Lodge",
    state: "ND",
    city: "Braddock",
    lat: 46.55,
    lng: -100.15,
    species: ["Pheasant", "Grouse", "Waterfowl", "Deer"],
    phone: "(701) 782-6891",
    description:
      "A 4,000-acre farm and cattle ranch turned hunting lodge. Built for mixed-bag days on contiguous private ground.",
    amenities: ["Lodging", "Private Land"],
    website: "",
  },
  {
    id: 3,
    name: "Thelens' Pheasant Run Lodge",
    state: "SD",
    city: "Pierre",
    lat: 44.37,
    lng: -100.35,
    species: ["Pheasant", "Whitetail", "Coyote"],
    phone: "(605) 224-5934",
    description:
      "Open hunting where the birds are big, fast, and wild. Guides are available when you want them.",
    amenities: ["Lodging", "Guides"],
    website: "http://www.huntthelen.com/",
  },
  {
    id: 4,
    name: "Glacial Lakes Fishing & Hunting Lodge",
    state: "SD",
    city: "Ortley",
    lat: 45.35,
    lng: -97.25,
    species: ["Waterfowl", "Pheasant", "Fishing"],
    phone: "(605) 520-4407",
    description:
      "Year-round lodge in northeastern South Dakota with apartment-style rooms and easy reach of the glacial lakes.",
    amenities: ["Lodging", "Meals", "WiFi"],
    website: "",
  },
  {
    id: 5,
    name: "Prairie Pothole Lodge",
    state: "ND",
    city: "Fullerton",
    lat: 46.15,
    lng: -98.05,
    species: ["Waterfowl", "Upland"],
    phone: "(701) 783-4545",
    description:
      "Waterfowl and upland packages in the prairie pothole country. All-inclusive 3-day, 4-night hunts.",
    amenities: ["Lodging", "Meals", "Guides", "Dogs"],
    website: "http://www.prairiepotholelodge.com/",
  },
  {
    id: 6,
    name: "Grass Lake Hunting Retreat",
    state: "SD",
    city: "Mansfield",
    lat: 45.25,
    lng: -98.55,
    species: ["Waterfowl", "Pheasant"],
    phone: "(605) 887-3362",
    description:
      "Sits on the Central Flyway. Ducks and geese stack into the two lakes by the thousands in season.",
    amenities: ["Lodging", "Private Water"],
    website: "",
  },
  {
    id: 7,
    name: "Ringneck Country Lodge",
    state: "SD",
    city: "Dimock",
    lat: 43.55,
    lng: -97.95,
    species: ["Pheasant", "Whitetail"],
    phone: "(605) 661-4277",
    description: "Pheasant hunting in the middle of South Dakota ringneck country.",
    amenities: ["Lodging", "Guides"],
    website: "",
  },
  {
    id: 8,
    name: "Thunderstik Lodge",
    state: "SD",
    city: "Chamberlain",
    lat: 43.81,
    lng: -99.33,
    species: ["Pheasant", "Waterfowl", "Deer"],
    phone: "(605) 234-5106",
    description:
      "Guided hunts on the Missouri River breaks, a short hop from Chamberlain.",
    amenities: ["Lodging", "Guides", "Meals"],
    website: "",
  },
  {
    id: 9,
    name: "Rieger Creek Lodge",
    state: "SD",
    city: "Selby",
    lat: 45.5,
    lng: -100.03,
    species: ["Pheasant", "Waterfowl"],
    phone: "(605) 845-8851",
    description: "Pheasant and waterfowl hunts out of a well-known north-central lodge.",
    amenities: ["Lodging", "Guides"],
    website: "",
  },
  {
    id: 10,
    name: "Double P Ranch",
    state: "SD",
    city: "Clark",
    lat: 44.88,
    lng: -97.73,
    species: ["Pheasant", "Whitetail"],
    phone: "(651) 357-2764",
    description: "Family ranch with upland birds and whitetail on private ground.",
    amenities: ["Lodging", "Private Land"],
    website: "",
  },
  {
    id: 11,
    name: "Eagle Pass Lodge",
    state: "SD",
    city: "Ree Heights",
    lat: 44.52,
    lng: -99.2,
    species: ["Pheasant", "Deer"],
    phone: "(605) 943-5666",
    description: "A quieter lodge with pheasant and deer hunting on private acres.",
    amenities: ["Lodging", "Guides"],
    website: "",
  },
  {
    id: 12,
    name: "Brown’s Lodge & Hunting Ranch",
    state: "SD",
    city: "Gettysburg",
    lat: 45.01,
    lng: -99.95,
    species: ["Pheasant", "Waterfowl", "Deer"],
    phone: "(605) 765-9150",
    description: "Ranch lodge known for mixed-bag prairie hunts west of the river.",
    amenities: ["Lodging", "Guides", "Meals"],
    website: "",
  },
  {
    id: 13,
    name: "High Plains Waterfowl Outfitter",
    state: "NE",
    city: "Thedford",
    lat: 41.98,
    lng: -100.58,
    species: ["Waterfowl", "Deer"],
    phone: "Contact via booking site",
    description:
      "Sandhills ranch ponds and cattail cover for high-plains waterfowl. Private land in the Nebraska Sandhills.",
    amenities: ["Private Land", "Lodging available"],
    website: "",
  },
];

export const STATE_LABEL: Record<Lodge["state"], string> = {
  SD: "South Dakota",
  ND: "North Dakota",
  NE: "Nebraska",
};

export function phoneHref(phone: string): string | null {
  const compact = phone.replace(/[^\d+]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `tel:${compact}`;
}
