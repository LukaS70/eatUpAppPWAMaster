import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { Platform } from '@ionic/angular';
const { LocalNotifications } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  /* constructor(
    private platform: Platform
  ) { }

  public scheduleReminderNotification() {
    LocalNotifications.schedule({
      notifications: [
        {
          title: 'Reminder',
          body: 'This is a reminder',
          id: 1
        }
      ]
    });
  }

  public scheduleAddNotification() {
    console.log('HERE');
    if ((this.platform.is('mobile') && !this.platform.is('hybrid')) || this.platform.is('desktop')) { // ako vaze ovi uslovi, desktip je
    } else {
      LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'ADD_KCAL',
            actions: [
              {
                id: 'view',
                title: 'Open App'
              },
              {
                id: 'remove',
                title: 'Dismiss',
                destructive: true
              },
              {
                id: 'add',
                title: 'Add calories',
                input: true
              }
            ]
          }
        ]
      }).then(() => {
        LocalNotifications.schedule({
          notifications: [
            {
              title: 'Reminder!',
              body: 'Don\'t forget to add eaten calories to eatUpApp.',
              id: 2,
              actionTypeId: 'ADD_KCAL',
              schedule: {
                repeats: true,
                every: 'hour',
                on: {
                  minute: 30
                }
              }
            }
          ]
        });
      });
    }
  } */
}
