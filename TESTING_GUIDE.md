# Testing Guide - Rating & Waitlist Feature

## 🚀 Quick Start Testing

### Prerequisites
1. MongoDB connection active
2. Seed data loaded (doctors and patients)
3. Development server running: `npm run dev`

## 📋 Test Scenarios

### Scenario 1: Complete Rating Flow (5 minutes)

**Objective**: Test end-to-end rating submission and display

1. **Login as Patient**
   ```
   Email: patient@test.com (or any seeded patient)
   Password: password123
   ```

2. **Navigate to Appointments**
   - Click "Appointments" in navigation
   - Look for completed appointments
   - Find appointment marked "Completed"

3. **Submit Rating**
   - Click "⭐ Rate Appointment" button
   - Modal should open with appointment details
   - Hover over stars (should show color preview)
   - Click 5 stars
   - Enter comment: "Excellent doctor! Very professional and caring."
   - Check "Public" option (should be default)
   - Click "Submit Rating"
   - Wait for success message
   - Modal closes automatically

4. **Verify Rating**
   - Button changes to "✓ Rated" (green)
   - Try clicking again → should see "✓ Rated" (no modal opens)
   - This confirms duplicate prevention works ✅

5. **View Worker Profile**
   - Go back to Patient Dashboard
   - Find the rated worker card
   - Should show: `⭐ 4.5 (X reviews)` (updated count)
   - Click worker name or "View Profile & Reviews"
   - Switch to "Reviews" tab
   - Find your review at the top
   - Verify: 5 stars, your comment, your name, timestamp

**Expected Results**:
- ✅ Rating submitted successfully
- ✅ Appointment marked as rated
- ✅ Cannot rate same appointment twice
- ✅ Worker avgRating updated
- ✅ Review visible on profile

---

### Scenario 2: Worker Profile & Reviews (3 minutes)

**Objective**: Test worker profile page and review display

1. **From Patient Dashboard**
   - View list of healthcare workers
   - Each should show: Name, Specialization, Rating, Review Count
   - Click on any worker with reviews

2. **Worker Profile Page**
   - **About Tab**:
     - Name, specialization, photo
     - Qualifications list
     - Experience years
     - Languages spoken
     - Services offered
   
   - **Reviews Tab**:
     - Average rating (large display)
     - Total review count
     - Rating distribution chart (bars for 5★, 4★, 3★, 2★, 1★)
     - List of individual reviews:
       - Star rating
       - Patient name
       - Date
       - Comment text
       - Worker response (if any)

3. **Test Filters**
   - Only public, non-reported reviews should show
   - Private reviews should NOT appear
   - Reviews should be sorted newest first

**Expected Results**:
- ✅ Profile loads correctly
- ✅ Rating stats accurate
- ✅ Reviews displayed properly
- ✅ Chart shows distribution

---

### Scenario 3: Worker Response to Rating (4 minutes)

**Objective**: Test worker responding to patient reviews

1. **Login as Worker**
   ```
   Email: doctor@test.com (or seeded worker email)
   Password: password123
   ```

2. **Check Notifications**
   - Should see notification: "New review received"
   - Click to view details

3. **View Own Profile**
   - Navigate to profile or reviews section
   - See all reviews (including private ones)
   - Find a review without response

4. **Submit Response**
   - Click "Respond" button on review
   - Enter: "Thank you for your kind words! It was a pleasure helping you."
   - Click "Submit Response"
   - Response should appear below review

5. **Verify as Patient**
   - Logout and login as patient
   - View worker profile
   - Find your rated appointment
   - See worker's response displayed

**Expected Results**:
- ✅ Worker receives notification
- ✅ Can view all their reviews
- ✅ Response submitted successfully
- ✅ Response visible to patients

---

### Scenario 4: Waitlist Join & Management (5 minutes)

**Objective**: Test waitlist creation and status tracking

1. **As Patient - Join Waitlist**
   - Login as patient
   - Navigate to Book Appointment
   - Select a fully-booked worker
   - System shows "Fully booked" message
   - Click "Join Waitlist" button
   - Fill form:
     - Preferred Date: Select future date
     - Time Slot: Morning
     - Appointment Type: Clinic Visit
   - Click "Join Waitlist"
   - Success message appears

