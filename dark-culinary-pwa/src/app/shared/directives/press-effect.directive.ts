import { Directive, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: '[appPressEffect]',
  standalone: true,
})
export class PressEffectDirective {
  @HostBinding('style.transition') transition = 'transform 180ms cubic-bezier(0.22, 0.61, 0.36, 1)';
  @HostBinding('style.transform') transform = 'scale(1)';

  @HostListener('pointerdown')
  onPointerDown(): void {
    this.transform = 'scale(0.98)';
  }

  @HostListener('pointerup')
  @HostListener('pointerleave')
  onPointerUp(): void {
    this.transform = 'scale(1)';
  }
}

