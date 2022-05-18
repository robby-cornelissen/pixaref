import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) { }

  notify(message: string, duration = 2000) {
    this.snackBar.open(message, 'Dismiss', {
      duration: 2000
    });
  }
}
