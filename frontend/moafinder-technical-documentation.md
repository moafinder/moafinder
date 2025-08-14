# MoaFinder Technical Documentation & Implementation Guide

## Project Information
- **Project Name**: MoaFinder
- **Version**: 1.0.0
- **Last Updated**: August 2025
- **Tech Lead**: Lukasz Ospi
- **Client**: REFORMATIONS-Campus e.V. / Kiez Machen / REFO

---

## 1. Executive Summary

MoaFinder is a community-driven event and location discovery platform for Moabit, Berlin. The platform enables organizations to submit events and activities, which are then reviewed and approved by an editorial team before being published for public access.

### Key Features
- Event and activity listings with filtering capabilities
- Interactive map of Moabit locations
- User registration system for event organizers
- Editorial approval workflow
- Automatic content expiration and renewal system
- Multi-language support (future enhancement)
- Accessibility features

### Technical Approach
- **Frontend**: React with Vite build tool
- **CMS**: Payload CMS (Headless)
- **Database**: MongoDB
- **Hosting**: IONOS (cost-optimized solution)
- **Estimated Cost**: ~20€/year total

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                               │
└─────────────┬───────────────────────┬──────────────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐     ┌────────────────────┐
│   Public Website    │     │   Admin Dashboard  │
│   (React + Vite)    │     │   (Payload Admin)  │
└─────────┬───────────┘     └────────┬───────────┘
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────┐
│            Payload CMS API Layer                 │
│         (Node.js + Express + GraphQL)           │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              MongoDB Database                    │
│         (Events, Locations, Users, etc.)        │
└─────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose | Cost |
|-------|------------|---------|------|
| Frontend | React 18 + Vite | User interface | Free |
| Styling | Tailwind CSS | Responsive design | Free |
| CMS | Payload CMS 2.x | Content management | Free (Open Source) |
| Database | MongoDB | Data storage | Free tier / Included with IONOS |
| Runtime | Node.js 18+ | Server environment | Included with hosting |
| Hosting | IONOS | Infrastructure | 1€/month |
| Domain | moafinder.moabit.world | Web address | ~5€/year |
| Backups | IONOS Backup Service | Data protection | 7€/month (optional) |

### 2.3 Database Schema

```javascript
// Core Collections Structure
Collections = {
  organizations: {
    // User accounts for event organizers
    id: ObjectId,
    name: String,
    email: String (unique),
    password: String (hashed),
    contactPerson: String,
    address: Object,
    website: String,
    phone: String,
    logo: MediaId,
    approved: Boolean,
    createdAt: Date,
    role: Enum['organizer', 'editor', 'admin']
  },
  
  events: {
    // Individual events and recurring activities
    id: ObjectId,
    title: String (max 70),
    subtitle: String (max 100),
    eventType: Enum['einmalig', 'täglich', 'wöchentlich', 'monatlich'],
    startDate: Date,
    endDate: Date,
    timeFrom: String,
    timeTo: String,
    description: String (max 1000),
    image: MediaId,
    location: LocationId,
    organizer: OrganizationId,
    isAccessible: Boolean,
    isFree: Boolean,
    costDetails: String,
    registrationRequired: Boolean,
    registrationDetails: String,
    tags: [TagId],
    status: Enum['draft', 'pending', 'approved', 'archived'],
    expiryDate: Date,
    lastRenewalReminder: Date
  },
  
  locations: {
    // Physical locations in Moabit
    id: ObjectId,
    name: String,
    shortName: String (max 40),
    description: String,
    image: MediaId,
    address: {
      street: String,
      number: String,
      postalCode: String,
      city: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    mapPosition: {
      x: Number (percentage),
      y: Number (percentage)
    },
    openingHours: String
  },
  
  tags: {
    // Categories for filtering
    id: ObjectId,
    name: String,
    slug: String,
    category: String,
    color: String
  },
  
  media: {
    // Uploaded files
    id: ObjectId,
    filename: String,
    mimeType: String,
    filesize: Number,
    url: String,
    alt: String
  }
}
```

---

## 3. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Set up development environment
- [ ] Initialize Payload CMS project
- [ ] Configure MongoDB connection
- [ ] Set up basic collections structure
- [ ] Create development database

### Phase 2: CMS Development (Week 2)
- [ ] Implement Organizations collection with auth
- [ ] Create Events collection with all fields
- [ ] Set up Locations collection
- [ ] Configure media uploads
- [ ] Implement access control rules
- [ ] Create editorial workflow

### Phase 3: Frontend Integration (Week 3)
- [ ] Create API service layer
- [ ] Update React components to use Payload API
- [ ] Implement authentication flow
- [ ] Build event listing pages
- [ ] Create location/map page
- [ ] Develop event detail views

