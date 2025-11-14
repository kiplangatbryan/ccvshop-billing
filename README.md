# Zargar Invoice Admin

A full-stack invoice management system built with Nuxt 3, MongoDB, and integrated with CCV Shop API.

## Features

- 🔐 **Authentication** - Secure login and registration system
- 📄 **Invoice Management** - Create, view, and track invoices
- 🛍️ **CCV Shop Integration** - Fetch products directly from CCV Shop API
- 📊 **PDF Export** - Generate and download invoice PDFs
- 📦 **Inventory Sync** - Automatically update CCV Shop inventory when invoices are paid
- 📈 **Dashboard** - Overview of invoices and statistics

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS
- **Backend**: Nuxt 3 Server API Routes
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt
- **API Integration**: CCV Shop API

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this
   MONGODB_URI=mongodb://localhost:27017/zargar-invoice
   CCV_SHOP_API_URL=https://demo.ccvshop.nl/API
   CCV_SHOP_API_KEY=your-api-key
   CCV_SHOP_API_SECRET=your-api-secret
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication

1. Register a new account at `/register`
2. Login at `/login`

### Creating Invoices

1. Navigate to "Create Invoice"
2. Fill in customer information
3. Click "Add Product" to select products from CCV Shop
4. Set quantities for each product
5. Add tax rate if needed
6. Click "Create Invoice"

### Managing Invoices

- View all invoices at `/invoices`
- Click on any invoice to view details
- Download PDF by clicking "Download PDF"
- Mark invoice as paid - this will automatically reduce product quantities in CCV Shop

### Dashboard

- View statistics and recent invoices
- Track paid vs pending invoices
- Monitor total revenue

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/pay` - Mark invoice as paid (updates CCV Shop inventory)
- `GET /api/invoices/:id/pdf` - Generate PDF for invoice

### Products
- `GET /api/ccv/products` - Fetch products from CCV Shop API

## Notes

- The CCV Shop API integration includes fallback handling for demo endpoints
- Product stock updates are performed when invoices are marked as paid
- PDF generation uses HTML-to-PDF conversion (client-side print)
- All routes are protected by authentication middleware except login/register

## License

MIT


# ccvshop-billing




