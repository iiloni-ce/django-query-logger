import {astVisitor, parseFirst} from 'pgsql-ast-parser'

type StatEntry = {
  count: number;
  totalDuration: number;
  averageDuration: number;
}

type Stats = Record<string, Record<string, StatEntry>>

// prevents TS errors
declare var self: Worker

const ignoreRe = /^(RELEASE )?SAVEPOINT ".+"$/

self.onmessage = ({data: {id, queries}}: MessageEvent<{id: number, queries: {sql: string, duration: number}[]}>) => {
  let currentType = ''
  let currentDuration = 0
  const results: Stats = {}

  const visitor = astVisitor(() => ({
    tableRef: ({name}) => {
      if (!results[currentType]) results[currentType] = {}
      if (!results[currentType][name]) {
        results[currentType][name] = {count: 0, totalDuration: 0, averageDuration: 0}
      }
      results[currentType][name].count++
      results[currentType][name].totalDuration += currentDuration
    },
  }))

  for (const {sql, duration} of queries) {
    try {
      if (!ignoreRe.test(sql)) {
        const ast = parseFirst(sql.replace(/^DECLARE "_django_curs_\d+_sync_\d+" NO SCROLL CURSOR WITH(OUT)? HOLD FOR /, ''))
        currentType = ast.type
        currentDuration = duration
        visitor.statement(ast)
      }
    } catch (e) {
      console.error(`Failed to process query '${sql}'`)
    } finally {
      // Send a null message for progress
      postMessage(null)
    }
  }

  for (const keyword of Object.keys(results)) {
    for (const table of Object.keys(results[keyword])) {
      results[keyword][table].averageDuration = results[keyword][table].totalDuration / results[keyword][table].count
    }
  }

  postMessage(results)
}
