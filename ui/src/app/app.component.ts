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
import {Subscription} from 'rxjs'
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
  // Pagination
  pageSize = 20
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined
  @ViewChild(MatSort) sort: MatSort | undefined
  private subscription: Subscription | undefined

  constructor(
    private dialog: MatDialog,
    private webSocketService: WebSocketService,
  ) {
    this.dataSource.filterPredicate = (query, filterJSON) => {
      if (!filterJSON) return true
      const {inclusive, exclusive} = JSON.parse(filterJSON)
      const sql = query.sql.toLowerCase()
      const matchesInclusive = (inclusive as string[]).every(f => sql.includes(f))
      const matchesExclusive = !(exclusive as string[]).some(f => sql.includes(f))
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

    this.subscription = this.webSocketService.queries$.subscribe({
      next: (queries) => {
        this.dataSource.data = this.dataSource.data.concat(queries)
        this.updateElapsedTime()
      },
      error: (error) => console.error('Error in receiving messages:', error),
    })
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
    this.webSocketService.close()
  }

  updateElapsedTime() {
    if (this.dataSource.filteredData.length > 1) {
      this.elapsedTime = this.dataSource.filteredData[this.dataSource.filteredData.length - 1].timestamp - this.dataSource.filteredData[0].timestamp
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
    delete this.selectedQuery
    this.updateElapsedTime()
    this.webSocketService.sendMessage({action: 'clear'})
  }

  showSql(query: Query) {
    this.selectedQuery = query
    this.sidenavOpened = true
  }

  applyFilters() {
    if (this.inclusiveFilters.size || this.exclusiveFilters.size) {
      this.dataSource.filter = JSON.stringify({
        inclusive: [...this.inclusiveFilters].map(f => f.toLowerCase()),
        exclusive: [...this.exclusiveFilters].map(f => f.toLowerCase()),
      })
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
}
