import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ButtonModule, IconModule, LinkModule, TypographyModule } from "@bitwarden/components";

/**
 * Coachmark component for tour steps.
 * Designed to be used inside a bit-popover with bitPopoverAnchor directive.
 */
@Component({
  selector: "app-coachmark",
  standalone: true,
  imports: [CommonModule, JslibModule, ButtonModule, IconModule, LinkModule, TypographyModule],
  templateUrl: "coachmark.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachmarkComponent {
  readonly description = input("");
  readonly currentStep = input(1);
  readonly totalSteps = input(1);
  readonly learnMoreUrl = input<string | undefined>(undefined);

  readonly back = output<void>();
  readonly next = output<void>();
}
