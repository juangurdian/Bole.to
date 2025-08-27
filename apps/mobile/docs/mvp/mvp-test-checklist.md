# MVP Test Plan (Manual Testing Checklist)

## Authentication & User Management

### Login Flow
- [ ] **Valid Login**: User can login with correct email/password
- [ ] **Invalid Credentials**: Shows appropriate error message
- [ ] **Network Error**: Handles connection failures gracefully
- [ ] **Multi-Account**: Shows account selection if user has multiple accounts
- [ ] **Token Storage**: JWT token persists across app restarts
- [ ] **Auto-Login**: User stays logged in on app restart

### Account Management
- [ ] **Account Selection**: User can switch between accounts if multiple available
- [ ] **Account Context**: API calls use correct account context
- [ ] **Profile View**: User profile loads and displays correctly
- [ ] **Profile Edit**: User can update profile information
- [ ] **Validation Errors**: Profile edit shows validation errors appropriately

### Token Management
- [ ] **Token Refresh**: Expired tokens refresh automatically
- [ ] **Refresh Failure**: Redirects to login when refresh fails
- [ ] **Logout**: Clears all stored tokens and redirects to login
- [ ] **Auth Headers**: API requests include correct Authorization header

## Event Discovery & Browse

### Event Lists
- [ ] **Home Events**: Home screen loads and displays events
- [ ] **Discover Events**: Discover screen shows event grid/list
- [ ] **Event Search**: Text search finds relevant events
- [ ] **Event Filters**: Filter by category, date, location works
- [ ] **Event Sorting**: Sort by date, price, popularity works
- [ ] **Empty States**: Shows appropriate message when no events found
- [ ] **Loading States**: Shows loading indicators while fetching data
- [ ] **Error States**: Shows error message with retry option when API fails

### Event Details
- [ ] **Event Navigation**: Tapping event card navigates to event details
- [ ] **Event Info**: Event details screen shows title, description, date/time
- [ ] **Venue Info**: Location details and address display correctly
- [ ] **Event Images**: Event images load and display properly
- [ ] **Organizer Info**: Organizer name and details are visible
- [ ] **Event Status**: Shows correct status (live, draft, cancelled)
- [ ] **Private Events**: Non-public events show appropriate access restrictions

## Ticket Purchase Flow

### Product Display
- [ ] **Ticket Types**: All available ticket types/products display
- [ ] **Pricing**: Correct prices show for each ticket type
- [ ] **Availability**: Shows remaining ticket counts accurately
- [ ] **Sold Out**: Sold out tickets show as unavailable
- [ ] **Quantity Selection**: User can select ticket quantities
- [ ] **Price Calculation**: Total price updates correctly with quantity changes

### Order Creation
- [ ] **Create Order**: User can initiate ticket purchase
- [ ] **Order Validation**: Validates ticket availability during purchase
- [ ] **Promo Codes**: Promo code entry and validation works
- [ ] **Order Summary**: Shows correct items, quantities, and totals
- [ ] **Customer Info**: Collects required attendee information
- [ ] **Question Handling**: Event questions display and capture responses

### Payment Processing
- [ ] **Payment Methods**: Shows available payment options
- [ ] **Stripe Integration**: Stripe payment sheet displays correctly
- [ ] **Payment Success**: Successful payment completes order
- [ ] **Payment Failure**: Failed payments show error and allow retry
- [ ] **Offline Payment**: Offline payment option works if enabled
- [ ] **Order Confirmation**: Successful purchase shows confirmation screen

### Error Handling
- [ ] **Sold Out During Purchase**: Handles tickets selling out during checkout
- [ ] **Payment Timeout**: Handles payment timeout scenarios
- [ ] **Network Errors**: Payment failures due to network issues
- [ ] **Invalid Promo Codes**: Shows appropriate error for invalid promo codes
- [ ] **Capacity Limits**: Respects event capacity limitations

## Ticket Wallet & Management

