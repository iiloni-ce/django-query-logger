# Initial Concept
This tool allows you to stream the queries that are being executed in realtime from a Django application for review, profiling, filtering, formatting, and analysis.

## Target Audience
- Django developers and backend engineers.
- Database administrators optimizing query performance.

## Key Features
- **Realtime Query Streaming**: Captures queries directly from Django's logging socket handler.
- **Query Formatting & Highlighting**: Formats SQL queries for readability.
- **Profiling & Analysis**: Provides execution time and query statistics.
- **Filtering**: Allows users to find specific queries easily.

## Architecture & Technology
- **Backend**: Fastify running on Bun, utilizing WebSockets to stream data to the frontend.
- **Frontend**: Angular UI with Angular Material.
- **Data Ingestion**: Parses Python pickle data from Django socket logger.