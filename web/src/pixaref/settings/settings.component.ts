import { Component, OnInit } from '@angular/core';
import { isTransientType, isType, TransientType, Type } from '@pixaref/core';
import { PixarefService } from '../pixaref.service';
import { NotificationService } from '../util/notification.service';

@Component({
  selector: 'pixaref-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class PixarefSettingsComponent implements OnInit {
  private static BLANK_TYPE = () => ({ name: '' });

  types: Type[] = [];
  type: TransientType = PixarefSettingsComponent.BLANK_TYPE();

  constructor(
    private pixarefService: PixarefService,
    private notificationService: NotificationService
  ) { }

  save(type: Type | TransientType): void {
    if (isType(type)) {
      this.updateType(type);
    } else if (isTransientType(type)) {
      this.addType(type);
    }

    this.reset();
  }

  delete(type: Type): void {
    this.deleteType(type);
  }

  reset(): void {
    this.type = PixarefSettingsComponent.BLANK_TYPE();
  }

  addType(type: TransientType): void {
    this.pixarefService.addType(type).subscribe(() => {
      this.notificationService.notify('Type added');
    });
  }

  updateType(type: Type): void {
    this.pixarefService.updateType(type).subscribe(() => {
      this.notificationService.notify('Type updated');
    });
  }

  deleteType(type: Type): void {
    this.pixarefService.deleteType(type).subscribe(() => {
      this.notificationService.notify('Type deleted');
    });
  }

  ngOnInit(): void {
    this.pixarefService.allTypes().subscribe((types) => this.types = types);
  }
}
