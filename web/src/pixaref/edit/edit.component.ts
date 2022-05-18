import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { colorToHex, ImageDescriptor, isRef, Ref, Tag, toContrastingColor, toIndex, TransientRef, Type } from '@pixaref/core';
import { PixarefService } from '../pixaref.service';
import { ConfigService } from '../util/config.service';
import { NotificationService } from '../util/notification.service';
import { PixarefViewComponent } from '../view/view.component';


@Component({
  selector: 'pixaref-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class PixarefEditComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  readonly separators: number[];
  readonly mimes: string[];

  @ViewChild('tagInput')
  tagInput!: ElementRef;

  ref: Partial<Ref> = {};
  image?: ImageDescriptor;
  tags: Tag[] = [];
  types: Type[] = [];
  icons: { [name: string]: string | undefined } = {};

  new: boolean = true;
  filteredTags: Tag[] = [];
  preview?: SafeUrl | string;
  previewBackgroundColor = 'black';

  constructor(
    @Inject(MAT_DIALOG_DATA) ref: Ref,
    private pixarefService: PixarefService,
    private notificationService: NotificationService,
    private config: ConfigService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<PixarefEditComponent>,
    private sanitizer: DomSanitizer) {

    this.separators = this.config.separators;
    this.mimes = Object.keys(this.config.mimes);

    if (ref) {
      this.new = false;
      this.ref = ref;
      this.image = ref.image;
      this.preview = this.pixarefService.getThumbnailUrl(ref.image);
      this.previewBackgroundColor = colorToHex(toContrastingColor(ref.image.luminance));
    }

    this.dialogRef.disableClose = true;
  }

  selectFile(files: File[]): void {
    const [image] = files;
    const mime = image.type;
    const name = image.name;

    if (this.mimes.includes(mime)) {
      this.preview = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(image));

      this.pixarefService.addImage(image).subscribe((imageDescriptor) => {
        this.image = imageDescriptor;
        this.ref.title = this.ref.title || name.substring(0, name.lastIndexOf('.')) || name;

        this.notificationService.notify('Image uploaded');
      });
    } else {
      this.notificationService.notify(`Unsupported file type (${mime})`);
    }
  }

  view(): void {
    const url = this.image ? this.pixarefService.getImageUrl(this.image) : this.preview;

    this.dialog.open(PixarefViewComponent, {
      data: url,
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  open(): void {
    if (this.image) {
      const url = this.pixarefService.getImageUrl(this.image);

      window.open(url, '_blank');
    }
  }

  save(): void {
    if (this.new) {
      this.addRef();
    } else {
      this.updateRef();
    }
  }

  delete(): void {
    this.deleteRef();
  }

  // annoyingly cannot use matChipInputAddOnBlur due to this bug:
  // https://github.com/angular/components/issues/19279
  blurTag(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement
      && !(
        event.relatedTarget instanceof HTMLElement
        && event.relatedTarget.tagName === 'MAT-OPTION'
      )
    ) {
      const tag = event.target.value.trim();

      this.addTag(tag);
      this.clearTag();
    }
  }

  inputTag(event: MatChipInputEvent): void {
    const tag = (event.value || '').trim();

    event.chipInput!.clear();

    this.addTag(tag);
    this.clearTag();
  }

  selectTag(event: MatAutocompleteSelectedEvent): void {
    const tag = event.option.value.trim();

    this.addTag(tag);
    this.clearTag();
  }

  addRef(): void {
    if (this.image) {
      const transientRef: TransientRef = Object.assign({}, this.ref, { image: this.image });

      this.pixarefService.addRef(transientRef).subscribe(() => {
        this.notificationService.notify('Pixaref added');
        this.dialogRef.close();
      });
    } else {
      this.notificationService.notify('No image selected');
    }
  }

  updateRef(): void {
    const ref = Object.assign({}, this.ref, { image: this.image });

    if (isRef(ref)) {
      this.pixarefService.updateRef(ref).subscribe(() => {
        this.notificationService.notify('Pixaref updated');
        this.dialogRef.close();
      });
    }
  }

  deleteRef(): void {
    const ref = Object.assign({}, this.ref);

    if (isRef(ref)) {
      this.pixarefService.deleteRef(ref).subscribe(() => {
        this.notificationService.notify('Pixaref deleted');
        this.dialogRef.close();
      });
    }
  }

  addTag(tag: Tag): void {
    if (tag) {
      if (!this.hasTag(tag)) {
        this.ref.tags = this.ref.tags || [];
        this.ref.tags.push(tag);
      } else {
        this.notificationService.notify(`Tag ${tag} already present`);
      }
    }
  }

  removeTag(tag: Tag): void {
    if (this.ref.tags) {
      const index = this.ref.tags.indexOf(tag);

      if (index >= 0) {
        this.ref.tags.splice(index, 1);
      }
    }
  }

  hasTag(tag: Tag): boolean {
    return !!this.ref.tags?.includes(tag);
  }

  clearTag(): void {
    this.tagInput.nativeElement.value = '';
  }

  filterTags(value: string): void {
    this.filteredTags = value
      ? this.tags.filter(
        (tag) => !this.ref.tags?.includes(tag) && tag.toLowerCase().startsWith(value.toLowerCase())
      )
      : this.tags.slice();
  }

  getImageUrl(ref: Ref): string {
    return this.pixarefService.getImageUrl(ref.image);
  }

  ngOnInit(): void {
    this.pixarefService.allTags().subscribe((tags) => this.tags = tags);
    this.pixarefService.allTypes().subscribe((types) => {
      this.types = types;
      this.icons = toIndex(types, 'name', 'icon')
    });
  }
}
