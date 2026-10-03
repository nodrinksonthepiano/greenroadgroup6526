export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DecorationMethod = "laser-engraved" | "full-color";

export type TreatmentCapability = {
  /** Show this control. A hidden treatment is not applied. */
  enabled: boolean;
  /** Starting value for a new product session. */
  defaultOn: boolean;
};

export type CustomizationVariant = {
  id: string;
  name: string;
  code: string;
  /** Swatch color published on the supplier page. */
  swatch: string;
};

export type DecorationArea = {
  id: string;
  /** Customer-facing placement name. */
  label: string;
  /** Supplier location name. */
  name: string;
  widthInches: number;
  heightInches: number;
  /** Supplier vignette id, when the blank comes from Scene7. */
  vignette?: string;
  /** Local blank render. Same framing for every recolored variant. */
  image: string;
  imageWidth: number;
  imageHeight: number;
  placement: NormalizedBox;
};

export type ProductCustomization = {
  slug: string;
  supplierItem: string;
  imprintCode?: string;
  locationId?: string;
  decoration: DecorationMethod;
  /**
   * When set, other variant swatches are recolored from this variant's blank.
   * Absent means each supplied render is shown as-is.
   */
  baseVariantCode?: string;
  colorLabel: string;
  removeLabel: string;
  /** Omit when the preview should not carry a treatment chip. */
  previewLabel?: string;
  treatments: {
    removeBackground: TreatmentCapability;
    invert: TreatmentCapability;
  };
  variants: CustomizationVariant[];
  areas: DecorationArea[];
};
