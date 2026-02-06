import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { AccountInfo, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { UserId } from "@bitwarden/common/types/guid";
import { StateProvider } from "@bitwarden/state";

import { CoachmarkStep } from "./coachmark-step";
import { CoachmarkService } from "./coachmark.service";

// Mock the coachmark-step module with test-specific steps (inline due to jest.mock hoisting)
jest.mock("./coachmark-step", () => ({
  COACHMARK_STEPS: [
    {
      id: "importData",
      titleKey: "step1Title",
      descriptionKey: "step1Description",
      position: "right-center",
      learnMoreUrl: "https://example.com/step1",
      route: "/route1",
    },
    {
      id: "addItem",
      titleKey: "step2Title",
      descriptionKey: "step2Description",
      position: "below-center",
      learnMoreUrl: "https://example.com/step2",
      route: "/route2",
    },
    {
      id: "shareWithCollections",
      titleKey: "step3Title",
      descriptionKey: "step3Description",
      position: "left-center",
      learnMoreUrl: "https://example.com/step3",
      requiresOrganization: true,
      route: "/route3",
    },
    {
      id: "monitorSecurity",
      titleKey: "step4Title",
      descriptionKey: "step4Description",
      position: "above-center",
      learnMoreUrl: "https://example.com/step4",
      route: "/route4",
    },
  ],
}));

// Re-define TEST_STEPS for use in test assertions (must match mock above)
const TEST_STEPS: CoachmarkStep[] = [
  {
    id: "importData",
    titleKey: "step1Title",
    descriptionKey: "step1Description",
    position: "right-center",
    learnMoreUrl: "https://example.com/step1",
    route: "/route1",
  },
  {
    id: "addItem",
    titleKey: "step2Title",
    descriptionKey: "step2Description",
    position: "below-center",
    learnMoreUrl: "https://example.com/step2",
    route: "/route2",
  },
  {
    id: "shareWithCollections",
    titleKey: "step3Title",
    descriptionKey: "step3Description",
    position: "left-center",
    learnMoreUrl: "https://example.com/step3",
    requiresOrganization: true,
    route: "/route3",
  },
  {
    id: "monitorSecurity",
    titleKey: "step4Title",
    descriptionKey: "step4Description",
    position: "above-center",
    learnMoreUrl: "https://example.com/step4",
    route: "/route4",
  },
];

describe("CoachmarkService", () => {
  let service: CoachmarkService;
  let accountService: jest.Mocked<AccountService>;
  let organizationService: jest.Mocked<OrganizationService>;
  let stateProvider: jest.Mocked<StateProvider>;
  let i18nService: jest.Mocked<I18nService>;
  let router: jest.Mocked<Router>;

  const mockUserId = "user-123" as UserId;
  const mockAccount = {
    id: mockUserId,
    email: "test@example.com",
    emailVerified: true,
    name: "Test User",
  };

  // Derive test data from our mock steps
  const allSteps = TEST_STEPS;
  const stepsWithoutOrgRequirement = allSteps.filter((s) => !s.requiresOrganization);
  const firstStep = allSteps[0];
  const secondStep = stepsWithoutOrgRequirement[1];
  const lastStepWithoutOrg = stepsWithoutOrgRequirement[stepsWithoutOrgRequirement.length - 1];

  beforeEach(() => {
    accountService = {
      activeAccount$: new BehaviorSubject(mockAccount),
    } as unknown as jest.Mocked<AccountService>;

    organizationService = {
      hasOrganizations: jest.fn(),
    } as unknown as jest.Mocked<OrganizationService>;

    stateProvider = {
      getUserState$: jest.fn().mockReturnValue(of(false)),
      setUserState: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<StateProvider>;

    i18nService = {
      t: jest.fn((key: string) => `translated_${key}`),
    } as unknown as jest.Mocked<I18nService>;

    router = {
      navigate: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<Router>;

    service = new CoachmarkService(
      accountService,
      organizationService,
      stateProvider,
      i18nService,
      router,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("startTour", () => {
    it("should not start if already running", async () => {
      organizationService.hasOrganizations.mockReturnValue(of(false));
      await service.startTour();
      const initialStepId = service.activeStepId();

      await service.startTour();

      expect(service.activeStepId()).toBe(initialStepId);
    });

    it("should not start if no active account", async () => {
      (accountService.activeAccount$ as BehaviorSubject<AccountInfo | null>).next(null);

      await service.startTour();

      expect(service.isRunning()).toBe(false);
    });

    it("should not start if tour was already completed", async () => {
      stateProvider.getUserState$ = jest.fn().mockReturnValue(of(true));

      await service.startTour();

      expect(service.isRunning()).toBe(false);
    });

    it("should start tour for user without organizations", async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));

      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;

      expect(service.isRunning()).toBe(true);
      expect(service.activeStepId()).toBe(firstStep.id);
      expect(service.totalSteps()).toBe(stepsWithoutOrgRequirement.length);
      expect(service.currentStepNumber()).toBe(1);
    });

    it("should start tour for user with organizations", async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(true));

      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;

      expect(service.isRunning()).toBe(true);
      expect(service.totalSteps()).toBe(allSteps.length);
    });

    it("should navigate to the first step's route", async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));

      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;

      if (firstStep.route) {
        expect(router.navigate).toHaveBeenCalledWith([firstStep.route]);
      }
    });
  });

  describe("nextStep", () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));
      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;
    });

    it("should advance to the next step", async () => {
      expect(service.activeStepId()).toBe(firstStep.id);

      const nextPromise = service.nextStep();
      await jest.runAllTimersAsync();
      await nextPromise;

      expect(service.activeStepId()).toBe(secondStep.id);
      expect(service.currentStepNumber()).toBe(2);
    });

    it("should navigate to the next step's route", async () => {
      router.navigate.mockClear();

      const nextPromise = service.nextStep();
      await jest.runAllTimersAsync();
      await nextPromise;

      if (secondStep.route) {
        expect(router.navigate).toHaveBeenCalledWith([secondStep.route]);
      }
    });

    it("should complete the tour on the last step", async () => {
      // Navigate to the last step
      for (let i = 0; i < stepsWithoutOrgRequirement.length - 1; i++) {
        const promise = service.nextStep();
        await jest.runAllTimersAsync();
        await promise;
      }

      expect(service.activeStepId()).toBe(lastStepWithoutOrg.id);

      // Next should complete
      const promise = service.nextStep();
      await jest.runAllTimersAsync();
      await promise;

      expect(service.isRunning()).toBe(false);
      expect(service.activeStepId()).toBeNull();
    });

    it("should do nothing if not running", async () => {
      await service.completeTour();

      await service.nextStep();

      expect(service.isRunning()).toBe(false);
    });
  });

  describe("previousStep", () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));
      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;

      // Go to step 2
      const nextPromise = service.nextStep();
      await jest.runAllTimersAsync();
      await nextPromise;
    });

    it("should go back to the previous step", async () => {
      expect(service.activeStepId()).toBe(secondStep.id);

      const prevPromise = service.previousStep();
      await jest.runAllTimersAsync();
      await prevPromise;

      expect(service.activeStepId()).toBe(firstStep.id);
      expect(service.currentStepNumber()).toBe(1);
    });

    it("should navigate to the previous step's route", async () => {
      router.navigate.mockClear();

      const prevPromise = service.previousStep();
      await jest.runAllTimersAsync();
      await prevPromise;

      if (firstStep.route) {
        expect(router.navigate).toHaveBeenCalledWith([firstStep.route]);
      }
    });

    it("should do nothing on the first step", async () => {
      // Go back to step 1
      let promise = service.previousStep();
      await jest.runAllTimersAsync();
      await promise;

      expect(service.activeStepId()).toBe(firstStep.id);

      // Try to go back again
      promise = service.previousStep();
      await jest.runAllTimersAsync();
      await promise;

      expect(service.activeStepId()).toBe(firstStep.id);
    });

    it("should do nothing if not running", async () => {
      await service.completeTour();

      await service.previousStep();

      expect(service.isRunning()).toBe(false);
    });
  });

  describe("completeTour", () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));
      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;
    });

    it("should reset activeStepId to null", async () => {
      await service.completeTour();

      expect(service.activeStepId()).toBeNull();
    });

    it("should set isRunning to false", async () => {
      await service.completeTour();

      expect(service.isRunning()).toBe(false);
    });

    it("should reset totalSteps to 0", async () => {
      await service.completeTour();

      expect(service.totalSteps()).toBe(0);
    });
  });

  describe("isStepOpen", () => {
    it("should return a computed that tracks the active step", async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));

      const firstStepOpen = service.isStepOpen(firstStep.id);
      const secondStepOpen = service.isStepOpen(secondStep.id);

      expect(firstStepOpen()).toBe(false);
      expect(secondStepOpen()).toBe(false);

      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;

      expect(firstStepOpen()).toBe(true);
      expect(secondStepOpen()).toBe(false);

      const nextPromise = service.nextStep();
      await jest.runAllTimersAsync();
      await nextPromise;

      expect(firstStepOpen()).toBe(false);
      expect(secondStepOpen()).toBe(true);
    });
  });

  describe("setStepOpen", () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      organizationService.hasOrganizations.mockReturnValue(of(false));
      const startPromise = service.startTour();
      await jest.runAllTimersAsync();
      await startPromise;
    });

    it("should not allow opening a step directly", () => {
      service.setStepOpen(secondStep.id, true);

      expect(service.activeStepId()).toBe(firstStep.id);
    });

    it("should complete tour when closing the active step", async () => {
      service.setStepOpen(firstStep.id, false);

      // Need to wait for completeTour to finish
      await Promise.resolve();

      expect(service.isRunning()).toBe(false);
    });
  });

  describe("getStepConfig", () => {
    it("should return the step configuration", () => {
      const config = service.getStepConfig(firstStep.id);

      expect(config).toBeDefined();
      expect(config?.id).toBe(firstStep.id);
      expect(config?.titleKey).toBe(firstStep.titleKey);
    });

    it("should return undefined for invalid step ID", () => {
      const config = service.getStepConfig("invalidStep" as any);

      expect(config).toBeUndefined();
    });
  });

  describe("getStepTitle", () => {
    it("should return translated title", () => {
      const title = service.getStepTitle(firstStep.id);

      expect(i18nService.t).toHaveBeenCalledWith(firstStep.titleKey);
      expect(title).toBe(`translated_${firstStep.titleKey}`);
    });

    it("should return empty string for invalid step", () => {
      const title = service.getStepTitle("invalidStep" as any);

      expect(title).toBe("");
    });
  });

  describe("getStepDescription", () => {
    it("should return translated description", () => {
      const description = service.getStepDescription(firstStep.id);

      expect(i18nService.t).toHaveBeenCalledWith(firstStep.descriptionKey);
      expect(description).toBe(`translated_${firstStep.descriptionKey}`);
    });

    it("should return empty string for invalid step", () => {
      const description = service.getStepDescription("invalidStep" as any);

      expect(description).toBe("");
    });
  });

  describe("getStepLearnMoreUrl", () => {
    it("should return the learn more URL", () => {
      const url = service.getStepLearnMoreUrl(firstStep.id);

      expect(url).toBe(firstStep.learnMoreUrl);
    });

    it("should return undefined for invalid step", () => {
      const url = service.getStepLearnMoreUrl("invalidStep" as any);

      expect(url).toBeUndefined();
    });
  });

  describe("getStepPosition", () => {
    it("should return the step position", () => {
      const position = service.getStepPosition(firstStep.id);

      expect(position).toBe(firstStep.position);
    });

    it("should return undefined for invalid step", () => {
      const position = service.getStepPosition("invalidStep" as any);

      expect(position).toBeUndefined();
    });
  });
});
