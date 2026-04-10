# Mosque Donation Tracker MVP

## Overview

Build a mobile-first, fully responsive Mosque Donation Tracker using:

- Next.js
- Tailwind CSS
- Supabase
- Vercel
- GitHub

The app should have 2 UI areas:

1. Public visitor dashboard
2. Admin dashboard

Public users can view donation data.
Only admins can log in and manage campaigns and donations.

Important rules:
- No register page
- No sign-up button
- Admin users are created manually in Supabase
- Public users do not need login
- Admin updates should reflect on the public dashboard
- Claude must also provide SQL scripts for Supabase setup
- Claude must also provide `.env.local.example` file

---

## Main Goal

Create a simple and transparent donation tracker for a mosque or community.

The app is not for collecting payments.
It is only for tracking donations already received.

---

## Tech Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS
- Backend/Data: Supabase Postgres
- Auth: Supabase Auth
- Hosting: Vercel
- Version Control: GitHub

---

## Core Requirements

- Mobile first
- Fully responsive
- Clean and modern UI
- Public dashboard for visitors
- Admin-only login
- Admin can manage campaigns
- Admin can manage donations
- Public data updates after admin changes
- Search donations by:
  - donor name
  - donor phone number
  - year
- Each campaign has its own details page
- Admin can download PDF report for each campaign

---

## User Roles

### 1. Public Visitor
Public users can:
- Visit the dashboard
- View total donations
- View donation table
- Search donations
- Filter donations by year
- View campaigns
- Open campaign details pages

Public users cannot:
- Log in as admin
- Add data
- Edit data
- Delete data

### 2. Admin
Admins can:
- Log in through `/login`
- Create campaigns
- Edit campaigns
- Delete campaigns
- Add donations
- Edit donations
- Delete donations
- Download campaign PDF reports

Important:
- Admin user must be created manually in Supabase
- No account creation from UI

---

## Pages

### 1. Public Dashboard `/`
This is the main page for visitors.

#### Top Section
- App title: Mosque Donation Tracker
- Total donations summary
- Login button on top right

#### Search and Filter Section
- Search by donor name
- Search by donor phone number
- Filter by year

#### Main Donations Table
Table should be horizontally scrollable on small screens.

Columns:
- Donor Name
- Campaign
- Amount
- Date
- Phone Number

#### Campaign Section
Below the donation table, show all campaigns created by admin.

Each campaign card or row should show:
- Campaign name
- Total amount collected
- Optional short description

Each campaign should be clickable.
Clicking a campaign navigates to `/campaign/[id]`

---

### 2. Campaign Details Page `/campaign/[id]`
Public page.

#### Top Section
- Campaign name
- Campaign description
- Total amount collected

#### Donations Table
Columns:
- Donor Name
- Date
- Amount
- Phone Number

Optional:
- Campaign start date
- Campaign end date
- Created date

---

### 3. Admin Login `/login`
Only admins use this page.

Requirements:
- Email input
- Password input
- Login button
- No register button
- No sign-up page
- No public account creation

After successful login:
- Redirect to `/admin`

---

### 4. Admin Dashboard `/admin`
Protected page.
Only logged-in admin can access.

Main sections:
- Campaign management
- Donation management
- Report download

---

## Public Dashboard Features

### Summary Section
Show:
- Total donation amount
- Total number of donations
- Total number of campaigns

Optional later:
- Total donations this year

### Search and Filter
- Search by donor name
- Search by donor phone number
- Filter by year

Search should update table results.

### Donations Table
Columns:
- Donor Name
- Campaign
- Amount
- Date
- Phone Number

Behavior:
- Scrollable on mobile
- Responsive layout
- Latest donations first

### Campaign List
Show all campaigns created by admin.

Each campaign should display:
- Campaign name
- Total amount
- Link to view details

---

## Admin Dashboard Features

### Campaign Management
Admin can:
- Create campaign
- Edit campaign
- Delete campaign

Campaign fields:
- Name
- Description
- Start date
- End date
- Active status

### Donation Management
Admin can:
- Add donation
- Edit donation
- Delete donation
- Assign donation to a campaign

Donation fields:
- Donor name
- Donor phone number
- Campaign
- Amount
- Donation date
- Notes

### Reports
For each campaign:
- Download PDF report

PDF report should include:
- Campaign name
- Total amount
- Donation list
- Donor name
- Donor phone number
- Donation amount
- Donation date

---

## Database Design

Use 2 main tables:

1. campaigns
2. donations

Each donation belongs to one campaign.

---

## Table 1: campaigns

Fields:
- id
- name
- description
- start_date
- end_date
- is_active
- created_at
- updated_at

### campaign fields details
- id: uuid primary key
- name: text required
- description: text nullable
- start_date: date nullable
- end_date: date nullable
- is_active: boolean default true
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

---

## Table 2: donations

Fields:
- id
- donor_name
- donor_phone
- campaign_id
- amount
- donation_date
- notes
- created_at
- updated_at

### donation fields details
- id: uuid primary key
- donor_name: text required
- donor_phone: text nullable
- campaign_id: uuid required references campaigns(id)
- amount: numeric required
- donation_date: date required
- notes: text nullable
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

---

## Validation Rules

