# Security Architecture — Urban Furniture Accounting

## 1. Authentication

The system uses JWT-based authentication.

Users first log in using their email and password. The password is verified using bcrypt. After successful authentication, the backend generates a JWT token.

The token is then sent with protected API requests using the Bearer authentication scheme.

Example:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

## 2. Password Security

Passwords are never stored as plain text.

The backend uses bcrypt to hash passwords before storing them in PostgreSQL.

Example:

```text
User Password
    ↓
bcrypt.hash()
    ↓
Password Hash
    ↓
PostgreSQL
```

During login, the entered password is verified using `bcrypt.compare()` against the stored hash.

The original password is never decrypted or recovered from the database.

---

## 3. JWT Authentication

After successful login, the server generates a JWT containing the user's identification and role.

Example payload:

```json
{
  "id": 15,
  "role": "accountant"
}
```

Protected requests must contain:

```text
Authorization: Bearer <JWT_TOKEN>
```

The backend verifies the token before allowing access to protected APIs.

Invalid or expired tokens return:

```text
401 Unauthorized
```

---

## 4. Authorization

Authentication identifies the user, while authorization determines what the user is allowed to do.

The system supports role-based access:

### Admin / Business Owner
- Manage master data
- Record transactions
- View financial reports
- Archive master data

### Accountant / Invoicing User
- Manage required master data
- Record transactions
- View reports

### Contact User
- View only their own invoices/bills
- Make payments

Users cannot access operations outside their assigned permissions.

Unauthorized operations return:

```text
403 Forbidden
```

---

## 5. Ownership-Based Access

Contact users must only access their own invoices and bills.

For example, if the authenticated contact has:

```text
user_id = 15
```

the backend filters records using the authenticated user's identity.

Example:

```sql
SELECT *
FROM invoices
WHERE contact_id = 15;
```

Therefore, knowing another invoice ID is not sufficient to access that invoice.

---

## 6. Protected APIs

APIs containing sensitive business data or operations are protected by authentication and authorization middleware.

Example:

```text
GET    /api/invoices
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
```

Request flow:

```text
Client
  ↓
JWT Token
  ↓
Authentication Middleware
  ↓
Authorization / Role Check
  ↓
Ownership Check (when required)
  ↓
Business Logic
  ↓
Database
```

---

## 7. Input Validation

The backend validates incoming data before processing it.

Examples:

- Required fields must be present.
- Email format must be valid.
- Quantity must be greater than zero.
- Amounts must be valid numbers.
- Referenced customer/product/account must exist.
- Invalid transaction data must be rejected.

---

## 8. Environment Variables

Sensitive configuration values are stored in environment variables rather than source code.

Example:

```text
DATABASE_URL=...
JWT_SECRET=...
```

The `.env` file must not be committed to GitHub.

A `.env.example` file may be provided containing only variable names/placeholders.

---

## 9. Error Handling

The API will return appropriate HTTP status codes.

- `400` – Invalid request/data
- `401` – Authentication required or invalid token
- `403` – User does not have permission
- `404` – Resource not found
- `500` – Unexpected server error

Sensitive information such as passwords, JWT secrets, or database credentials must never be returned in API responses.

---

## 10. Security Goal

The security design ensures that:

- User passwords are protected using bcrypt.
- Protected APIs require valid JWT authentication.
- Access is controlled using user roles.
- Contact users can only access their own financial records.
- Sensitive configuration is kept outside source code.
- Input is validated before database operations.
