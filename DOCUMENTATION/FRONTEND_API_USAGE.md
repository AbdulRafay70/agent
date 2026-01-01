# 📡 FRONTEND BOOKING API USAGE - Complete Documentation

## Overview
This document shows exactly how the frontend is calling the `/api/bookings/` endpoint, including:
- Request method and headers
- Payload structure with example data
- Authentication flow
- Error handling

---

## 🔐 AUTHENTICATION

### Step 1: Login and Get Token
```http
POST https://api.saer.pk/api/token/
Content-Type: application/json

{
  "username": "agent1@panel.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Frontend stores:**
- `localStorage.setItem('agentAccessToken', access_token)`

### Step 2: Get User Organization Data
```http
GET https://api.saer.pk/api/users/{user_id}/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response extract:**
```json
{
  "id": 43,
  "organization_details": [13],
  "agency_details": [{ "id": 27, "name": "ABC Agency" }],
  "branch_details": [{ "id": 23, "name": "Main Branch" }]
}
```

**Frontend extracts and stores:**
```javascript
const agentOrgData = {
  ids: [13],           // organization IDs
  user_id: 43,         // user ID
  agency_id: 27,       // agency ID
  branch_id: 23        // branch ID
};
localStorage.setItem('agentOrganization', JSON.stringify(agentOrgData));
```

---

## 📤 BOOKING CREATION REQUEST