### My Tickets
- [ ] **Ticket List**: User's purchased tickets display in wallet
- [ ] **Upcoming Tickets**: Shows tickets for upcoming events
- [ ] **Past Tickets**: Shows tickets for past events correctly
- [ ] **Empty State**: Shows appropriate message when no tickets
- [ ] **Ticket Details**: Individual ticket view shows all relevant info
- [ ] **QR Code Display**: Ticket QR codes render clearly and correctly

### Ticket Information
- [ ] **Event Details**: Ticket shows associated event information
- [ ] **Attendee Info**: Shows attendee name and details
- [ ] **Ticket Reference**: Displays ticket reference/confirmation number
- [ ] **Check-in Status**: Shows whether ticket has been used/checked in
- [ ] **Transfer Info**: If applicable, shows ticket transfer status

## QR Check-in & Scanning

### Staff Access
- [ ] **Staff Mode**: Staff can access check-in functionality
- [ ] **Event Selection**: Can select event/check-in list for scanning
- [ ] **Check-in List**: Shows list of attendees for manual lookup
- [ ] **Search Attendees**: Can search attendees by name/email

### QR Scanning
- [ ] **Camera Access**: App requests and handles camera permissions
- [ ] **QR Detection**: Successfully detects and reads QR codes
- [ ] **Valid Tickets**: Valid QR codes check in attendees successfully
- [ ] **Invalid QR**: Invalid QR codes show appropriate error messages
- [ ] **Duplicate Check-in**: Already checked-in tickets show status appropriately
- [ ] **Scan Feedback**: Audio/visual feedback for successful/failed scans

### Check-in Management
- [ ] **Check-in Status**: Real-time status updates after scanning
- [ ] **Manual Check-in**: Can manually check in attendees without QR scan
- [ ] **Undo Check-in**: Can undo accidental check-ins if supported
- [ ] **Attendee Info**: Shows attendee details during check-in process
- [ ] **Offline Check-in**: Handles offline scenarios appropriately

## Profile & Settings

### User Profile
- [ ] **Profile View**: User profile information displays correctly
- [ ] **Profile Edit**: Can edit and save profile changes
- [ ] **Avatar Upload**: Profile picture upload works if supported
- [ ] **Contact Info**: Email, phone number updates work correctly
- [ ] **Preferences**: User preferences save and apply correctly

### App Settings
- [ ] **Notification Settings**: Can configure notification preferences
- [ ] **App Permissions**: Shows current permission status
- [ ] **About Info**: App version and info display correctly
- [ ] **Logout**: Logout function works from settings screen

## Error Scenarios & Edge Cases

### Network Conditions
- [ ] **No Internet**: Shows offline banner and appropriate messaging
- [ ] **Slow Connection**: Handles slow network gracefully with timeouts
- [ ] **Intermittent Connection**: Recovers from connection drops
- [ ] **API Downtime**: Shows server error message with retry option

### Data Scenarios
- [ ] **Empty Data**: Handles empty responses appropriately
- [ ] **Invalid Data**: Handles malformed API responses
- [ ] **Large Data Sets**: Performance with large event/ticket lists
- [ ] **Concurrent Users**: Handles conflicts when multiple users access same resources

### Authentication Edge Cases
- [ ] **Token Expiry**: Handles token expiry during app usage
- [ ] **Multiple Devices**: Same account on multiple devices
- [ ] **Account Deletion**: Handles deleted account scenarios
- [ ] **Password Change**: Handles password changes on other devices

## Cross-Platform Testing

### iOS Specific
- [ ] **iOS Navigation**: Navigation stack works correctly on iOS
- [ ] **iOS Permissions**: Camera/photo permissions work on iOS
- [ ] **iOS Keyboard**: Keyboard handling works properly
- [ ] **iOS Safe Areas**: Content respects safe areas correctly
- [ ] **iOS Payment**: Apple Pay integration if supported

