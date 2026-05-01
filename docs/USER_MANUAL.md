# TrackSure User Manual

TrackSure helps teams manage share-related service cases, collect documents, track each stage of work, and generate required Word documents for Duplicate, Transmission, and Joint processes.

## 1. Application Overview

TrackSure is used to:

- Maintain client records
- Create and track cases for a client
- Upload and organize case documents
- Fill process forms
- Generate process-specific Word documents
- Track case stages from first client communication to closure
- Download generated, stage, and miscellaneous documents

## 2. Recommended Workflow

Use this sequence for every case:

1. Add or open the client.
2. Add the case with the correct case type.
3. Send the initial mail to the client.
4. Mark `Mail Sent to Client` as completed.
5. Upload client documents in `Client Docs Received`.
6. Mark `Client Docs Received` as completed.
7. Fill the process form.
8. Select required documents and generate them.
9. Continue uploading documents at each stage.
10. Mark each stage completed only after the required document is uploaded.

Important rule: upload the document first, then mark the stage as completed.

## 3. Client Management

### Add a Client

1. Go to the Dashboard.
2. Click `Add Client`.
3. Enter the required client details.
4. Save the client.

### Edit a Client

1. Open the client from the Dashboard.
2. Review the client information.
3. Use the edit option if available.
4. Update the details and save.

### Delete a Client

1. Open the client record.
2. Use the delete option if available.
3. Confirm only after checking that the client and case data are no longer required.

Deletion should be used carefully because client cases and documents may be important for audit or follow-up.

### Upload Client Files

1. Open the client or case area where uploads are available.
2. Click `Upload`.
3. Select one or more files.
4. Confirm that the file count or document list updates after upload.

Use clear file names before uploading, such as `PAN_ClientName.pdf` or `DeathCertificate.pdf`.

## 4. Case Management

### Add a Case

1. Open the client.
2. Click `Add Case`.
3. Enter the folio number.
4. Select the company.
5. Select the case type:
   - Duplicate
   - Transmission
   - Joint
6. Continue to the case form.

### Update a Case

1. Open the case from the client details page.
2. Review case details, form status, stages, and documents.
3. Use the available edit or form options to update information.

### Delete a Case

1. Open the case.
2. Use the delete option if available.
3. Confirm only after checking that documents and stage history are no longer needed.

### Fill Forms

1. Open the case.
2. Click `Fill Case Form` or `Edit Form`.
3. Complete all required fields.
4. Use `Save Draft` if the case is not ready for document generation.
5. Use `Generate Documents` after required stages are completed.

### Generate Documents

Document generation is available only after:

- `Mail Sent to Client` is completed
- `Client Docs Received` is completed

Steps:

1. Open the form.
2. Fill required information.
3. Select the required documents from the Documents section.
4. Click `Generate Documents` or `Update & Generate`.
5. Wait for the generating state to finish.
6. Return to case details and review the generated documents.

## 5. Case Stage Workflow

Case stages must be completed in order. Some stages require document uploads before they can be marked as done.

### Stage List

| Stage | What It Means | Document Guidance |
| --- | --- | --- |
| Mail Sent to Client | Initial communication has been sent to the client. | Upload is optional. Use it for email copy or proof if needed. |
| Client Docs Received | Client has shared initial required documents. | Upload received client documents before marking done. |
| Document Generated | System-generated documents are ready. | Documents are added automatically after generation. |
| Document Sent to Client | Generated documents have been sent to the client for signatures or review. | Upload email proof, courier proof, or sent document copy before marking done. |
| Document Received from Client | Signed or completed documents are received back from the client. | Upload signed forms and supporting documents before marking done. |
| Ops Review & Sign-off | Internal operations review is completed. | Upload reviewed packet, checklist, or sign-off proof before marking done. |
| Sent to Company/RTA | Final packet has been sent to company or RTA. | Upload courier receipt, email proof, or submission copy before marking done. |
| LOC/LOE Received | Letter of confirmation or entitlement has been received. | Upload received LOC/LOE before marking done. |
| IEPF Generated | IEPF documents have been generated, if applicable. | Upload is optional. |
| IEPF Submitted | IEPF submission is complete, if applicable. | Upload acknowledgement or submitted copy before marking done. |
| E-Verification Approved | E-verification is approved, if applicable. | Upload is optional. |
| Shares Credited | Shares have been credited. | Upload is optional, but proof is recommended. |
| Case Closed | Work is complete. | Upload is optional, but closure proof or final notes are recommended. |

