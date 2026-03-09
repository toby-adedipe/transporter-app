# Shipment Feedback Schema

## Purpose
This document captures the proposed request payload for the shipment feedback feature so the mobile form, API contract, validation rules, and mapping logic can all target the same shape.

## Canonical Payload
Use this as the baseline schema for feedback submission:

```jsonc
{
  "shipmentNumber": "4001122334", // Unique shipment identifier
  "feedbackDate": "2026-03-04", // Date feedback was captured
  "driverFeedbackText": "Trip completed without incidents", // Driver's trip summary/comments
  "otherInformationText": "Customer offload queue was long", // Extra operational details not covered elsewhere
  "delayAtCustomer": true, // Whether there was delay at the customer location
  "tamperingObserved": false, // Whether product/seal/device tampering was observed
  "distanceCovered": 142.5, // Known trip distance covered
  "unknownDistanceCovered": 3.2, // Distance not fully accounted for / uncertain distance
  "driverScoreOnArrival": 85, // Numeric score assigned to driver on arrival
  "driverArrivalRating": "GREEN", // Arrival rating: GREEN, AMBER, or RED
  "driverBehaviour": "COMPLIANT", // Driver behaviour assessment/classification
  "remedialAction": "NONE", // Corrective/remedial action required or applied
  "otherRemarks": "No issue", // Free-text closing remark
  "consequenceDue": false, // Whether disciplinary/consequence action is due
  "hosHoursManual": 9.5, // Manual Hours of Service value if auto-generation is unavailable
  "violationsTotalManual": 1, // Manual total number of violations
  "violationsOsManual": 1, // Manual over-speeding violation count
  "manualOverrideReason": "Auto source unavailable" // Reason manual values were supplied instead of generated metrics
}
```

## Field Definitions
| Field | Type | Notes |
|---|---|---|
| `shipmentNumber` | `string` | Primary shipment reference. |
| `feedbackDate` | `string` | ISO date in `YYYY-MM-DD` format. |
| `driverFeedbackText` | `string` | Main driver feedback summary. |
| `otherInformationText` | `string` | Supplemental operational notes. |
| `delayAtCustomer` | `boolean` | `true` if the customer site caused delay. |
| `tamperingObserved` | `boolean` | `true` if any tampering was observed. |
| `distanceCovered` | `number` | Known trip distance. |
| `unknownDistanceCovered` | `number` | Uncertain or unaccounted-for distance. |
| `driverScoreOnArrival` | `number` | Arrival score value. |
| `driverArrivalRating` | `"GREEN" \| "AMBER" \| "RED"` | Arrival traffic-light rating. |
| `driverBehaviour` | `string` | Behaviour classification. |
| `remedialAction` | `string` | Remediation or corrective action taken. |
| `otherRemarks` | `string` | Closing remark or summary note. |
| `consequenceDue` | `boolean` | Whether a consequence or disciplinary follow-up is due. |
| `hosHoursManual` | `number` | Manual HOS value when auto data is unavailable. |
| `violationsTotalManual` | `number` | Total manual violation count. |
| `violationsOsManual` | `number` | Manual overspeed count. |
| `manualOverrideReason` | `string` | Why manual metrics were used. |

## Implementation Notes
- Treat this payload as the baseline create-request contract for the feedback feature.
- `driverArrivalRating` should be constrained to `GREEN`, `AMBER`, or `RED`.
- Numeric manual fields should accept decimals only where the business meaning allows it. Based on this schema, `hosHoursManual`, `distanceCovered`, and `unknownDistanceCovered` can be fractional, while violation counts should be integers.
- `feedbackDate` should be stored and transmitted as an ISO date string, not a locale-formatted date.

## Current App Delta
The in-progress mobile implementation currently includes a few extra fields not present in this baseline schema:

- `logon`
- `consequenceApplied`
- `violationsHbManual`
- `violationsHaManual`
- `violationsCdManual`

If this document is the source of truth, those extra fields should be treated as out of scope unless product or backend requirements explicitly add them to the contract.
