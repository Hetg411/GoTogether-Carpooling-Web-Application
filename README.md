# GoTogether – Carpooling Web Application

A full-stack carpooling platform that connects drivers and riders in real time. Users select their source, destination, and role (driver or rider), get matched with nearby complementary users, and track each other live on the map.

## Features
- Secure user authentication and session management
- Source/destination selection with role-based matching (driver or rider)
- Geolocation-matching algorithm using the Google Maps API to convert addresses into coordinates and identify nearby users within a 1 km radius
- Real-time ride request system — accept or reject requests before a trip starts
- WebSocket-based live location sharing for continuous, real-time position tracking on the map

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Frontend/Templating:** EJS, JavaScript, HTML, CSS
- **Real-time Communication:** WebSockets
- **APIs:** Google Maps API

## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB instance (local or Atlas)
- Google Maps API key

### Installation
```bash
git clone https://github.com/Hetg411/GoTogether-Carpooling-Web-Application.git
cd GoTogether-Carpooling-Web-Application
npm install
```

### Environment Variables
Create a `.env` file in the root directory with:### Run the App
```bash
npm start
```
Visit `http://localhost:3000` in your browser.

## Usage
1. Sign up / log in.
2. Choose your role (driver or rider) and enter source and destination.
3. Get matched with nearby users within a 1 km radius.
4. Accept or reject ride requests.
5. Track live location updates once a ride starts.

## Author
**Het Gajjar**
[GitHub](https://github.com/Hetg411) · [LinkedIn](https://linkedin.com/in/het-gajjar-04n2004/)
