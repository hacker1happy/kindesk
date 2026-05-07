# KinDesk Startup & User Guide

KinDesk helps teams manage share-related service cases, collect documents, track stage progress, and generate Word documents for Duplicate, Transmission, and Joint workflows.

## 1. Start The Application

Run:

```powershell
.\start.bat
```

Open:

```text
http://127.0.0.1:5173
```

Keep the KinDesk control console open while using the application. Closing that console stops both the backend and frontend servers.


## 2. Dashboard

Use the Dashboard to:

- View total clients, total cases, and active cases
- Search clients by name, ID, or phone
- Filter clients by assigned team members
- Open client details
- Add a new client

Actions:

- `+ Add Client`: opens the client creation page.
- `Clear Filters`: resets search and assignment filters.
- `View Details`: opens the selected client.
- Pagination controls: move through large client lists.

## 3. Add Client

Required fields:

- Client name
- Phone number in `+91XXXXXXXXXX` format
- Assigned To
- Assigned From

Optional fields:

- Comment
- Initial client documents

Upload rules:

- Allowed types: `.pdf`, `.docx`, `.xlsx`, `.jpeg`, `.jpg`, `.png`, `.txt`
- Default size limit: 10 MB per file
- Same filename cannot be uploaded again for the same client

## 4. Client Details

Use Client Details to:

- Review client contact and assignment information
- Edit client information
- Delete the client after ID confirmation
- Upload, open, download, and remove client documents
- View all cases for the client
- Add a case

Client document actions:

- `+ Upload`: add allowed client files.
- `Open`: open a stored file in a browser tab.
- `Download`: download a stored file.
- `Remove`: delete a selected client file after confirmation.

## 5. Add Case

Required fields:

- Folio number
- Company, searched from `kindesk_companies.xlsx`
- Case type: Duplicate, Transmission, or Joint

Company and RTA details are resolved from:

- `companies_master` sheet
- `rta_master` sheet

After creating a case, open `View Details` from the client case list.

## 6. Case Details

Case Details has three tabs:

- `Case Stages`
- `Documents`
- `Form`

The header shows client info, case ID, folio, company, case type, creation date, and current status.

## 7. Case Stages

Stages must be completed in order. If a button is disabled, check that previous stages and required uploads are complete.

Main stage flow:

| Stage | Purpose | Typical Action |
| --- | --- | --- |
| Mail Sent to Client | Initial client communication | Mark done after communication is sent |
| Client Docs Received | Client submitted documents | Upload files, then mark done |
| Document Generated | System documents are generated | Created from the Form tab |
| Document Sent to Client | Generated packet sent to client | Mark done after sending |
| Document Received from Client | Signed documents returned | Mark done when received |
| Ops Review & Sign-off | Internal review | Fill and submit Ops Review form |
| Sent to Company/RTA | Packet sent to company/RTA | Upload required submission and POD files |
| LOC Received | LOC workflow branch | Upload LOC proof |
| LOE Received | LOE workflow branch | Upload LOE proof |
| IEPF Generated | IEPF documents ready | Mark done if applicable |
| IEPF Submitted | IEPF submission done | Upload required submission and POD files |
| E-Verification | Approve or reject e-verification | Approve or reject with comment |
| Shares Credited | Final credit complete | Mark done when confirmed |
| Case Closed | Case finished | Close with reason if not fully successful |

E-Verification rule:

- `Reject` is available only while the next stage is not completed.
- If `Shares Credited` is completed, revert it first before rejecting E-Verification.

Queries:

- Queries can be opened after `Sent to Company/RTA`.
- Only one query can remain open at a time.
- Upload a query document before resolving the query.
- Later stages remain blocked while a query is open.

Ops Review:

- Use `Fill Form`.
- Answer all checklist questions.
- Save as draft or submit.

Revert:

- Only the latest completed stage can be reverted.
- Reverting clears documents and decision data for that stage and later stages in the workflow.

## 8. Documents Tab

Use Documents to manage case-level files grouped by stage, query, and miscellaneous files.

Actions:

- `Download All`: downloads all stage/query documents as a zip.
- Stage `Upload` or `Add`: upload files to an upload-enabled stage.
- `Open`: open the file in the browser.
- `Download`: download a single file.
- `Replace`: replace a file while preserving required document metadata.
- `Remove`: remove a document when stage rules allow it.
- `Miscellaneous Files + Upload`: add supporting files that do not belong to a stage.

Duplicate prevention:

- A filename already used in any stage, query, or miscellaneous file cannot be uploaded again in the same case.
- Replacing a document with its own filename is allowed.

## 9. Form Tab

Use the Form tab to enter process information and generate Word documents.

Generation is available after:

- `Mail Sent to Client` is completed
- `Client Docs Received` is completed

Common form actions:

- `Save Draft`: keep partial form data.
- `Reset`: clear current on-screen form entries after confirmation.
- `Generate Documents` or `Update & Generate`: produce selected Word files.

Duplicate Process information:

- Shareholder details
- Contact and bank details
- Securities information
- Company and RTA details
- Document selection

Transmission and Joint Process information:

- Legal heir details
- Shareholder information
- Date of demise where applicable
- Securities and bank details
- Company and RTA details
- Document selection

## 10. Upload Policy

Allowed file extensions:

```text
.pdf, .docx, .xlsx, .jpeg, .jpg, .png, .txt
```

Default maximum size:

```text
10 MB per file
```

The limit is configurable through `TRACKSURE_MAX_UPLOAD_MB` before backend startup.

## 11. Recommended Workflow

1. Add or open a client.
2. Add a case with the correct case type.
3. Mark `Mail Sent to Client` when initial communication is sent.
4. Upload client documents in `Client Docs Received`.
5. Fill the process form.
6. Generate required documents.
7. Progress stages in order.
8. Open/resolve Company/RTA queries if they occur.
9. Complete LOC or LOE branch.
10. Complete IEPF/E-Verification steps if applicable.
11. Mark shares credited or close with a reason.

## 12. Best Practices

- Rename files clearly before upload.
- Avoid generic names such as `scan.pdf`.
- Upload proof before marking required stages done.
- Use replace when correcting a required document.
- Review generated documents before sending externally.
- Use Download All before external sharing or archival.
- Keep the KinDesk control console open while working.