### Phase 4: User Features (Week 4)
- [ ] Organization registration system
- [ ] Event submission forms
- [ ] User dashboard for organizers
- [ ] Editorial review interface
- [ ] Email notification system
- [ ] Password recovery flow

### Phase 5: Advanced Features (Week 5)
- [ ] Interactive map implementation
- [ ] Advanced filtering system
- [ ] Search functionality
- [ ] Auto-archiving system
- [ ] Renewal reminder automation
- [ ] Analytics integration

### Phase 6: Testing & Deployment (Week 6)
- [ ] Unit testing
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## 4. API Specification

### 4.1 Public Endpoints

```typescript
// Get all approved events
GET /api/events
Query params: {
  where: {
    status: { equals: 'approved' },
    startDate: { greater_than: Date }
  },
  limit: 20,
  page: 1,
  sort: 'startDate'
}

// Get single event
GET /api/events/:id

// Get all locations
GET /api/locations

// Search events
GET /api/events/search
Query params: {
  q: string,
  tags: string[],
  location: string,
  date: Date
}
```

### 4.2 Authenticated Endpoints

```typescript
// Organization login
POST /api/organizations/login
Body: { email: string, password: string }

// Create event (requires auth)
POST /api/events
Headers: { Authorization: 'Bearer {token}' }
Body: { ...eventData }

// Update event (requires ownership or editor role)
PATCH /api/events/:id
Headers: { Authorization: 'Bearer {token}' }
Body: { ...updates }

// Approve event (requires editor role)
PATCH /api/events/:id/approve
Headers: { Authorization: 'Bearer {token}' }
```

---

## 5. User Workflows

### 5.1 Event Organizer Journey

```mermaid
graph LR
    A[Registration] --> B[Email Verification]
    B --> C[Profile Creation]
    C --> D[Submit Event]
    D --> E[Pending Review]
    E --> F{Approved?}
    F -->|Yes| G[Published]
    F -->|No| H[Revision Required]
    H --> D
    G --> I[Manage Events]
```

### 5.2 Editorial Workflow

1. **New Submission Alert**: Email notification to editors
2. **Review Queue**: Dashboard showing pending events
3. **Content Review**: Check for quality and appropriateness
4. **Decision**: Approve, reject, or request changes
5. **Notification**: Automated email to organizer
6. **Publication**: Immediate visibility on public site

### 5.3 Automatic Processes

| Process | Trigger | Action |
|---------|---------|--------|
| Event Archiving | End date passed | Move to archive, remove from listings |
| Renewal Reminder | 12 months after creation | Email to organizer |
| Final Warning | 17 months after creation | Urgent renewal email |
| Auto-Archive | 18 months without update | Archive and notify |
| Daily Cleanup | Every 24 hours | Remove expired content |

---

## 6. Security Considerations

### 6.1 Authentication
- JWT tokens with 24-hour expiry
- Refresh tokens for extended sessions
- Password hashing using bcrypt
- Rate limiting on login attempts

### 6.2 Authorization
- Role-based access control (RBAC)
- Field-level permissions
- API key authentication for external services
- CORS configuration for frontend domain only

### 6.3 Data Protection
- GDPR compliance for user data
- Regular backups (automated daily)
- SSL/TLS encryption for all traffic
- Input sanitization and validation

---

## 7. Performance Requirements

### 7.1 Target Metrics
- Page Load Time: < 3 seconds
- API Response Time: < 500ms
- Concurrent Users: 500+
- Database Entries: Up to 5,500 active
- Weekly Submissions: 20-100
- Uptime: 99.9%

### 7.2 Optimization Strategies
- CDN for static assets
- Image optimization and lazy loading
- Database indexing on frequently queried fields
- API response caching
- Pagination for large datasets
- Progressive Web App features

---

## 8. Deployment Configuration

### 8.1 Environment Variables

```bash
# Production Environment (.env.production)
NODE_ENV=production
PAYLOAD_SECRET=<generated-secret-key>
MONGODB_URI=mongodb://username:password@host:port/database
PAYLOAD_PUBLIC_SERVER_URL=https://api.moafinder.moabit.world
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=moafinder@moabit.world
SMTP_PASS=<email-password>
FRONTEND_URL=https://moafinder.moabit.world
```

### 8.2 IONOS Deployment Steps