2. **Verify Waitlist Entry**
   - Go to Patient Dashboard
   - Look for "My Waitlist" section (if UI completed)
   - Should show:
     - Worker name
     - Preferred date/time
     - Status: "Waiting"
     - Position in queue

3. **API Verification** (if UI not ready):
   ```
   Open browser console
   Fetch: GET /api/waitlist
   Should return your waitlist entry with:
   - worker info
   - preferredDate
   - status: "waiting"
   - priority number
   ```

4. **As Worker - View Waitlist**
   - Login as the worker
   - Navigate to Waitlist Management
   - Should see list of waiting patients
   - Each entry shows:
     - Patient name
     - Preferred date/time
     - Appointment type
     - Priority (position)
     - "Notify" button

5. **Notify Patient**
   - Click "Notify" for first patient
   - Confirm notification sent
   - Status updates to "Notified"
   - Patient receives notification

**Expected Results**:
- ✅ Patient successfully joins waitlist
- ✅ No duplicate entries allowed
- ✅ Worker can view waitlist
- ✅ Notification sent to patient
- ✅ Status tracking works

---

### Scenario 5: Edge Cases & Validation (6 minutes)

**Test Case 5.1: Duplicate Rating Prevention**
1. Complete appointment and rate it
2. Try to rate same appointment again
3. Should show "Already rated" or disabled button ✅

**Test Case 5.2: Invalid Rating Value**
1. Open browser console
2. Try API call with rating = 6 or 0
3. Should return 400 error "Rating must be 1-5" ✅

**Test Case 5.3: Rating Without Appointment**
1. Try POST /api/ratings without appointmentId
2. Should return 400 error "Missing required fields" ✅

**Test Case 5.4: Duplicate Waitlist Entry**
1. Join waitlist for a worker
2. Try joining again for same worker
3. Should return error "Already in waitlist" ✅

**Test Case 5.5: Waitlist Expiration**
1. Create waitlist entry
2. Check database: expiresAt should be 7 days from now
3. Manually set expiresAt to past date
4. Run cleanup script (or wait for cron)
5. Status should change to "expired" ✅

**Test Case 5.6: Unauthorized Access**
1. Logout (no session)
2. Try POST /api/ratings
3. Should return 401 Unauthorized ✅

**Test Case 5.7: Cross-User Rating**
1. Login as Patient A
2. Try to rate Patient B's appointment
3. Should return 403 Forbidden ✅

---

## 🔍 Testing Checklist

### Rating System
- [ ] Patient can submit rating for completed appointment
- [ ] Star rating 1-5 works correctly
- [ ] Comment field accepts up to 1000 characters
- [ ] Public/private toggle works
- [ ] Duplicate rating prevented (same appointment)
- [ ] Worker avgRating updates automatically
- [ ] Review count increments
- [ ] Worker receives notification
- [ ] Rating appears on worker profile
- [ ] Worker can respond to rating
- [ ] Response appears for patients
- [ ] Report system flags inappropriate content
- [ ] Only public non-reported reviews shown on profile

### Waitlist System
- [ ] Patient can join waitlist when worker fully booked
- [ ] Preferred date and time slot captured
- [ ] Appointment type (clinic/home) captured
- [ ] Duplicate waitlist entry prevented
- [ ] Priority assigned (queue position)
- [ ] Expiration set to 7 days automatically
- [ ] Worker can view all waitlist entries
- [ ] Worker can notify next patient
- [ ] Patient receives notification when notified
- [ ] Status updates correctly (waiting → notified → booked)
- [ ] Expired entries cleaned up after 7 days
- [ ] Patient can cancel waitlist entry

### UI/UX
- [ ] RatingModal opens and closes smoothly
- [ ] Star hover effect works
- [ ] Loading states show during API calls
- [ ] Success messages display after actions
- [ ] Error messages clear and helpful
- [ ] Worker profile loads without errors
- [ ] Rating distribution chart displays correctly
- [ ] Reviews sorted newest first
- [ ] Patient dashboard shows ratings correctly
- [ ] Navigation between pages works