### Android Specific  
- [ ] **Android Navigation**: Navigation stack works correctly on Android
- [ ] **Android Permissions**: Camera/storage permissions work on Android
- [ ] **Android Keyboard**: Keyboard handling works properly
- [ ] **Android Back Button**: Hardware back button functions correctly
- [ ] **Android Payment**: Google Pay integration if supported

## Performance & Usability

### Loading Performance
- [ ] **App Launch**: App starts up within reasonable time (< 3 seconds)
- [ ] **Event Lists**: Event lists load within 2 seconds
- [ ] **Event Details**: Event details load within 2 seconds
- [ ] **Image Loading**: Event images load progressively
- [ ] **Search Performance**: Search results appear within 1 second

### User Experience
- [ ] **Navigation Flow**: Intuitive navigation between screens
- [ ] **Visual Feedback**: Loading indicators during API calls
- [ ] **Error Recovery**: Clear error messages with actionable steps
- [ ] **Accessibility**: Basic accessibility features work
- [ ] **Text Scaling**: Supports dynamic text sizing

## Business Logic Validation

### Ticket Business Rules
- [ ] **Capacity Limits**: Cannot purchase more tickets than available
- [ ] **Time Limits**: Cannot purchase tickets after sale end time
- [ ] **User Limits**: Respects per-user ticket purchase limits
- [ ] **Event Status**: Cannot purchase tickets for cancelled/draft events

### Payment Business Rules
- [ ] **Currency Handling**: Correct currency display and calculation
- [ ] **Tax Calculation**: Taxes calculated correctly if applicable
- [ ] **Fee Calculation**: Service fees calculated correctly
- [ ] **Refund Rules**: Refund policies enforced correctly

### Check-in Business Rules
- [ ] **Event Timing**: Check-in only available during appropriate times
- [ ] **Ticket Validity**: Only valid tickets can be checked in
- [ ] **Staff Permissions**: Only authorized staff can perform check-ins
- [ ] **Check-in Limits**: Prevents duplicate check-ins appropriately

## Security Testing

### Data Security
- [ ] **Token Storage**: JWT tokens stored securely
- [ ] **Sensitive Data**: No sensitive data in logs or unencrypted storage
- [ ] **API Security**: API calls use HTTPS
- [ ] **Input Validation**: User inputs are properly validated

### Authentication Security
- [ ] **Session Management**: Sessions expire appropriately
- [ ] **Authorization**: Users can only access their own data
- [ ] **Account Isolation**: Multi-tenant data isolation works correctly
- [ ] **Password Security**: Password requirements enforced

## Test Environment Setup

### Prerequisites
- [ ] Hi.Events backend running with test data
- [ ] Stripe test environment configured
- [ ] Test events created with various ticket types
- [ ] Test user accounts with different roles
- [ ] Test organizer accounts with events

### Test Data Requirements
- [ ] Events in various states (live, draft, past)
- [ ] Events with different ticket types and pricing
- [ ] Events with and without capacity limits  
- [ ] Events with promo codes configured
- [ ] Events with custom questions
- [ ] Users with existing orders/tickets

## Success Criteria

### Functional Requirements
- [ ] All critical user journeys work end-to-end
- [ ] Authentication flow is secure and reliable
- [ ] Ticket purchase flow completes successfully > 95% of time
- [ ] QR check-in system works reliably > 98% of time
- [ ] App handles error scenarios gracefully

### Performance Requirements
- [ ] App launch time < 3 seconds
- [ ] API response times < 2 seconds for critical operations
- [ ] Image loading doesn't block user interactions
- [ ] App memory usage stays within reasonable limits
- [ ] App crash rate < 1% during testing

### User Experience Requirements
- [ ] Users can complete ticket purchase without confusion
- [ ] Staff can check in attendees efficiently (< 10 seconds per person)
- [ ] Error messages are helpful and actionable
- [ ] App feels responsive and provides appropriate feedback
- [ ] Core functionality works offline where applicable