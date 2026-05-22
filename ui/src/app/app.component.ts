import {COMMA, ENTER} from '@angular/cdk/keycodes'
import {DecimalPipe} from '@angular/common'
import {AfterViewInit, Component, OnDestroy, OnInit, TrackByFunction, ViewChild} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {MatButtonModule} from '@angular/material/button'
import {MatChipEditedEvent, MatChipInputEvent, MatChipsModule} from '@angular/material/chips'
import {MatDialog} from '@angular/material/dialog'
import {MatFormFieldModule} from '@angular/material/form-field'
import {MatIconModule} from '@angular/material/icon'
import {MatInputModule} from '@angular/material/input'
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator'
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatSort, MatSortModule} from '@angular/material/sort'
import {MatTableDataSource, MatTableModule} from '@angular/material/table'
import {Highlight} from 'ngx-highlightjs'
import {Subscription, bufferTime, filter} from 'rxjs'
import {ElapsedPipe} from './elapsed.pipe'
import {SidenavComponent} from './sidenav/sidenav.component'
import {StatsDialogComponent} from './stats-dialog/stats-dialog.component'
import {TimestampPipe} from './timestamp.pipe'
import {Query} from './types'
import {WebSocketService} from './web-socket.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DecimalPipe,
    ElapsedPipe,
    FormsModule,
    Highlight,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
    SidenavComponent,
    TimestampPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit, OnDestroy, OnInit {
  dataSource = new MatTableDataSource<Query>()
  displayedColumns = ['id', 'timestamp', 'duration', 'sql']
  elapsedTime = 0
  selectedQuery: Query | undefined
  sidenavOpened = false
  // Filters
  readonly separatorKeysCodes = [ENTER, COMMA] as const
  inclusiveFilters: Set<string> = new Set()
  exclusiveFilters: Set<string> = new Set()
  private inclusiveRegexes: RegExp[] = []
  private exclusiveRegexes: RegExp[] = []
  // Pagination
  pageSize = 20
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined
  @ViewChild(MatSort) sort: MatSort | undefined
  private subscription: Subscription | undefined
  private knownIds = new Set<number>()
  private readonly MAX_QUERIES = 5000

  constructor(
    private dialog: MatDialog,
    private webSocketService: WebSocketService,
  ) {
    this.dataSource.filterPredicate = (query) => {
      const sql = query.sql
      const matchesInclusive = this.inclusiveRegexes.every(re => re.test(sql))
      const matchesExclusive = !this.exclusiveRegexes.some(re => re.test(sql))
      return matchesInclusive && matchesExclusive
    }
  }

  trackById: TrackByFunction<Query> = (_index: number, {id}: Query): number => id

  ngOnInit() {
    this.loadFilters()
    this.loadPageSize()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator ?? null
    this.dataSource.sort = this.sort ?? null

    this.subscription = this.webSocketService.queries$.pipe(
      bufferTime(200),
      filter(batches => batches.length > 0),
    ).subscribe({
      next: (batches) => {
        const flattened = batches.flat()
        const newQueries = flattened.filter(q => !this.knownIds.has(q.id))

        if (newQueries.length > 0) {
          newQueries.forEach(q => this.knownIds.add(q.id))
          const updatedData = this.dataSource.data.concat(newQueries)

          if (updatedData.length > this.MAX_QUERIES) {
            const removed = updatedData.splice(0, updatedData.length - this.MAX_QUERIES)
            removed.forEach(q => this.knownIds.delete(q.id))
          }

          this.dataSource.data = updatedData
          this.updateElapsedTime()
        }
      },
      error: (error) => console.error('Error in receiving messages:', error),
    })
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
    this.webSocketService.close()
  }

  updateElapsedTime() {
    const data = this.dataSource.filter ? this.dataSource.filteredData : this.dataSource.data
    if (data.length > 1) {
      this.elapsedTime = data[data.length - 1].timestamp - data[0].timestamp
    } else {
      this.elapsedTime = 0
    }
  }

  stats() {
    this.dialog.open(StatsDialogComponent, {
      maxWidth: '80vw',
    })
  }

  download() {
    const jsonString = JSON.stringify(this.dataSource.filteredData, null, 2)
    const blob = new Blob([jsonString], {type: 'application/json'})
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'queries.json'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }

  clear() {
    this.sidenavOpened = false
    this.dataSource.data = []
    this.knownIds.clear()
    delete this.selectedQuery
    this.updateElapsedTime()
    this.webSocketService.sendMessage({action: 'clear'})
  }

  showSql(query: Query) {
    this.selectedQuery = query
    this.sidenavOpened = true
  }

  applyFilters() {
    this.inclusiveRegexes = [...this.inclusiveFilters].map(f => new RegExp(this.escapeRegExp(f), 'i'))
    this.exclusiveRegexes = [...this.exclusiveFilters].map(f => new RegExp(this.escapeRegExp(f), 'i'))

    if (this.inclusiveFilters.size || this.exclusiveFilters.size) {
      this.dataSource.filter = 'active'
    } else {
      this.dataSource.filter = ''
    }
    this.saveFilters()
    this.updateElapsedTime()
    this.dataSource.paginator?.firstPage()
  }

  addFilter(event: MatChipInputEvent, type: 'inclusive' | 'exclusive') {
    const newFilter = event.value.trim()

    if (newFilter) {
      if (type === 'inclusive') {
        this.inclusiveFilters.add(newFilter)
      } else {
        this.exclusiveFilters.add(newFilter)
      }
      this.applyFilters()
    }
    event.chipInput.clear()
  }

  editFilter(previousFilter: string, event: MatChipEditedEvent, type: 'inclusive' | 'exclusive') {
    const newFilter = event.value.trim()

    if (newFilter !== previousFilter) {
      this.removeFilter(previousFilter, type)
      if (newFilter) {
        if (type === 'inclusive') {
          this.inclusiveFilters.add(newFilter)
        } else {
          this.exclusiveFilters.add(newFilter)
        }
      }
      this.applyFilters()
    }
  }

  removeFilter(filter: string, type: 'inclusive' | 'exclusive') {
    if (type === 'inclusive') {
      this.inclusiveFilters.delete(filter)
    } else {
      this.exclusiveFilters.delete(filter)
    }
    this.applyFilters()
  }

  clearFilters() {
    this.inclusiveFilters.clear()
    this.exclusiveFilters.clear()
    this.applyFilters()
  }

  onPageEvent(event: PageEvent) {
    this.pageSize = event.pageSize
    this.savePageSize()
  }

  private saveFilters() {
    localStorage.setItem('inclusiveFilters', JSON.stringify([...this.inclusiveFilters]))
    localStorage.setItem('exclusiveFilters', JSON.stringify([...this.exclusiveFilters]))
  }

  private loadFilters() {
    const inclusive = localStorage.getItem('inclusiveFilters')
    const exclusive = localStorage.getItem('exclusiveFilters')

    if (inclusive) {
      this.inclusiveFilters = new Set(JSON.parse(inclusive))
    }
    if (exclusive) {
      this.exclusiveFilters = new Set(JSON.parse(exclusive))
    }

    if (inclusive || exclusive) {
      this.applyFilters()
    }
  }

  private savePageSize() {
    localStorage.setItem('pageSize', this.pageSize.toString())
  }

  private loadPageSize() {
    const pageSize = localStorage.getItem('pageSize')
    if (pageSize) {
      this.pageSize = parseInt(pageSize, 10)
    }
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

