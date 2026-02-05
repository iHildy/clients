/** Identifies a specific step in the coachmark tour */
export type CoachmarkStepId = "importData" | "addItem" | "shareWithCollections" | "monitorSecurity";

/** Configuration for a single coachmark step */
export interface CoachmarkStep {
  /** Unique identifier for this step */
  id: CoachmarkStepId;

  /** Title displayed in the coachmark popover */
  titleKey: string;

  /** Description/content displayed in the coachmark popover */
  descriptionKey: string;

  /** Position of the popover relative to the anchor */
  position: "above-center" | "below-center" | "left-center" | "right-center";

  /** Optional URL for "Learn more" link */
  learnMoreUrl?: string;

  /** Whether this step is only shown to organizational users */
  requiresOrganization?: boolean;
}

/** All available coachmark steps in display order */
export const COACHMARK_STEPS: CoachmarkStep[] = [
  {
    id: "importData",
    titleKey: "coachmarkImportTitle",
    descriptionKey: "coachmarkImportDescription",
    position: "right-center",
    learnMoreUrl: "https://bitwarden.com/help/import-data/",
  },
  {
    id: "addItem",
    titleKey: "coachmarkAddItemTitle",
    descriptionKey: "coachmarkAddItemDescription",
    position: "below-center",
    learnMoreUrl: "https://bitwarden.com/help/managing-items/",
  },
  {
    id: "shareWithCollections",
    titleKey: "coachmarkShareWithCollectionsTitle",
    descriptionKey: "coachmarkShareWithCollectionsDescription",
    position: "right-center",
    learnMoreUrl: "https://bitwarden.com/help/about-collections/",
    requiresOrganization: true,
  },
  {
    id: "monitorSecurity",
    titleKey: "coachmarkMonitorSecurityTitle",
    descriptionKey: "coachmarkMonitorSecurityDescription",
    position: "right-center",
    learnMoreUrl: "https://bitwarden.com/help/reports/",
  },
];
