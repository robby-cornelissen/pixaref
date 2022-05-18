import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { colorToHex, createIncludesStringPredicate, createMatchesStringPredicate, falsePredicate, Ref, Tag, toContrastingColor, toIndex } from '@pixaref/core';
import { PixarefService } from '../pixaref.service';
import { ConfigService } from '../util/config.service';

@Component({
  selector: 'pixaref-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class PixarefGalleryComponent implements OnInit {
  static readonly SMALL_SIZE = 240;
  static readonly STANDARD_SIZE = 360;
  static readonly LARGE_SIZE = 640;

  readonly mimes: { [mime: string]: { label: string }};

  @Input()
  refs: Ref[] = [];

  @Input()
  refsPerRow = 5;

  @Output()
  refSelected = new EventEmitter<Ref>();

  icons: { [name: string]: string | undefined } = {};

  titlePredicate: (title: string) => boolean = falsePredicate;
  typePredicate: (type: string) => boolean = falsePredicate;
  tagPredicate: (tag: Tag) => boolean = falsePredicate;

  constructor(private pixarefService: PixarefService, private config: ConfigService) {
    this.mimes = this.config.mimes;
  }

  select(ref: Ref) {
    this.refSelected.emit(ref);
  }

  toggleTitle(title: string) {
    if (!this.titlePredicate(title)) {
      this.pixarefService.setRefFilterTitle(title);
    } else {
      this.pixarefService.setRefFilterTitle(undefined);
    }
  }

  toggleType(type: string) {
    if (!this.typePredicate(type)) {
      this.pixarefService.setRefFilterType(type);
    } else {
      this.pixarefService.setRefFilterType(undefined);
    }
  }

  toggleTag(tag: Tag) {
    if (!this.tagPredicate(tag)) {
      this.pixarefService.addRefFilterTag(tag);
    } else {
      this.pixarefService.removeRefFilterTag(tag);
    }
  }

  getThumbnailUrl(ref: Ref) {
    return this.pixarefService.getThumbnailUrl(ref.image);
  }

  getThumbnailBackgroundColor(ref: Ref) {
    const color = toContrastingColor(ref.image.luminance);

    return colorToHex(color);
  }

  ngOnInit(): void {
    this.pixarefService.refFilter().subscribe(({ title, type, tags }) => {
      this.titlePredicate = title ? createMatchesStringPredicate(title) : falsePredicate;
      this.typePredicate = type ? createMatchesStringPredicate(type, false, false) : falsePredicate;
      this.tagPredicate = tags ? createIncludesStringPredicate(tags, false) : falsePredicate;
    });
    this.pixarefService.allTypes().subscribe((types) => this.icons = toIndex(types, 'name', 'icon'));
  }
}
