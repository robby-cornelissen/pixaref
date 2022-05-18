import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[pixarefDragAndDrop]'
})
export class DragAndDropDirective {
  @HostBinding('class.dragging') dragging: boolean = false;

  @Output() fileDropped = new EventEmitter<any>();

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.dragging = false;
  }

  @HostListener('drop', ['$event']) public onDrop(event: DragEvent ) {
    event.preventDefault();
    event.stopPropagation();
    
    this.dragging = false;

    const files = event.dataTransfer?.files;

    if (files?.length) {
      this.fileDropped.emit(files);
    }
  }
}
