import { SESSION_RECORDINGS_TOOL } from "./tools.js";

export const RECORDING_INSTRUCTIONS = `
### Session Recordings Tool: \`${SESSION_RECORDINGS_TOOL}\`
Lists Microsoft Clarity session recordings with metadata including session links, duration, and user interaction timelines.

**Parameters:**
- filters: Optional filters for sessions (date range, device type, etc.)
- sortBy: Sort option using SortOptions enum (default: SessionStart_DESC)
- count: Number of sessions to retrieve (1-250, default: 100)

**Sort Options:**
- SessionStart_DESC (newest first - default)
- SessionStart_ASC (oldest first)
- SessionDuration_ASC (shortest duration first)
- SessionDuration_DESC (longest duration first)
- SessionClickCount_ASC (fewest clicks first)
- SessionClickCount_DESC (most clicks first)
- PageCount_ASC (fewest pages first)
- PageCount_DESC (most pages first)

**Example Usage:**
- Get 10 newest sessions: { "count": 10, "sortBy": "SessionStart_DESC" }
- Get 20 longest sessions from date range: { "filters": { "date": { "start": "2024-01-01T00:00:00.000Z", "end": "2024-01-31T23:59:59.999Z" } }, "sortBy": "SessionDuration_DESC", "count": 20 }
- Get 15 mobile sessions with most clicks: { "filters": { "deviceType": ["Mobile"] }, "sortBy": "SessionClickCount_DESC", "count": 15 }
- Get oldest sessions first: { "sortBy": "SessionStart_ASC", "count": 100 }
- Get sessions with most page views: { "sortBy": "PageCount_DESC", "count": 100 }
`;
