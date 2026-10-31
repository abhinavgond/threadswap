# Product Requirements Document: ThreadSwap, Clothing Exchange & Swap Marketplace

## 1. Overview
Fast fashion drives textile waste. Many people own wearable clothes they do not use, but selling or donating is inconvenient. ThreadSwap lets members swap clothes directly, with no payments, using value-based suggestions and location-based matching. It promotes a barter economy and sustainable fashion. Reference platforms: Depop, Poshmark, Swap.com.

## 2. Problem Statement
- People have unused clothes but no easy way to exchange them.
- Existing platforms focus on buying and selling, with complicated pricing.
- There are few platforms dedicated to swapping, so sustainable options are limited.

## 3. Objectives
**Primary:** a marketplace dedicated to clothing exchange; direct swaps with no money; sustainable fashion; location-based matching.
**Secondary:** negotiation before finalizing; estimated swap value; filter by category and location; courier option for remote swaps; a community around sustainable fashion.

## 4. Scope
**Phase 1 (in scope):** registration and login, clothing listings, swap requests, negotiation chat, swap value calculator, location-based suggestions, admin panel.
**Out of scope:** online payments, AI recommendations, AR try-on, mobile app.

## 5. Users
- **Member:** lists clothes, browses, requests and negotiates swaps.
- **Admin:** moderates users and listings, resolves disputes, reads analytics.

## 6. Functional Requirements
| ID | Module | Requirement |
|---|---|---|
| FR1 | User | Register, log in, edit profile (name, city, phone), view swap history |
| FR2 | Listing | Add title, category, brand, size, condition, city, photo; set estimated swap value; show availability status; edit, pause, remove |
| FR3 | Browse | Search; filter by category, city and distance; nearest-first sorting |
| FR4 | Swap request | Send a request with a chosen item; view incoming and outgoing requests; accept, decline or cancel; track status (pending, accepted, completed, rejected, cancelled) |
| FR5 | Chat | Direct messages per swap; discuss and negotiate; both members confirm the agreement; the swap then completes and items are marked swapped |
| FR6 | Value calculator | Value from brand, condition and category; side-by-side comparison; verdict: fair (within 15%), close (within 35%), uneven |
| FR7 | Location | Distance between member and item cities; radius filter; nearby suggestions |
| FR8 | Admin | Manage users and listings; monitor swaps; remove inappropriate listings; resolve disputes; analytics |

## 7. Non-Functional Requirements
Secure authentication (bcrypt password hashes, JWT, login rate limiting); mobile-responsive design (Bootstrap); fast search (server-side filters); secure data storage (MongoDB, no plain-text passwords); input validation on server; privacy (phone and email are not shown to other members); scalable design (stateless API, MongoDB Atlas).

## 8. Technology
React.js with Bootstrap, Node.js + Express.js, MongoDB (Mongoose), deployed on Render with MongoDB Atlas.

## 9. Pages
Login, Clothing Listings, Item Detail, Swap Request, Chat, User Dashboard, Admin Panel (7 pages).

## 10. Data Model
**User:** name, email, password hash, city, phone, role. **Item:** owner, title, category, brand, size, condition, city, swap value, description, image, status. **Swap:** from, to, fromItem, toItem, status, confirmations, dispute. **Message:** swap, sender, text, system flag.

## 11. User Flow
Register or log in, create profile, upload listings, browse, send swap request, negotiate in chat, confirm, ship or meet locally. **Admin flow:** monitor activity, manage listings, resolve disputes, read reports.

## 12. KPIs
Number of listings; successful swaps; engagement rate (active users / all users); swap request conversion rate (accepted or completed / all requests); active users. All are shown on the admin Analytics tab.

## 13. Assumptions and Constraints
**Assumptions:** members want to swap; listing details are accurate; couriers support exchanges.
**Constraints:** item quality depends on members; fairness depends on negotiation; shipping costs may affect decisions.

## 14. Deliverables
Working marketplace, listing and browsing, swap and negotiation, location matching, admin panel, live deployed link, this PRD.

## 15. Expected Impact
Less textile waste, promotion of sustainable fashion, low-cost clothing access, community-driven exchange, reduced fast-fashion impact.

## 16. Future Enhancements
AI swap recommendations, mobile app, condition verification, sustainability impact tracker, community fashion groups.

## 17. Testing Checklist
Register with bad input and see errors; log in; add, edit, pause and remove a listing; filter by city and distance; send a swap request; accept it as the other member; chat; both confirm and see the swap complete; report a dispute and resolve it as admin; check the admin analytics numbers.