### Security
- [ ] Authentication required for all protected endpoints
- [ ] Patients can only rate their own appointments
- [ ] Workers can only respond to their own ratings
- [ ] Input validation prevents XSS attacks
- [ ] SQL injection prevented (using Mongoose)
- [ ] Rate limiting ready (commented code available)
- [ ] CORS configured properly
- [ ] Session management secure

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot read property 'id' of undefined"
**Fix**: Ensure user is logged in and session active
```javascript
// Check session in browser console
console.log(session?.user);
```

### Issue: "Worker not found"
**Fix**: Verify worker exists in database
```bash
# In MongoDB Atlas or Compass
db.users.find({ role: 'worker' })
```

### Issue: Rating not appearing on profile
**Fix**: Check if rating is public and not reported
```javascript
// In Rating document
isPublic: true  ✅
isReported: false  ✅
```

### Issue: Waitlist notification not sent
**Fix**: Check Notification model and API
```bash
# Verify notification created
db.notifications.find({ recipientId: <patientId> })
```

### Issue: "Appointment already rated"
**Fix**: This is correct behavior (duplicate prevention)
- Check Appointment.hasRating = true
- Each appointment can only be rated once

---

## 📊 API Testing with Postman/cURL

### Test Rating API

**1. Submit Rating**
```bash
POST http://localhost:3000/api/ratings
Content-Type: application/json
Cookie: next-auth.session-token=<your-session-token>

{
  "appointmentId": "60d5ec49f1b2c72b8c8e4a12",
  "rating": 5,
  "comment": "Excellent service!",
  "isPublic": true
}
```

**2. Get Worker Reviews**
```bash
GET http://localhost:3000/api/ratings?workerId=60d5ec49f1b2c72b8c8e4a10
```

**3. Worker Response**
```bash
PUT http://localhost:3000/api/ratings?id=60d5ec49f1b2c72b8c8e4a15
Content-Type: application/json
Cookie: next-auth.session-token=<worker-session>

{
  "workerResponse": "Thank you for your feedback!"
}
```

### Test Waitlist API

**1. Join Waitlist**
```bash
POST http://localhost:3000/api/waitlist
Content-Type: application/json
Cookie: next-auth.session-token=<patient-session>

{
  "workerId": "60d5ec49f1b2c72b8c8e4a10",
  "preferredDate": "2024-03-15",
  "preferredTimeSlot": "morning",
  "appointmentType": "clinic"
}
```

**2. Get Waitlist**
```bash
GET http://localhost:3000/api/waitlist
Cookie: next-auth.session-token=<your-session>
```

**3. Update Waitlist Status**
```bash
PUT http://localhost:3000/api/waitlist?id=60d5ec49f1b2c72b8c8e4a20
Content-Type: application/json
Cookie: next-auth.session-token=<worker-session>

{
  "status": "notified"
}
```

---

## 📈 Performance Testing

### Load Test Ratings
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/ratings?workerId=<id>
```

**Expected**: 
- Response time < 100ms for reads
- < 500ms for writes
- No errors under load

### Database Query Performance
```javascript
// Enable MongoDB profiling
db.setProfilingLevel(2)

// Check slow queries
db.system.profile.find({ millis: { $gt: 100 } })
```

---

## ✅ Definition of Done

A test scenario passes when:
1. ✅ No console errors
2. ✅ API returns expected status code
3. ✅ Data persisted correctly in database
4. ✅ UI updates reflect changes
5. ✅ Notifications sent where applicable
6. ✅ User feedback displayed (success/error messages)
7. ✅ Navigation works correctly
8. ✅ Session maintained throughout

---

## 🎯 Test Coverage Goals

- **Unit Tests**: 80%+ coverage (future)
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **Performance Tests**: < 200ms average response
- **Security Tests**: No vulnerabilities

---

**Happy Testing! 🎉**

Report any bugs or issues with:
- Clear steps to reproduce
- Expected vs actual behavior
- Screenshots/console logs
- Browser and OS version