### HTTP Request Details
```http
POST https://api.saer.pk/api/bookings/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Headers (Axios)
```javascript
{
  'Authorization': 'Bearer ' + localStorage.getItem('agentAccessToken'),
  'Content-Type': 'application/json'
}
```

---

## 📦 PAYLOAD STRUCTURE

### Complete Payload Example (What We Send)
```json
{
  "organization": 13,
  "branch": 23,
  "agency_id": 27,
  "umrah_package": 17,
  "total_pax": 2,
  "total_adult": 2,
  "total_child": 0,
  "total_infant": 0,
  "status": "Pending",
  "internal_notes_id": 35,
  "client_note": "Customer prefers ground floor rooms",
  "person_details": [
    {
      "first_name": "Abdul Moiz",
      "last_name": "Ahmed",
      "passport_number": "AB1234567",
      "date_of_birth": "2025-11-03",
      "age_group": "adult",
      "contact_number": "03222939981",
      "is_family_head": true,
      "person_title": "Mr",
      "passpoet_issue_date": "2025-11-04",
      "passport_expiry_date": "2025-11-06",
      "country": "Pakistan",
      "is_visa_included": true,
      "ticket_included": true
    },
    {
      "first_name": "Fatima",
      "last_name": "Ahmed",
      "passport_number": "AB7654321",
      "date_of_birth": "2025-11-05",
      "age_group": "adult",
      "contact_number": "03111111111",
      "is_family_head": false,
      "person_title": "Mrs",
      "passpoet_issue_date": "2025-10-26",
      "passport_expiry_date": "2025-11-04",
      "country": "Pakistan",
      "is_visa_included": true,
      "ticket_included": true
    }
  ],
  "payment_details": [
    {
      "amount": 74000,
      "method": "cash",
      "date": "2025-11-05",
      "status": "pending",
      "reference_number": "First payment"
    }
  ]
}
```

### Minimal Payload Example (Without Optional Fields)
```json
{
  "organization": 13,
  "branch": 23,
  "agency_id": 27,
  "umrah_package": 17,
  "total_pax": 1,
  "total_adult": 1,
  "total_child": 0,
  "total_infant": 0,
  "status": "Pending",
  "person_details": [
    {
      "first_name": "Abdul Moiz",
      "last_name": "Ahmed",
      "passport_number": "AB1234567",
      "date_of_birth": "2025-11-03",
      "age_group": "adult",
      "contact_number": "03222939981",
      "is_family_head": true
    }
  ]
}
```

---

## 🔍 FIELD-BY-FIELD BREAKDOWN

### REQUIRED Fields (Always Sent)
| Field | Type | Example | Source |
|-------|------|---------|--------|
| `organization` | Integer | `13` | `localStorage.agentOrganization.ids[0]` |
| `branch` | Integer | `23` | `localStorage.agentOrganization.branch_id` |
| `agency_id` | Integer | `27` | `localStorage.agentOrganization.agency_id` |
| `umrah_package` | Integer | `17` | Selected package from state |
| `total_pax` | Integer | `2` | Calculated: adult + child + infant |
| `total_adult` | Integer | `2` | User input from booking form |
| `total_child` | Integer | `0` | User input from booking form |
| `total_infant` | Integer | `0` | User input from booking form |
| `status` | String | `"Pending"` | Hard-coded value |
| `person_details` | Array | See below | User input from passengers tab |

### OPTIONAL Fields (Conditionally Sent)
| Field | Type | Example | When Included |
|-------|------|---------|---------------|
| `internal_notes_id` | Integer | `35` | If internal note created successfully |
| `client_note` | String | `"Special request"` | If user enters client notes |
| `payment_details` | Array | See below | If payment amount > 0 |

### NEVER Sent (Removed from Payload)
| Field | Reason |
|-------|--------|
| `user_id` | Backend extracts from JWT token automatically |
| `agency` | Duplicate - only `agency_id` is used |
| `user` | Handled by backend from JWT |
| `booking_number` | Auto-generated by backend |
| `date` | Auto-set by backend |

---

## 👥 PERSON_DETAILS Structure

### Required Fields in Each Person Object
```javascript
{
  "first_name": "string",           // Required
  "last_name": "string",            // Required
  "passport_number": "string",      // Required
  "date_of_birth": "YYYY-MM-DD",    // Required
  "age_group": "adult",             // Required: "adult" | "child" | "infant"
  "contact_number": "string",       // Required
  "is_family_head": true            // Required: boolean
}
```

### Optional Fields in Each Person Object
```javascript
{
  "person_title": "Mr",                      // Optional: "Mr" | "Mrs" | "Miss" | "Master" | "Baby"
  "passpoet_issue_date": "YYYY-MM-DD",      // Optional (note: typo in backend field name)
  "passport_expiry_date": "YYYY-MM-DD",     // Optional
  "country": "Pakistan",                     // Optional
  "is_visa_included": true,                  // Optional: boolean
  "ticket_included": true                    // Optional: boolean
}
```

### Example Person Detail (Adult)
```json
{
  "first_name": "Abdul Moiz",
  "last_name": "Ahmed",
  "passport_number": "AB1234567",
  "date_of_birth": "1990-01-15",
  "age_group": "adult",
  "contact_number": "03222939981",
  "is_family_head": true,
  "person_title": "Mr",
  "passpoet_issue_date": "2020-01-01",
  "passport_expiry_date": "2030-01-01",
  "country": "Pakistan",
  "is_visa_included": true,
  "ticket_included": true
}
```

---

## 💳 PAYMENT_DETAILS Structure (Optional)

### Payment Object Fields
```javascript
{
  "amount": 74000,              // Required: float/number
  "method": "cash",             // Required: string
  "date": "2025-11-05",         // Required: "YYYY-MM-DD" format
  "status": "pending",          // Required: lowercase ("pending" | "completed" | "failed")
  "reference_number": "string"  // Optional: transaction/reference details
}
```

### When Payment Details Are Included
```javascript
// Only include if:
if (paymentDetails.length > 0 && paymentDetails[0].amount > 0) {
  // Include payment_details in payload
}
```

### Example Payment Details Array
```json
"payment_details": [
  {
    "amount": 50000,
    "method": "Bank Transfer",
    "date": "2025-11-05",
    "status": "completed",
    "reference_number": "TXN-12345"
  },
  {
    "amount": 24000,
    "method": "cash",
    "date": "2025-11-06",
    "status": "pending"
  }
]
```

---

## 📝 INTERNAL NOTE CREATION (Pre-Booking)

Before creating the booking, we create an internal note:

### Request
```http
POST https://api.saer.pk/api/internal-notes/
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Booking created on 11/5/2025",
  "organization": 13,
  "employee": 43,
  "note_type": "booking"
}
```

### Response
```json
{
  "id": 35,
  "note_type": "booking",
  "note": "Booking created on 11/5/2025",
  "organization": 13,
  "employee": 43,
  "date_time": "2025-11-05T09:54:21.502530+05:00",
  "created_at": "2025-11-05T09:54:21.502622+05:00"
}
```

**The returned `id` (35) is then used as `internal_notes_id` in booking payload.**

---

## 🎯 FRONTEND CODE IMPLEMENTATION

### Step 1: Initialize State
```javascript
const agentOrg = JSON.parse(localStorage.getItem('agentOrganization') || '{}');
const orgId = agentOrg?.ids?.[0] || 13;
const userId = agentOrg?.user_id || 43;
const branchId = agentOrg?.branch_id || 23;
const agencyId = agentOrg?.agency_id || 27;
```

### Step 2: Create Internal Note
```javascript
const createInternalNote = async () => {
  try {
    const token = localStorage.getItem('agentAccessToken');
    const response = await api.post('/internal-notes/', {
      note: `Booking created on ${new Date().toLocaleDateString()}`,
      organization: orgId,
      employee: userId,
      note_type: 'booking'
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.id; // Returns 35, for example
  } catch (error) {
    console.error('Failed to create internal note:', error);
    return null;
  }
};
```

### Step 3: Build Booking Payload
```javascript
const payload = {
  // Required fields
  organization: orgId,                    // 13
  branch: branchId,                       // 23
  agency_id: agencyId,                    // 27
  umrah_package: bookingInfo.umrah_package,  // 17
  total_pax: bookingInfo.total_pax,       // 2
  total_adult: bookingInfo.total_adult,   // 2
  total_child: bookingInfo.total_child,   // 0
  total_infant: bookingInfo.total_infant, // 0
  status: "Pending",
  
  // Optional fields (only if present)
  ...(internalNoteId && { internal_notes_id: internalNoteId }),
  ...(bookingInfo.client_note && { client_note: bookingInfo.client_note }),
  
  // Person details array
  person_details: personDetails.map(p => ({
    first_name: p.first_name,
    last_name: p.last_name,
    passport_number: p.passport_number,
    date_of_birth: p.date_of_birth,
    age_group: p.age_group,
    contact_number: p.contact_number,
    is_family_head: p.is_family_head,
    ...(p.person_title && { person_title: p.person_title }),
    ...(p.passpoet_issue_date && { passpoet_issue_date: p.passpoet_issue_date }),
    ...(p.passport_expiry_date && { passport_expiry_date: p.passport_expiry_date }),
    ...(p.country && { country: p.country }),
    ...(p.is_visa_included !== undefined && { is_visa_included: p.is_visa_included }),
    ...(p.ticket_included !== undefined && { ticket_included: p.ticket_included }),
  })),
  
  // Payment details array (only if payments exist)
  ...(paymentDetails.length > 0 && paymentDetails[0].amount > 0 && {
    payment_details: paymentDetails.map(p => ({
      amount: parseFloat(p.amount),
      method: p.method,
      date: p.date.split('T')[0], // "2025-11-05T10:30:00.000Z" → "2025-11-05"
      status: p.status.toLowerCase(), // "Pending" → "pending"
      ...(p.remarks && { reference_number: p.remarks }),
    }))
  }),
};
```

### Step 4: Send Request
```javascript
const token = localStorage.getItem('agentAccessToken');
const response = await api.post('/bookings/', payload, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Step 5: Handle Response
```javascript
// Success (201 Created)
console.log('Booking created:', response.data);
navigate('/booking-history');

// Error (400/500)
console.error('Error:', error.response?.data);
```

---

## 🐛 COMMON ERRORS AND FIXES

### Error 1: "payment_details: Payment Details is required"
**Problem**: Backend expects `payment_details` as required field
**Fix**: Always include empty array or conditional inclusion
```javascript
// Option 1: Always include (even empty)
payment_details: []

// Option 2: Conditional (current implementation)
...(paymentDetails.length > 0 && { payment_details: [...] })
```

### Error 2: "agency_id: Agency Id is required"
**Problem**: Missing `agency_id` field
**Fix**: Ensure `agency_id` is included (not `agency`)
```javascript
agency_id: 27  // Correct
// agency: 27  // Wrong
```

### Error 3: "User Id is required" or "Cannot assign UserProfile"
**Problem**: Backend user extraction from JWT not working
**Fix**: Don't send `user_id`, backend should extract from token
```javascript
// DO NOT include:
// user_id: 43
```

### Error 4: Payment status validation error
**Problem**: Status must be lowercase
**Fix**: Convert to lowercase
```javascript
status: p.status.toLowerCase()  // "Pending" → "pending"
```

### Error 5: Date format error
**Problem**: Backend expects "YYYY-MM-DD" but frontend sends ISO timestamp
**Fix**: Extract date portion
```javascript
date: p.date.split('T')[0]  // "2025-11-05T10:30:00.000Z" → "2025-11-05"
```

---

## ✅ CHECKLIST FOR BACKEND DEVELOPER

### Verify These Points:
- [ ] `/api/bookings/` endpoint accepts POST requests
- [ ] JWT authentication is working (extracts user from token)
- [ ] `agency_id` field is accepted (not `agency`)
- [ ] `status` field accepts "Pending" value
- [ ] `person_details` accepts array of person objects
- [ ] `payment_details` is truly optional (or provide error if required)
- [ ] Date fields accept "YYYY-MM-DD" format
- [ ] Payment status accepts lowercase values ("pending", "completed", "failed")
- [ ] Internal note ID is valid and exists in database
- [ ] CORS is enabled for frontend origin (http://localhost:5174)

### Test with Minimal Payload:
```bash
curl -X POST https://api.saer.pk/api/bookings/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "organization": 13,
    "branch": 23,
    "agency_id": 27,
    "umrah_package": 17,
    "total_pax": 1,
    "total_adult": 1,
    "total_child": 0,
    "total_infant": 0,
    "status": "Pending",
    "person_details": [{
      "first_name": "Test",
      "last_name": "User",
      "passport_number": "TEST123",
      "date_of_birth": "1990-01-01",
      "age_group": "adult",
      "contact_number": "03001234567",
      "is_family_head": true
    }]
  }'
```

---

## 📊 EXPECTED RESPONSE

### Success Response (201 Created)
```json
{
  "id": 123,
  "booking_number": "BK-20251105-A1B2C3",
  "organization": 13,
  "branch": 23,
  "agency": 27,
  "umrah_package": 17,
  "status": "Pending",
  "total_pax": 2,
  "total_adult": 2,
  "total_child": 0,
  "total_infant": 0,
  "person_details": [...],
  "payment_details": [...],
  "date": "2025-11-05T10:30:00Z",
  "created_at": "2025-11-05T10:30:00Z"
}
```

### Error Response (400 Bad Request)
```json
{
  "field_name": ["Error message"],
  "umrah_package": ["This field is required."]
}
```

---

## 📞 CONTACT & DEBUGGING

**Frontend Developer**: Abdul Moiz Ahmed (abdulmoiz76655@gmail.com)
**Project**: Saer.pk Frontend
**Repository**: Saer-agent-front-end-main
**Dev Server**: http://localhost:5174
**Backend API**: https://api.saer.pk/

**For Backend Team:**
- Check Django logs for detailed error messages
- Verify serializer `create()` method is handling all fields
- Test with the minimal payload provided above
- Ensure JWT middleware is extracting user correctly
- Check if `payment_details` serializer is properly configured

**Last Updated**: November 7, 2025

---

## 🚀 QUICK TEST SCRIPT

Copy this into your browser console after filling the booking form:

```javascript
// Get stored data
const token = localStorage.getItem('agentAccessToken');
const orgData = JSON.parse(localStorage.getItem('agentOrganization'));

console.log('🔐 Token:', token ? 'Present' : 'Missing');
console.log('📋 Org Data:', orgData);

// Test API connection
fetch('https://api.saer.pk/api/bookings/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organization: orgData.ids[0],
    branch: orgData.branch_id,
    agency_id: orgData.agency_id,
    umrah_package: 17,
    total_pax: 1,
    total_adult: 1,
    total_child: 0,
    total_infant: 0,
    status: "Pending",
    person_details: [{
      first_name: "Test",
      last_name: "User",
      passport_number: "TEST123",
      date_of_birth: "1990-01-01",
      age_group: "adult",
      contact_number: "03001234567",
      is_family_head: true
    }]
  })
})
.then(r => r.json())
.then(data => console.log('✅ Response:', data))
.catch(err => console.error('❌ Error:', err));
```

---

**END OF DOCUMENTATION**