### Campaign validation
- name is required

### Donation validation
- donor_name is required
- campaign_id is required
- amount is required
- amount must be greater than 0
- donation_date is required

---

## Security Rules

### Public users
- Can read campaigns
- Can read donations
- Cannot insert
- Cannot update
- Cannot delete

### Admin users
- Can read campaigns and donations
- Can insert campaigns and donations
- Can update campaigns and donations
- Can delete campaigns and donations

Important:
- Enable Row Level Security on both tables
- Public should have read-only access
- Authenticated admin should have write access only if they are marked as admin

---

## Admin Authentication Rules

- No register page
- No sign-up button
- No signup flow in UI
- Admin accounts are manually created in Supabase Auth
- Only admin can access `/admin`
- If not logged in, redirect to `/login`

Important:
Do not assume every authenticated user is admin.
Create a user role system in the database.

---

## Recommended Role Setup

Create a `profiles` table.

Each authenticated user should have:
- id
- email
- role

Role values:
- admin
- user

For this project:
- only admin role will be used

This gives better security than trusting all logged-in users.

---

## Table 3: profiles

Fields:
- id
- email
- role
- created_at

### profile fields details
- id: uuid primary key references auth.users(id) on delete cascade
- email: text
- role: text default 'user'
- created_at: timestamptz default now()

Validation:
- role must be either `admin` or `user`

Use this table in RLS policies to allow only admins to write.

---

## Required SQL Script for Supabase

Claude should generate full SQL that includes:

1. Enable required extension
2. Create `profiles` table
3. Create `campaigns` table
4. Create `donations` table
5. Create updated_at trigger function
6. Add updated_at triggers
7. Enable RLS on all tables
8. Create public read policies
9. Create admin write policies
10. Add profile role check logic
11. Optional seed data

Claude must provide production-ready SQL.

### SQL requirements

#### Profiles table
- Must link to `auth.users`
- Must support admin role checking

#### Trigger
- Auto-update `updated_at` on row update

#### RLS requirements
- Public can select from campaigns and donations
- Only admin can insert/update/delete campaigns and donations
- Profiles should only be readable by the owner or admin, depending on design

#### Optional helper function
Claude can create helper function like:
- `is_admin()`

Example direction:
- Create a SQL function that checks whether `auth.uid()` exists in profiles with role = 'admin'
- Use that function in RLS policies

---

## Admin Setup in Supabase

Claude should include setup instructions:

1. Create Supabase project
2. Run SQL script in SQL Editor
3. Go to Authentication
4. Create admin user manually
5. Insert matching row in `profiles` table with role = 'admin'
6. Disable public signup in Supabase Auth settings

Important:
The app must not include signup UI.

---

## UI Requirements

### Design Style
- Clean
- Modern
- Minimal
- Easy to read
- Mobile first
- Fully responsive

### Mobile-first behavior
- Summary cards stack vertically
- Search filters stack vertically
- Tables scroll horizontally
- Buttons are easy to tap
- Admin forms are mobile friendly

### Desktop behavior
- Wider table layout
- Multi-column sections where needed
- Better spacing

---

## Public UI Structure

### Navbar
- App name
- Login button

### Summary cards
- Total donations
- Total donations count
- Total campaigns

### Search and filters
- Search donor name
- Search donor phone number
- Filter year

### Donations table
- Scrollable
- Responsive
- Sorted by latest date first

### Campaign list
- Cards or simple list
- Clickable to view details

---

## Admin UI Structure

### Navbar
- Admin dashboard title
- Logout button

### Campaign section
- Campaign form
- Campaign list with edit and delete actions

### Donation section
- Donation form
- Donation list with edit and delete actions

### Reports section
- Button to download PDF by campaign

---

## PDF Report Requirements

For each campaign, admin should be able to download a PDF report.

PDF should include:
- Mosque name or app name
- Campaign name
- Campaign date range if available
- Total amount collected
- Donation table

Donation table inside PDF:
- Donor Name
- Phone Number
- Amount
- Date

Suggested PDF file name:
- `campaign-name-report.pdf`

Claude should choose a simple PDF solution.
Possible options:
- jsPDF
- pdf-lib
- react-pdf
- server-side HTML to PDF if preferred

Keep MVP simple.

---

## Search Logic

Public dashboard should support:
- Search by donor name
- Search by donor phone number
- Filter by year

Campaign page can optionally support:
- Search within that campaign only

Search can be client-side for MVP if dataset is small.
If needed, Claude can implement server-side query filtering.

---

## Sorting

Default sorting:
- Latest donation date first

Optional:
- Sort campaigns by latest created

---

## Folder Structure Suggestion

```bash
app/
  page.tsx
  login/page.tsx
  admin/page.tsx
  campaign/[id]/page.tsx
  layout.tsx
  globals.css

components/
  navbar.tsx
  summary-cards.tsx
  donations-table.tsx
  search-filters.tsx
  campaign-list.tsx
  campaign-form.tsx
  donation-form.tsx
  admin-campaign-table.tsx
  admin-donation-table.tsx

lib/
  supabase/
    client.ts
    server.ts
    middleware.ts
  utils.ts
  pdf.ts

types/
  campaign.ts
  donation.ts
  profile.ts