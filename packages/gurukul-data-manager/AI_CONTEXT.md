# AI Context: Gurukul Data Manager

## Purpose
Manages user profiles (hostel students, staff, etc.) and records Pratah Shiramani logs/sponsorships.

## Database (Google Sheets)
- **Users**: User profiles with columns:
  `["UserID", "CreatedDate", "LastUpdated", "Surname", "FirstName", "FatherName", "Phone", "Email", "Gender", "DateOfBirth", "Address", "UserType", "Department", "EmergencyContactName", "EmergencyContactPhone", "Notes"]`
- **PratahShiramani**: Devotee shiramani logs with columns:
  `["Date", "UserID", "Surname", "FirstName", "FatherName", "Phone", "Email", "SerialNo", "ThalNimitt", "Occupation", "Devotee1_Surname", "Devotee1_Name", "Devotee1_DOB", "Devotee1_Phone", ..., "Quantity", "Items", "Notes"]`

## File Structure & Entry Points
- GAS Entry: `src/index.js` (Exports user and shiramani methods)
- GAS Backend:
  - `src/server/users.js`: Handles user queries and profile upsertion.
  - `src/server/shiramani.js`: Handles logs for Shiramani devotees and items.
- React Frontend: `src/client/`
  - `src/client/App.jsx`: Root component and synchronization hub.
  - `src/client/components/`: Sub-components for searching, editing, and listing records.
