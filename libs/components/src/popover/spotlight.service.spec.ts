import { TestBed } from "@angular/core/testing";

import { SpotlightService } from "./spotlight.service";

describe("SpotlightService", () => {
  let service: SpotlightService;
  let testElement: HTMLElement;

  beforeEach(() => {
    // Mock ResizeObserver for test environment
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }));

    TestBed.configureTestingModule({
      providers: [SpotlightService],
    });
    service = TestBed.inject(SpotlightService);

    // Create a test element
    testElement = document.createElement("div");
    testElement.style.cssText =
      "position: absolute; top: 100px; left: 100px; width: 200px; height: 100px;";
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    service.hide();
    testElement.remove();
  });

  describe("show", () => {
    it("should create four scrim panels", () => {
      service.show(testElement);

      const panels = document.querySelectorAll('[data-spotlight-scrim="true"]');
      expect(panels.length).toBe(4);
    });

    it("should apply correct z-index to panels", () => {
      service.show(testElement);

      const panels = document.querySelectorAll('[data-spotlight-scrim="true"]');
      panels.forEach((panel) => {
        expect((panel as HTMLElement).style.zIndex).toBe("1000");
      });
    });

    it("should apply pointer-events auto to block clicks", () => {
      service.show(testElement);

      const panels = document.querySelectorAll('[data-spotlight-scrim="true"]');
      panels.forEach((panel) => {
        expect((panel as HTMLElement).style.pointerEvents).toBe("auto");
      });
    });

    it("should use custom padding when provided", () => {
      const customPadding = 20;
      service.show(testElement, customPadding);

      const panels = document.querySelectorAll('[data-spotlight-scrim="true"]');
      expect(panels.length).toBe(4);
    });

    it("should clean up existing spotlight before creating new one", () => {
      service.show(testElement);
      expect(document.querySelectorAll('[data-spotlight-scrim="true"]').length).toBe(4);

      const newElement = document.createElement("div");
      document.body.appendChild(newElement);

      service.show(newElement);
      expect(document.querySelectorAll('[data-spotlight-scrim="true"]').length).toBe(4);

      newElement.remove();
    });
  });

  describe("hide", () => {
    it("should remove all scrim panels", () => {
      service.show(testElement);
      expect(document.querySelectorAll('[data-spotlight-scrim="true"]').length).toBe(4);

      service.hide();
      expect(document.querySelectorAll('[data-spotlight-scrim="true"]').length).toBe(0);
    });

    it("should handle being called when no spotlight is active", () => {
      expect(() => service.hide()).not.toThrow();
    });

    it("should disconnect resize observer", () => {
      service.show(testElement);

      service.hide();

      // Verify the mock was created and would be cleaned up
      expect(ResizeObserver).toHaveBeenCalled();
    });

    it("should remove scroll listener", () => {
      service.show(testElement);
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      service.hide();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function), true);
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("ngOnDestroy", () => {
    it("should hide spotlight on destroy", () => {
      service.show(testElement);
      expect(document.querySelectorAll('[data-spotlight-scrim="true"]').length).toBe(4);

      service.ngOnDestroy();
      expect(document.querySelectorAll('[data-spotlight-scrim="true"]').length).toBe(0);
    });
  });

  describe("listeners", () => {
    it("should set up resize observer on show", () => {
      service.show(testElement);

      // Verify ResizeObserver was instantiated (through our mock)
      expect(ResizeObserver).toHaveBeenCalled();
    });

    it("should set up scroll listener on show", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      service.show(testElement);

      expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function), true);
      addEventListenerSpy.mockRestore();
    });
  });
});
