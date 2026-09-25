import regionOptionsData from "@/data/regionOptions.json";

export interface RegionOptionGroup {
  province: string;
  cities: string[];
}

export const regionOptions = regionOptionsData as RegionOptionGroup[];

export const cityOptions = regionOptions.flatMap((group) =>
  group.cities.map((city) => ({
    province: group.province,
    city,
  })),
);
