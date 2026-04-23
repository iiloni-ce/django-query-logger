import {Component, OnDestroy} from '@angular/core'
import {MatButtonModule} from '@angular/material/button'
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog'
import {MatProgressBarModule} from '@angular/material/progress-bar'
import {Subscription} from 'rxjs'
import {WebSocketService} from '../web-socket.service'
import {StatEntry, Stats} from '../types'
import {DecimalPipe, KeyValue, KeyValuePipe, NgForOf, UpperCasePipe} from '@angular/common'
import {MatCardModule} from '@angular/material/card'
import {ElapsedPipe} from '../elapsed.pipe'

@Component({
  selector: 'app-stats-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, MatProgressBarModule, KeyValuePipe, NgForOf, UpperCasePipe, MatCardModule, DecimalPipe, ElapsedPipe],
  templateUrl: './stats-dialog.component.html',
  styleUrls: ['./stats-dialog.component.scss'],
})
export class StatsDialogComponent implements OnDestroy {
  stats: Stats | undefined
  statsProgress = 0
  private progressSubscription: Subscription | undefined
  private subscription: Subscription | undefined

  constructor(private webSocketService: WebSocketService) {
    this.progressSubscription = this.webSocketService.statsProgress$.subscribe({
      next: ([completed, total]) => this.statsProgress = completed / total * 100,
      error: (error) => console.error('Error in receiving stats progress:', error),
    })

    this.subscription = this.webSocketService.stats$.subscribe({
      next: (stats) => this.stats = stats,
      error: (error) => console.error('Error in receiving stats:', error),
    })

    this.webSocketService.sendMessage({action: 'stats'})
  }

  ngOnDestroy() {
    this.progressSubscription?.unsubscribe()
    this.subscription?.unsubscribe()
  }

  sortTables = (a: KeyValue<string, StatEntry>, b: KeyValue<string, StatEntry>): number => {
    return a.value.count === b.value.count ? a.key.localeCompare(b.key) : b.value.count - a.value.count
  }
}
