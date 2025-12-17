# Architecture Overview

## System Integration

```
┌─────────────────────────────────────────────────────────────┐
│              Restro24 Cloud API (.NET)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PrintAgentController                                 │  │
│  │  POST /api/printagent/register                        │  │
│  │  POST /api/printagent/poll                            │  │
│  │  POST /api/printagent/complete                        │  │
│  │  POST /api/printagent/fail                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PrintQueueService                                    │  │
│  │  - Enqueues jobs when orders created                  │  │
│  │  - Assigns jobs to agents                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database                                             │  │
│  │  - PrintAgents (registered agents)                    │  │
│  │  - PrintJobs (queued jobs)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS REST API
                          │ (Polling every 10s)
                          │
┌─────────────────────────┴─────────────────────────────────┐
│         Android Print Agent (React Native/Expo)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent Service                                        │  │
│  │  1. Register agent                                    │  │
│  │  2. Poll for jobs (loop)                             │  │
│  │  3. Process each job                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Printer Service                                     │  │
│  │  - TCP connection to printer:9100                    │  │
│  │  - Send ESC/POS content                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Background Services                                 │  │
│  │  - Foreground service (notification)                 │  │
│  │  - Background fetch (periodic wake)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ TCP Port 9100
                          │ (Raw ESC/POS)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Network ESC/POS Printer                        │
│              (Kitchen or Bar Printer)                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Order Creation → Print Job Enqueued

```
User creates order in Restro24
    ↓
CreateOrderCommand executes
    ↓
PrintOrderTicketCommand called
    ↓
PrintQueueService.EnqueuePrintJobAsync()
    ↓
PrintJob created in database (Status = Pending)
```

### 2. Agent Polls → Job Assigned

```
Android Agent (every 10s)
    ↓
POST /api/printagent/poll
    ↓
Server queries PrintJobs (Status = Pending, RestaurantId = X)
    ↓
Server assigns jobs to agent (AssignedAgentId, Status = Processing)
    ↓
Returns jobs[] to agent
```

### 3. Agent Prints → Job Completed

```
Agent receives job
    ↓
Extract printer IP (Kitchen=0 → printerIpKitchen)
    ↓
TCP connect to printer:9100
    ↓
Send job.content (ESC/POS bytes)
    ↓
POST /api/printagent/complete (on success)
    ↓
Server updates PrintJob (Status = Completed)
```

## Component Responsibilities

### Agent Service
- **Registration**: Register/update agent with cloud API
- **Polling**: Continuously poll for new jobs
- **Orchestration**: Coordinate job processing flow
- **Error Handling**: Retry logic, error reporting

### Printer Service
- **Connection**: TCP socket to printer
- **Transport**: Send bytes to printer
- **Error Handling**: Connection timeouts, network errors

### API Client
- **HTTP Communication**: All REST API calls
- **Authentication**: API key headers
- **Error Handling**: Network errors, HTTP errors

### Configuration
- **Persistence**: Save/load config from AsyncStorage
- **Validation**: Ensure required fields present
- **Defaults**: Provide sensible defaults

### Background Services
- **Foreground Service**: Keep app alive (Android requirement)
- **Background Fetch**: Periodic wake-up when app backgrounded
- **Auto-start**: Restart on device boot

## Key Design Patterns

### 1. Polling Pattern
- **Why**: No need for WebSockets, works behind firewalls
- **How**: Continuous polling loop with configurable interval
- **Trade-off**: Slight delay (up to poll interval) vs simplicity

### 2. Queue-Based Processing
- **Why**: Decouples order creation from printing
- **How**: Server enqueues, agents poll and process
- **Benefit**: Multiple agents can process jobs, retries automatic

### 3. Stateless Agent
- **Why**: Simpler, more reliable
- **How**: No local job queue, always polls server
- **Benefit**: Single source of truth (server), easier debugging

### 4. Background Service Pattern
- **Why**: Android kills background apps aggressively
- **How**: Foreground service + background fetch
- **Benefit**: App continues running even when backgrounded

## Error Handling Strategy

### Registration Failures
- **Retry**: 5 attempts with 30s delay
- **After Max**: Continue retrying every 5 minutes
- **Impact**: Agent won't receive jobs until registered

### Polling Failures
- **Strategy**: Swallow errors, continue polling
- **Reason**: Network may be temporarily unavailable
- **Impact**: Jobs delayed but not lost (server retries)

### Print Failures
- **Strategy**: Report failure to server immediately
- **Reason**: Server handles retries, other agents can process
- **Impact**: Job marked failed, can be retried by any agent

### Printer Connection Failures
- **Strategy**: Report failure, continue with next job
- **Reason**: Printer may be offline temporarily
- **Impact**: Job failed, server can retry later

## Security Considerations

### API Authentication
- **Method**: API key in `X-API-Key` header
- **Storage**: AsyncStorage (encrypted on device)
- **Risk**: Low (local network, same as Windows service)

### SSL/TLS
- **Challenge**: Self-signed certificates not trusted by default
- **Solution**: Install certificate on device or use CA-signed cert
- **Risk**: Medium (man-in-the-middle if HTTP used)

### Network Printing
- **Method**: Raw TCP to printer IP
- **Security**: None (local network only)
- **Risk**: Low (local network, no internet exposure)

## Performance Characteristics

### Polling Interval
- **Default**: 10 seconds
- **Impact**: Up to 10s delay from order creation to print
- **Trade-off**: Lower interval = more battery/network usage

### Background Fetch
- **Minimum**: 15 minutes (Android system limit)
- **Impact**: If app killed, jobs delayed up to 15 minutes
- **Mitigation**: Foreground service prevents app from being killed

### Network Usage
- **Per Poll**: ~1-2 KB (HTTP request/response)
- **Per Hour**: ~360-720 KB (36 polls/hour)
- **Impact**: Negligible on Wi-Fi

## Scalability

### Multiple Agents
- **Supported**: Yes, multiple agents per restaurant
- **Behavior**: Jobs distributed to available agents
- **Use Case**: Multiple tablets, redundancy

### High Volume
- **Limitation**: Polling interval (10s) creates bottleneck
- **Solution**: Reduce poll interval or add more agents
- **Current**: Handles typical restaurant volume easily

### Network Latency
- **Impact**: Minimal (local network printing)
- **Bottleneck**: Cloud API response time
- **Typical**: <100ms for API calls, <50ms for printer

