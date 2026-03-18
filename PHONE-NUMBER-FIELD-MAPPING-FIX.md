# Phone Number Field Mapping Fix

## Date: 2025-10-10

## Issue

When creating a new staff member through the Admin Dashboard (not the wizard), the phone number was being saved but not displayed on the staff cards.

### Root Cause

**Database vs Frontend Field Name Mismatch:**
- **Database field**: `phone` (as defined in Prisma schema)
- **Frontend expects**: `phoneNumber` (as defined in TypeScript interfaces)

**The Problem:**
1. Admin component sends `phoneNumber` in the request body
2. `UsersController.createUser` DTO was missing `phoneNumber` parameter
3. `UsersService.createUser` was storing `phoneNumber` directly instead of mapping it to `phone`
4. The `transformUser` method expects `phone` from DB and maps it to `phoneNumber` for frontend
5. Result: Data was stored as `phoneNumber` (wrong field), so `transformUser` couldn't find it in `phone` field

### Evidence from Logs

**Backend log showed:**
```javascript
Created new user: {
  id: 'user-1760092218010',
  name: 'mojito',
  phoneNumber: '0829450595',  // ❌ Stored as 'phoneNumber' instead of 'phone'
  ...
}
```

**Frontend display:**
```
No phone number  // ❌ Because transformUser couldn't find 'phone' field
```

---

## Fix Applied

### 1. Updated UsersController (`backend/src/modules/users/users.controller.ts`)

**Added `phoneNumber` to DTO:**
```typescript
@Post()
@ApiOperation({ summary: 'Create new user' })
async createUser(@Body() createDto: { 
  email: string; 
  name: string; 
  role: string; 
  password?: string;
  phoneNumber?: string;  // ✅ Added this
}) {
  return this.usersService.createUser(createDto);
}
```

### 2. Updated UsersService (`backend/src/modules/users/users.service.ts`)

**Fixed `createUser` to map `phoneNumber` → `phone` and transform response:**
```typescript
async createUser(createDto: { 
  email: string; 
  name: string; 
  role: string; 
  password?: string;
  phoneNumber?: string;
}) {
  // ... validation ...

  const user = await this.prisma.user.create({
    data: {
      email: createDto.email,
      name: createDto.name,
      role: createDto.role,
      password: createDto.password || 'default123',
      phone: createDto.phoneNumber || '' // ✅ Map phoneNumber → phone
    }
  });
  
  return this.transformUser(user); // ✅ Transform phone → phoneNumber for frontend
}
```

**Fixed `updateUser` to handle `phoneNumber` mapping:**
```typescript
async updateUser(id: string, updateDto: any) {
  // ... validation ...

  // Transform phoneNumber to phone for database
  const dbData = { ...updateDto };
  if (dbData.phoneNumber !== undefined) {
    dbData.phone = dbData.phoneNumber;  // ✅ Map phoneNumber → phone
    delete dbData.phoneNumber;
  }

  const user = await this.prisma.user.update({
    where: { id },
    data: dbData
  });
  
  return this.transformUser(user); // ✅ Transform phone → phoneNumber for frontend
}
```

---

## Data Flow (Fixed)

### Creating a User:

```
Frontend (Admin Component)
  ↓ sends { phoneNumber: '0829450595' }
UsersController
  ↓ accepts phoneNumber in DTO
UsersService.createUser
  ↓ maps phoneNumber → phone
Prisma (Database)
  ↓ stores { phone: '0829450595' }
UsersService.transformUser
  ↓ maps phone → phoneNumber
Response to Frontend
  ↓ { phoneNumber: '0829450595' }
Admin Component Display
  ✅ Shows phone number correctly
```

### Updating a User:

```
Frontend
  ↓ sends { phoneNumber: '0829450595' }
UsersController
  ↓ accepts any fields
UsersService.updateUser
  ↓ if phoneNumber exists, maps phoneNumber → phone
Prisma (Database)
  ↓ updates { phone: '0829450595' }
UsersService.transformUser
  ↓ maps phone → phoneNumber
Response to Frontend
  ↓ { phoneNumber: '0829450595' }
```

---

## Testing Instructions

1. **Create a new staff member:**
   - Go to Admin Dashboard → Staff Management
   - Click "+ Add Staff Member"
   - Fill in all fields including Phone Number
   - Click "Save"
   - **Expected**: Phone number displays on staff card

2. **Edit existing staff member:**
   - Click "Edit" on any staff card
   - Change the phone number
   - Click "Save"
   - **Expected**: Updated phone number displays correctly

3. **Use Wizard:**
   - Go to System Admin → Setup Wizard
   - Create new company with staff members including phone numbers
   - Complete wizard
   - Navigate to company admin dashboard
   - **Expected**: All staff phone numbers display correctly

---

## Related Files

- `backend/src/modules/users/users.controller.ts` - Added `phoneNumber` to DTO
- `backend/src/modules/users/users.service.ts` - Fixed field mapping in create and update
- `frontend/src/app/admin.component.ts` - Already correct (sends `phoneNumber`)
- `frontend/src/app/interfaces/api.interfaces.ts` - Already correct (`phoneNumber?`)

---

## Notes

- The database schema uses `phone` as the field name
- Frontend interfaces use `phoneNumber` for consistency with JavaScript naming conventions
- The `transformUser` utility function handles the mapping between database and frontend formats
- This same pattern is used in `AuthService.sanitizeUser()` for authentication responses

