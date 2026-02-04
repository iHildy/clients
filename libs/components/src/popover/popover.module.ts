import { NgModule } from "@angular/core";

import { PopoverAnchorDirective } from "./popover-anchor.directive";
import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";
import { PopoverComponent } from "./popover.component";
import { SpotlightService } from "./spotlight.service";

@NgModule({
  imports: [PopoverComponent, PopoverAnchorDirective, PopoverTriggerForDirective],
  exports: [PopoverComponent, PopoverAnchorDirective, PopoverTriggerForDirective],
  providers: [SpotlightService],
})
export class PopoverModule {}
