# FoodGo - Point of Sale System

A modern, feature-rich Point of Sale (POS) system built with Next.js 14, TypeScript, and Tailwind CSS. Designed for restaurants and retail businesses to manage orders, process payments, and track inventory.

## 🚀 Features

- **Multiple Order Types**: Dine-in, Take-away, and Delivery support
- **Table Management**: Visual table selection for dine-in orders
- **Customer Management**: Customer selection and creation
- **Product Catalog**: Searchable and filterable product grid with categories
- **Shopping Cart**: Full cart management with quantity controls, modifiers, and notes
- **Discount System**: Percentage or fixed amount discounts
- **Tax Calculation**: Configurable tax rate (default 10%)
- **Payment Processing**: Multiple payment methods (Cash, Card, Mobile Wallet)
- **Order Tracking**: Real-time order status management (pending, preparing, ready, served, completed)
- **Running Orders**: Sidebar showing all active orders
- **Keyboard Shortcuts**: Power user features for faster operation
- **Toast Notifications**: User-friendly feedback system
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Fully typed for better development experience

## 🛠️ Tech Stack

- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Hooks**: Centralized state management with `usePOS` hook

## 📁 Project Structure

```
reactnextjs/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with ToastProvider
│   ├── page.tsx                 # Main POS interface (root page)
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── POS/                     # POS-specific components
│   │   ├── POSHeader.tsx        # Top navigation bar
│   │   ├── OrderManagementPanel.tsx  # Left panel (cart & order details)
│   │   ├── ProductCatalogPanel.tsx   # Right panel (product browsing)
│   │   ├── ExecutionOrdersSidebar.tsx  # Active orders sidebar
│   │   ├── PaymentModal.tsx     # Payment processing
│   │   ├── DiscountModal.tsx    # Discount application
│   │   └── ... (other POS components)
│   ├── ui/                      # Reusable UI components
│   │   ├── Toast.tsx            # Toast notification system
│   │   └── InputModal.tsx       # Generic input modal
│
├── hooks/                       # Custom React hooks
│   └── usePOS.ts               # Main POS state management hook
│
├── types/                       # TypeScript type definitions
│   └── pos.ts                  # POS-related types (Order, CartItem, etc.)
│
└── Configuration Files
    ├── package.json            # Dependencies & scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── next.config.js          # Next.js configuration
    ├── tailwind.config.js      # Tailwind CSS configuration
    └── postcss.config.js       # PostCSS configuration
```

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

The application will directly show the POS interface at the root URL (`/`).

## 📖 Key Files

### Entry Point
- **`app/page.tsx`**: Main POS interface that orchestrates all components

### State Management
- **`hooks/usePOS.ts`**: Centralized business logic and state management for the POS system

### Type Definitions
- **`types/pos.ts`**: POS-related types (Order, CartItem, OrderType, etc.)

### Root Layout
- **`app/layout.tsx`**: Root layout that wraps the entire application and provides ToastProvider

## 🎨 Architecture

### State Management Pattern
- Uses a custom hook pattern (`usePOS`) for centralized state management
- All POS business logic is encapsulated in the `usePOS` hook
- Components receive state and functions via props
- Toast notifications use React Context API

### Component Architecture
- **Container Components**: `app/page.tsx` manages state and orchestrates components
- **Presentational Components**: All components in `components/POS/` focus on UI
- **Custom Hooks**: Business logic separated into reusable hooks

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_TAX_RATE=10
```

## 🎯 Key Features Explained

### Order Management
- Create orders with multiple order types (dine-in, take-away, delivery)
- Select tables for dine-in orders
- Assign customers and waiters
- Apply discounts (percentage or fixed amount)
- Calculate taxes automatically
- Track order status in real-time

### Payment Processing
- Multiple payment methods: Cash, Card, Mobile Wallet
- Automatic change calculation for cash payments
- Payment validation and error handling

### Product Catalog
- Searchable product grid
- Category filtering
- Click to add products to cart
- Product images and details

### Execution Orders
- View all active orders in a sidebar
- Filter by status (pending, preparing, ready, served, completed)
- Update order status
- View order details

## 🔧 Configuration

### Tax Rate
The tax rate can be configured via environment variable `NEXT_PUBLIC_TAX_RATE` (default: 10%).

### Security Headers
Security headers are configured in `next.config.js` for production deployment.

## 📝 Notes

- The project uses **Next.js App Router** (not Pages Router)
- All POS components are **client components** (`'use client'`)
- Sample data is hardcoded (products, customers, orders) - ready for API integration
- No backend/database currently - all state is in-memory
- Ready for production deployment with security headers configured

## 🔮 Future Enhancements

- User authentication system
- Backend API integration
- Database persistence
- Real-time order updates
- Receipt printing
- Inventory management
- Reporting and analytics

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

MIT
# pos-app
