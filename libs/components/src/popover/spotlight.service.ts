import { Injectable, OnDestroy } from "@angular/core";

/**
 * Service that manages spotlight effects for guided tours.
 * Creates a dimmed overlay around a target element with a visual cutout.
 * Blocks all clicks and traps focus in the tour dialog (view-only pattern).
 */
@Injectable({ providedIn: "root" })
export class SpotlightService implements OnDestroy {
  private backdropElement: HTMLElement | null = null;
  private borderElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private scrollListener: (() => void) | null = null;
  private currentElement: HTMLElement | null = null;
  private currentPadding = 8;
  private originalBodyOverflow = "";
  private originalBodyPaddingRight = "";

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
    this.lockScroll();
  }

  /**
   * Hides the current spotlight and cleans up resources
   */
  hide() {
    this.destroySpotlightScrim();
    this.cleanupListeners();
    this.unlockScroll();
    this.currentElement = null;
  }

  ngOnDestroy() {
    this.hide();
  }

  /**
   * Creates a simple full-page backdrop and border element for the spotlight effect.
   * The backdrop blocks all clicks, while the border element with box-shadow provides
   * the visual dimming effect with a cutout around the target element.
   */
  private createSpotlightScrim() {
    if (!this.currentElement) {
      return;
    }

    // Create single full-page backdrop that blocks all clicks
    this.backdropElement = document.createElement("div");
    this.backdropElement.style.cssText = `
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 1000;
      pointer-events: auto;
    `;
    this.backdropElement.setAttribute("data-spotlight-backdrop", "true");
    document.body.appendChild(this.backdropElement);

    // Create border element that visually respects the element's border-radius
    this.createBorderElement();
  }

  /**
   * Creates a visual overlay element that matches the target element's border-radius.
   * Uses box-shadow to create a dimmed effect that respects rounded corners,
   * layered above the backdrop for visual polish.
   */
  private createBorderElement() {
    if (!this.currentElement) {
      return;
    }

    const rect = this.currentElement.getBoundingClientRect();
    const padding = this.currentPadding;
    const computedStyle = window.getComputedStyle(this.currentElement);

    this.borderElement = document.createElement("div");
    this.borderElement.style.cssText = `
      position: fixed;
      left: ${rect.left - padding}px;
      top: ${rect.top - padding}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
      border-radius: ${computedStyle.borderRadius};
      box-shadow: 0 0 0 9999px #0D205633;
      z-index: 1001;
      pointer-events: none;
      transition: all 0.2s ease-out;
    `;
    this.borderElement.setAttribute("data-spotlight-border", "true");
    document.body.appendChild(this.borderElement);
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
   * Updates the border element position based on current element position.
   * Called when the element is resized or the page is scrolled.
   */
  private updateSpotlightScrim() {
    if (!this.borderElement || !this.currentElement) {
      return;
    }

    const rect = this.currentElement.getBoundingClientRect();
    const padding = this.currentPadding;
    const computedStyle = window.getComputedStyle(this.currentElement);

    const spotlightTop = rect.top - padding;
    const spotlightLeft = rect.left - padding;
    const spotlightWidth = rect.width + padding * 2;
    const spotlightHeight = rect.height + padding * 2;

    this.borderElement.style.left = `${spotlightLeft}px`;
    this.borderElement.style.top = `${spotlightTop}px`;
    this.borderElement.style.width = `${spotlightWidth}px`;
    this.borderElement.style.height = `${spotlightHeight}px`;
    this.borderElement.style.borderRadius = computedStyle.borderRadius;
  }

  /**
   * Removes backdrop and border element from the DOM
   */
  private destroySpotlightScrim() {
    this.backdropElement?.remove();
    this.backdropElement = null;

    this.borderElement?.remove();
    this.borderElement = null;
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

  /**
   * Locks body scroll and compensates for scrollbar width to prevent layout shift
   */
  private lockScroll() {
    // Save original values
    this.originalBodyOverflow = document.body.style.overflow;
    this.originalBodyPaddingRight = document.body.style.paddingRight;

    // Measure scrollbar width before hiding it
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Apply overflow hidden and compensate for scrollbar
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  /**
   * Unlocks body scroll and restores original styles
   */
  private unlockScroll() {
    document.body.style.overflow = this.originalBodyOverflow;
    document.body.style.paddingRight = this.originalBodyPaddingRight;
  }
}