```bash
# 1. Build Payload CMS
cd backend
npm run build

# 2. Build React Frontend
cd ../frontend
npm run build

# 3. Deploy to IONOS via FTP/SSH
scp -r backend/dist/* user@server:/var/www/api
scp -r frontend/dist/* user@server:/var/www/public

# 4. Install dependencies on server
ssh user@server
cd /var/www/api
npm install --production

# 5. Start with PM2
pm2 start server.js --name moafinder-api
pm2 save
pm2 startup
```

### 8.3 Backup Strategy

```yaml
Backup Configuration:
  Schedule: Daily at 02:00 CET
  Retention: 30 days
  Storage: IONOS Backup Space
  Includes:
    - MongoDB database dump
    - Uploaded media files
    - Configuration files
  Recovery Time Objective: < 4 hours
  Recovery Point Objective: < 24 hours
```

---

## 9. Maintenance Procedures

### 9.1 Daily Tasks
- Monitor error logs
- Check submission queue
- Verify backup completion

### 9.2 Weekly Tasks
- Review and approve submissions (20-100 expected)
- Check performance metrics
- Update content as needed
- Review user feedback

### 9.3 Monthly Tasks
- Security updates
- Performance analysis
- Database optimization
- User statistics review

### 9.4 Annual Tasks
- Major version updates
- Security audit
- Performance testing
- Database cleanup
- SSL certificate renewal

---

## 10. Troubleshooting Guide

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Login fails | Incorrect credentials | Check email/password, reset if needed |
| Events not showing | Not approved yet | Check status in admin panel |
| Map markers missing | Coordinates not set | Update location with map position |
| Emails not sending | SMTP configuration | Verify SMTP settings in .env |
| Slow performance | Database queries | Add indexes, optimize queries |
| Upload fails | File size limit | Increase limit in Payload config |

---

## 11. Development Guidelines

### 11.1 Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Write unit tests for critical functions
- Document complex logic with comments
- Use meaningful variable names

### 11.2 Git Workflow
```bash
main
├── develop
│   ├── feature/user-registration
│   ├── feature/event-management
│   └── feature/map-integration
└── hotfix/critical-bug
```

### 11.3 Testing Strategy
- Unit Tests: Jest for business logic
- Integration Tests: Supertest for API
- E2E Tests: Playwright for user flows
- Performance Tests: Lighthouse CI
- Accessibility Tests: axe-core

---

## 12. Future Enhancements

### Planned Features (Post-Launch)
1. **Multi-language Support**: German/English/Arabic
2. **Mobile App**: React Native application
3. **Advanced Analytics**: User behavior tracking
4. **Social Features**: Comments and ratings
5. **Calendar Integration**: iCal/Google Calendar export
6. **Newsletter System**: Automated weekly digest
7. **Partner API**: External event integration
8. **PWA Features**: Offline support, push notifications

---

## 13. Contact & Support

### Development Team
- **Frontend Developer**: [Your Name]
- **Backend Developer**: [Team Member]
- **UI/UX Designer**: [Designer Name]
- **Project Manager**: [PM Name]

### Client Contacts
- **Kiez Machen**: kiez-machen@moabit.world
- **REFO**: info@refo-moabit.de
- **Editorial Team**: moafinder@moabit.world

### Resources
- **Repository**: [GitHub/GitLab URL]
- **Documentation**: This document
- **Figma Designs**: [Figma URL]
- **Staging Environment**: staging.moafinder.moabit.world
- **Production**: moafinder.moabit.world

---

## Appendix A: Payload CMS Configuration Example

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config';
import { Organizations } from './collections/Organizations';
import { Events } from './collections/Events';
import { Locations } from './collections/Locations';
import { Tags } from './collections/Tags';
import { Media } from './collections/Media';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Organizations.slug,
    bundler: viteBundler(),
    meta: {
      titleSuffix: '- MoaFinder CMS',
      favicon: '/favicon.ico',
    },
  },
  collections: [
    Organizations,
    Events,
    Locations,
    Tags,
    Media,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  cors: [
    'https://moafinder.moabit.world',
    'http://localhost:5173', // Dev environment
  ],
  csrf: [
    'https://moafinder.moabit.world',
  ],
});
```

---

## Appendix B: Sample Environment Configuration

```bash
# Development (.env.development)
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/moafinder-dev
PAYLOAD_SECRET=development-secret-key-change-in-production
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Production (.env.production)
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/moafinder
PAYLOAD_SECRET=<generate-secure-random-string>
PAYLOAD_PUBLIC_SERVER_URL=https://api.moafinder.moabit.world
FRONTEND_URL=https://moafinder.moabit.world
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=moafinder@moabit.world
SMTP_PASS=<secure-password>
```

---

*Document Version: 1.0.0*  
*Last Updated: August 2025*  
*Next Review: September 2025*