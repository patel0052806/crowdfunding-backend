# Crowdfunding Platform

This is a full-stack crowdfunding platform with a React frontend and a Node.js backend.

## Frontend

The frontend is built with React and Vite. It allows users to browse campaigns, make donations, and create their own campaigns.

## Backend

The backend is a Node.js/Express application that provides a REST API for the frontend. It uses MongoDB for the database.

### CORS Configuration

CORS is handled by the `vercel.json` file, which allows requests from any origin. This is for development purposes and should be configured with a more restrictive policy for production.

### Email Notifications

The application can send emails via SendGrid (production) or Nodemailer/Ethereal (development). A new feature delivers notification emails to **all registered users** whenever a campaign is added or approved. Admins can add campaigns directly or approve pending ones; in both cases users receive a brief announcement with a link to the campaign.

- Use the `FRONTEND_URL` environment variable to control the link that appears in emails (defaults to `http://localhost:3000`).
- The `sendEmail` utility is used throughout controllers. For testing purposes it is mocked.

Be sure to configure SMTP or SendGrid credentials in your `.env`.

### Seeding Example Campaigns

If you just want some data to play with, there is a helper script that will wipe
and repopulate the `campaigns` collection with ten example records (five
approved, five pending).  Run it with:

```bash
cd backend
node scripts/seedCampaigns.js
```

After running the seed script, the `/api/data/campaigns` endpoint will return a
couple of approved campaigns immediately.  The pending ones can be viewed and
approved via the admin dashboard at `/admin/dashboard`.

You can also add campaigns manually using the front‑end `Add Campaign` form (if
logged in as an admin) or the `/api/data/apply` endpoint for regular users.
