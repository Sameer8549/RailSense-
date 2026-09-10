# RailSense AI Team Walkthrough

This document explains how the passenger and staff apps work end to end so the team can demo, debug, and extend the system without guessing.

## Passenger Flow

1. Open the passenger PWA at `https://railsense-60074625517.development.catalystserverless.in/app/index.html`.
2. The user describes the issue by typing or tapping the microphone. The microphone control shows active listening and loading states so the user can tell when speech is being captured.
3. The user can attach ticket media by camera or upload. PNG/JPG/PDF ticket inputs are processed to extract PNR, train number, coach, seat/berth, and route details when the text is readable.
4. The user can attach photo evidence. Evidence is stored as part of the complaint payload and is returned to staff views.
5. On submit, `submitComplaint` writes the structured complaint to Catalyst Data Store and returns a complaint ID.
6. The tracking screen calls `trackComplaint`, which searches by direct row ID and by complaint IDs nested inside the stored payload.

## Staff Flow

1. Open the staff console at `https://railsense-60074625517.development.catalystserverless.in/app/staff/index.html`.
2. Select a TTE or admin role.
3. The queue polls the Catalyst backend and sorts latest live complaints first.
4. Opening a complaint shows passenger context, route/ticket fields, attached evidence, severity, and AI recommended next steps.
5. Closing a complaint returns to the queue without leaving an empty detail panel.
6. Staff actions call `staffApi` and update the complaint timeline:
   - Verify confirms the complaint has been reviewed.
   - Resolve closes it with staff notes.
   - Escalate promotes the case to a higher response level.
   - Add note records operational context without changing the main status.
   - Assign routes the case to a staff owner or team.

## Real-Time Behavior

The apps use polling against Catalyst functions instead of mock-only state. Passenger submissions become visible to staff after the next staff refresh cycle. Staff actions are written back through the backend and reflected in the queue state.

Demo incidents can still appear to keep the interface rich, but live complaints are clearly handled through Catalyst. Demo-only actions are applied locally so they do not create backend `not_found` errors.

## Evidence Handling

Passenger image evidence is sent in the complaint payload and normalized by `staffApi` into an `evidence.images` array. Staff views render the image URL/data URL from that normalized structure. Ticket uploads and evidence uploads are kept separate:

- Ticket media is used for extraction.
- Evidence media is shown to TTE/admin for proof and context.

## AI Services

The backend expects provider keys as Zoho Catalyst function environment variables:

- `GROQ_API_KEY` for reasoning, summaries, and structured assistant output.
- `SARVAM_API_KEY` for Indian-language speech/voice features.
- `NVIDIA_NIM_API_KEY` for vision extraction support.

The frontend never stores these keys. If provider output fails, the server should return a readable fallback instead of crashing the passenger or staff screen.

## Catalyst Services Used

- Web Client Hosting for passenger and staff apps.
- Serverless Functions for all API surfaces.
- Data Store for complaints, history, and staff action records.
- Environment Variables for protected AI provider keys.

## Demo Script

1. Install/open the passenger PWA.
2. Upload a ticket image or PDF and show auto-filled travel fields.
3. Record or type a complaint.
4. Attach a photo evidence image.
5. Submit and copy the complaint ID.
6. Track the complaint from the passenger app.
7. Open staff console and show the complaint at the top of the TTE/admin queue.
8. Open the complaint, show evidence, AI guidance, and route details.
9. Verify, add note, escalate, and resolve while showing the timeline update.

## Troubleshooting

- If the app shows Catalyst's default "page doesn't exist" message, open `/app/index.html` for passenger or `/app/staff/index.html` for staff.
- If staff cannot find a complaint, check `trackComplaint` and `staffApi` ID normalization paths.
- If evidence is missing, inspect the complaint payload for image data and the normalized `evidence.images` response.
- If voice or vision stops working after deploy, check Catalyst function environment variables first. Empty local `env_variables` blocks can overwrite remote values, so use `tools/restore-catalyst-function-env.ps1`.
- If deploy output is stale, verify the live HTML references the newest built asset hash.