### How to Upload Stage Documents

1. Open the case.
2. Go to `Case Stages`.
3. Find the correct stage.
4. Click `Upload`.
5. Select the file.
6. Wait for the upload to complete.
7. Confirm that the document count increases.

### How to Mark a Stage Completed

1. Upload the stage document first if the stage requires it.
2. Click `Mark as done`.
3. Confirm the stage now shows as done.

If `Mark as done` is disabled, check:

- Previous stages are completed
- Required document has been uploaded
- Any open query is resolved

### Queries

Queries can be opened after `Sent to Company/RTA` is completed and before `LOC/LOE Received` is completed.

To handle a query:

1. Click `Add Query`.
2. Enter query details.
3. Upload the query-related document.
4. Resolve the query after the response document is uploaded.

The case cannot move past certain later stages while a query is open.

## 6. Document Management

### Generated Documents

Generated documents are created from the selected process form and Word templates. They appear in the generated documents area after successful generation.

Use generated documents for forms and letters that must be sent to the client, company, RTA, or used in the case packet.

### Stage Documents

Stage documents are uploaded directly against a stage. Examples:

- Client submitted documents
- Signed forms
- Courier proofs
- RTA submission proofs
- LOC/LOE files
- IEPF acknowledgements

### Miscellaneous Documents

Use miscellaneous documents for supporting files that do not belong to a specific stage, such as reference notes or extra client communication.

### Download All

Use download-all options to export grouped documents:

- Generated documents
- All stage documents
- Documents for a specific stage

Before sharing a downloaded zip file, check that it contains the expected files.

## 7. Form Processes

### Duplicate Process

Use this when the shareholder needs duplicate share certificate related documents.

Information usually required:

- Shareholder details
- Contact details
- Bank details
- Securities information
- Company and RTA details
- Other information such as form date and face value

Documents may include Authorization Letter, Request Letter, ISR forms, SH-13, Form A, and Form B Indemnity.

### Transmission Process

Use this when shares need to be transmitted after the shareholder has passed away.

Information usually required:

- Legal heir details
- Shareholder information
- Date of demise where applicable
- Bank details for legal heir
- Securities information
- Company and RTA details

At least one shareholder name is required in the Shareholder Information section.

### Joint Process

Use this when the case requires the combined Joint process document set. It uses the same form structure as Transmission, but generates the Joint process templates.

Information usually required:

- Legal heir details
- Shareholder information
- Securities information
- Bank details
- Company and RTA details

Joint process documents include Authorization Letter, Request Letter, ISR1, SH-13, ISR4, FormA, FormB Indemnity, ISR5 Annexure C, Annexure D affidavits, and Annexure E indemnity.

## 8. Reset, Save, and Generate

### Save Draft

Use `Save Draft` when:

- Information is partially filled
- Required stages are not complete
- You want to return later

### Reset

Use `Reset` only when you want to clear the current form entries on screen and restore case defaults. A confirmation popup appears before reset.

### Generate or Update & Generate

Use this after:

- Required stages are complete
- Required form fields are filled
- Required documents are selected

The button shows a generating state while documents are being created.

## 9. Troubleshooting

### Generate Button Is Disabled

Check:

- `Mail Sent to Client` is completed
- `Client Docs Received` is completed
- Required form fields are filled correctly
- At least one shareholder name is entered for Transmission or Joint

### Stage Cannot Be Marked Done

Check:

- Previous stages are completed
- Required stage document is uploaded
- No open query is blocking progress

### Uploaded File Is Missing

Refresh the page. If still missing, upload the file again and confirm that the document count changes.

### Wrong Document Was Uploaded

Remove or replace the document if the option is available. If not, upload the correct file and clearly identify it by name.

### Generated Document Looks Incorrect

Check the form data and update it if needed. Then click `Update & Generate`.

## 10. Best Practices

- Use clear file names before uploading.
- Complete stages in order.
- Always upload the document first, then mark the stage complete.
- Save drafts when information is incomplete.
- Review selected documents before generation.
- Download and verify generated documents before sending them externally.
- Keep server windows open while using the application.
- Do not edit files inside the `data` folder manually unless instructed by a technical owner.
