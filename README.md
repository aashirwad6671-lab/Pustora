# 📚 Pustora — *Har Zaroorat, Ek App*

> A full-stack monorepo for **Pustora** — a hyperlocal bookstore and gifting marketplace for Lucknow, India. Get NCERT books, stationery, toys, and gifts delivered in under 30 minutes.

---

## 🏗️ Monorepo Structure

```
pustora/
├── mobile/          # 📱 Expo React Native app (iOS + Android)
├── customer/        # 🌐 Next.js customer web app (port 8085)
├── admin/           # 🛠️ Next.js admin dashboard
├── supabase/        # 🗄️ Database migrations & schema
└── package.json     # Monorepo root (npm workspaces)
```

---

## ✨ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native 0.81, Expo Router v6 |
| Web (Customer) | Next.js 14, React 18, TypeScript |
| Web (Admin) | Next.js 14, React 18, TypeScript |
| State | Zustand v5 |
| Backend | Supabase (Auth + PostgreSQL + Realtime) |
| Design System | Google Stitch — Royal Purple `#6C3FD6` theme |
| Fonts | Sora (headings), DM Sans (body) |

---

## 🎨 Design System

The entire UI follows a premium **Google Stitch** specification:

| Token | Value |
|-------|-------|
| Primary | `#6C3FD6` Royal Purple |
| Secondary | `#9B5DE5` Soft Violet |
| Accent | `#F5A623` Golden Amber |
| Background | `#F8F4FF` Snow White-Purple |
| Surface | `#FFFFFF` Pure White |
| Chip / Input bg | `#EDE8FF` Lavender |
| Text | `#2D1B69` Deep Midnight Indigo |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Supabase** project (create one at [supabase.com](https://supabase.com))

---

### 1. Clone & Install

```bash
git clone https://github.com/aashirwad6671-lab/pustora.git
cd pustora
```

Install web workspace dependencies (admin + customer):
```bash
npm install --legacy-peer-deps
```

Install mobile app dependencies (isolated to avoid React version conflict):
```bash
npm install --prefix mobile --no-workspaces --legacy-peer-deps
```

---

### 2. Environment Variables

#### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Admin (`admin/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Customer (`customer/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### 3. Database Setup

Apply the Supabase schema migrations in your Supabase project's SQL editor:

```bash
# Run the migration file contents in your Supabase SQL Editor
supabase/migrations/20260530000000_init_schema.sql
```

---

### 4. Run the Apps

#### 📱 Mobile App (Expo Go)
```bash
npm run start --prefix mobile -- --clear
```
Scan the QR code with **Expo Go** on your phone.

#### 🌐 Customer Web App
```bash
npm run customer:dev
# Opens at http://localhost:8085
```

#### 🛠️ Admin Dashboard
```bash
npm run admin:dev
# Opens at http://localhost:3000
```

---

## 📱 Mobile App Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Onboarding | `/(auth)/onboarding` | 3-slide animated introduction |
| Login | `/(auth)/login` | Phone + OTP verification |
| Setup | `/(auth)/setup` | Role selection (Student / Parent / Teacher) |
| Home | `/(tabs)/home` | Hero banner, categories, flash deals, bestsellers |
| Cart | `/(tabs)/cart` | Cart items, address, payment, order placement |
| Product | `/product/[id]` | Gallery, specs, combo recommendations |
| Category | `/category/[id]` | Filtered product listing |
| Support | `/support` | Customer support tickets |

---

## 🌐 Web App Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Splash, onboarding, hero, categories, products |
| Login | `/login` | OTP authentication |
| Setup | `/setup` | Profile onboarding |
| Category | `/category/[id]` | Product listing |
| Product | `/product/[id]` | Product details |
| Cart | `/cart` | Cart + checkout + order tracking |

---

## 🗄️ Database Schema

Built on Supabase PostgreSQL:

- **`profiles`** — User accounts (phone, role, name)
- **`products`** — Product catalog (books, stationery, gifts)
- **`categories`** — Product categories
- **`stores`** — Lucknow depot locations with geodetic coordinates
- **`orders`** — Order management with delivery tracking
- **`order_items`** — Line items per order
- **`coupons`** — Discount coupon system
- **`support_tickets`** — Customer support

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| [`mobile/app/_layout.tsx`](mobile/app/_layout.tsx) | Root navigation stack |
| [`mobile/app/index.tsx`](mobile/app/index.tsx) | Entry redirect to onboarding |
| [`mobile/metro.config.js`](mobile/metro.config.js) | Monorepo Metro bundler config |
| [`mobile/src/store/index.ts`](mobile/src/store/index.ts) | Zustand state interfaces |
| [`mobile/src/services/supabaseClient.ts`](mobile/src/services/supabaseClient.ts) | Supabase client setup |
| [`customer/src/app/globals.css`](customer/src/app/globals.css) | Global CSS design tokens |
| [`supabase/migrations/`](supabase/migrations/) | Database schema |

---

## 🔧 Monorepo Notes

This project uses **npm workspaces** with a React version split:

- `customer` + `admin` → **React 18.x** (Next.js requirement)
- `mobile` → **React 19.1** (React Native 0.81 requirement)

The `mobile` workspace uses `--no-workspaces` local installation to prevent npm from hoisting the wrong React version to root `node_modules`.

---

## 📄 License

MIT © 2025 Pustora / Shaurya

---

<div align="center">
  <strong>Built with ❤️ for students and families across Lucknow</strong>
</div>
