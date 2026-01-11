# Crowdfunding Platform

This is a full-stack crowdfunding platform with a React frontend and a Node.js backend.

## Frontend

The frontend is built with React and Vite. It allows users to browse campaigns, make donations, and create their own campaigns.

## Backend

The backend is a Node.js/Express application that provides a REST API for the frontend. It uses MongoDB for the database.

### CORS Configuration

CORS is handled by the `vercel.json` file, which allows requests from any origin. This is for development purposes and should be configured with a more restrictive policy for production.
