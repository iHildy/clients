import { Injectable, OnDestroy } from "@angular/core";

/**
 * Service that manages spotlight effects for guided tours.
 * Creates a dimmed overlay with a cutout around a target element,
 * blocking clicks outside the highlighted area.
 */
@Injectable({ providedIn: "root" })
export class SpotlightService implements OnDestroy {
  private scrimPanels: HTMLElement[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private scrollListener: (() => void) | null = null;
  private currentElement: HTMLElement | null = null;
  private currentPadding = 8;

  /**
   * Shows a spotlight around the specified element
   * @param element - The element to highlight
   * @param padding - Padding around the element in pixels (default: 8)
   */
  show(element: HTMLElement, padding = 8) {
    // Clean up any existing spotlight first
    this.hide();

    this.currentElement = element;
    this.currentPadding = padding;

    this.createSpotlightScrim();
    this.setupListeners();
  }

  /**
   * Hides the current spotlight and cleans up resources
   */
  hide() {
    this.destroySpotlightScrim();
    this.cleanupListeners();
    this.currentElement = null;
  }

  ngOnDestroy() {
    this.hide();
  }

  /**
   * Creates the four scrim panels that surround the highlighted element
   */
  private createSpotlightScrim() {
    if (!this.currentElement) {
      return;
    }

    const rect = this.currentElement.getBoundingClientRect();
    const padding = this.currentPadding;

    // Calculate spotlight bounds with padding
    const spotlightTop = rect.top - padding;
    const spotlightLeft = rect.left - padding;
    const spotlightRight = rect.right + padding;
    const spotlightBottom = rect.bottom + padding;
    const spotlightHeight = rect.height + padding * 2;

    // Create four panels that cover everything except the spotlight area
    const top = this.createScrimPanel("0", "0", "100vw", `${spotlightTop}px`);
    const right = this.createScrimPanel(
      `${spotlightRight}px`,
      `${spotlightTop}px`,
      `calc(100vw - ${spotlightRight}px)`,
      `${spotlightHeight}px`,
    );
    const bottom = this.createScrimPanel(
      "0",
      `${spotlightBottom}px`,
      "100vw",
      `calc(100vh - ${spotlightBottom}px)`,
    );
    const left = this.createScrimPanel(
      "0",
      `${spotlightTop}px`,
      `${spotlightLeft}px`,
      `${spotlightHeight}px`,
    );

    this.scrimPanels = [top, right, bottom, left];
  }

  /**
   * Creates a single scrim panel element
   */
  private createScrimPanel(left: string, top: string, width: string, height: string): HTMLElement {
    const panel = document.createElement("div");
    panel.style.cssText = `
      position: fixed;
      left: ${left};
      top: ${top};
      width: ${width};
      height: ${height};
      background: #0D205633;
      z-index: 1000;
      pointer-events: auto;
      transition: all 0.2s ease-out;
    `;
    panel.setAttribute("data-spotlight-scrim", "true");
    document.body.appendChild(panel);
    return panel;
  }

  /**
   * Sets up resize and scroll listeners to keep spotlight positioned correctly
   */
  private setupListeners() {
    if (!this.currentElement) {
      return;
    }

    // Set up resize observer to update scrim positions
    this.resizeObserver = new ResizeObserver(() => {
      this.updateSpotlightScrim();
    });
    this.resizeObserver.observe(this.currentElement);

    // Set up scroll listener
    this.scrollListener = () => {
      this.updateSpotlightScrim();
    };
    window.addEventListener("scroll", this.scrollListener, true);
  }

  /**
   * Updates the positions of all scrim panels based on current element position
   */
  private updateSpotlightScrim() {
    if (this.scrimPanels.length !== 4 || !this.currentElement) {
      return;
    }

    const rect = this.currentElement.getBoundingClientRect();
    const padding = this.currentPadding;

    const spotlightTop = rect.top - padding;
    const spotlightLeft = rect.left - padding;
    const spotlightRight = rect.right + padding;
    const spotlightBottom = rect.bottom + padding;
    const spotlightHeight = rect.height + padding * 2;

    const [top, right, bottom, left] = this.scrimPanels;

    // Update top panel
    top.style.height = `${spotlightTop}px`;

    // Update right panel
    right.style.left = `${spotlightRight}px`;
    right.style.top = `${spotlightTop}px`;
    right.style.width = `calc(100vw - ${spotlightRight}px)`;
    right.style.height = `${spotlightHeight}px`;

    // Update bottom panel
    bottom.style.top = `${spotlightBottom}px`;
    bottom.style.height = `calc(100vh - ${spotlightBottom}px)`;

    // Update left panel
    left.style.top = `${spotlightTop}px`;
    left.style.width = `${spotlightLeft}px`;
    left.style.height = `${spotlightHeight}px`;
  }

  /**
   * Removes all scrim panels from the DOM
   */
  private destroySpotlightScrim() {
    this.scrimPanels.forEach((panel) => {
      panel.remove();
    });
    this.scrimPanels = [];
  }

  /**
   * Cleans up resize observer and scroll listeners
   */
  private cleanupListeners() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener, true);
      this.scrollListener = null;
    }
  }
}
