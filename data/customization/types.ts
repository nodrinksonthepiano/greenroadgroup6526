export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CustomizationVariant = {
  id: string;
  name: string;
  code: string;
  /** Swatch color published on the ADG product page and studio. */
  swatch: string;
};

export type DecorationArea = {
  id: string;
  name: string;
  method: "laser-engraved";
  widthInches: number;
  heightInches: number;
  vignette: string;
  /** Local copy of the public Scene7 vignette. Same framing for every color. */
  image: string;
  imageWidth: number;
  imageHeight: number;
  placement: NormalizedBox;
};

export type ProductCustomization = {
  slug: string;
  supplierItem: string;
  imprintCode: string;
  locationId: string;
  maxColorCount: 1;
  variants: CustomizationVariant[];
  areas: DecorationArea[];
};
