# E-SERVE Nexus

A modern restaurant ordering and management web application built with HTML, CSS, JavaScript, Node.js, Express.js, and Socket.IO. E-SERVE Nexus provides an interactive food-ordering experience with real-time order updates and kitchen management features.

## Screenshots

<!-- Add your actual website screenshots to the screenshots folder. -->

### Homepage

![E-SERVE Nexus Homepage](https://github.com/user-attachments/assets/595129d2-45ff-47b2-9aa5-e2fc88a644ac)


### Food Menu

![E-SERVE Nexus Food Menu](https://github.com/user-attachments/assets/7740b9ec-56b1-4000-9c45-8348fd2c8e5a)


### Order Tracking

![E-SERVE Nexus Order Tracking](https://github.com/user-attachments/assets/4a851b21-7ff9-41b4-8c47-28745908e4a1)


### Kitchen Dashboard

![E-SERVE Nexus Kitchen Dashboard](https://github.com/user-attachments/assets/3ff6e41b-5388-431c-8698-99449fef04c4)


### Admin Dashboard

![E-SERVE Nexus Admin Dashboard](https://github.com/user-attachments/assets/83a409bb-56b0-4f1e-9e6e-f27cd6f873ef)


## Features

- **Interactive Menu:** Browse food items with images, descriptions, prices, and categories.
- **Search and Filters:** Find food items and filter them by category.
- **Shopping Cart:** Add or remove items and view the order total.
- **Order Placement:** Submit restaurant orders through the application.
- **Order Tracking:** Track order progress and status.
- **Kitchen Management:** View incoming orders and update their statuses.
- **Admin Dashboard:** View restaurant analytics, popular items, and recent orders.
- **Real-Time Updates:** Use Socket.IO for live order updates.
- **Responsive Design:** Access the interface on desktop and mobile screens.
- **Persistent Storage:** Store application data in a local JSON file.

## Technology Stack

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript

**Backend**
- Node.js
- Express.js
- Socket.IO

**Data Storage**
- JSON file-based storage

**Development Tools**
- Visual Studio Code
- Git and GitHub
- npm

## Project Structure

```text
E-SERVE-NEXUS/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── data/
│   ├── .gitkeep
│   └── store.json
├── screenshots/
│   ├── homepage.png
│   ├── menu.png
│   ├── order-tracking.png
│   ├── kitchen-dashboard.png
│   └── admin-dashboard.png
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- Git (optional, for cloning the repository)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Munavvara-17/E-SERVE-NEXUS.git
cd E-SERVE-NEXUS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Check `.env.example` for the environment variables supported by the project. If the application requires them, create a local `.env` file and configure the appropriate values.

Do not upload secrets or private credentials to GitHub.

### 4. Start the Application

Run the configured start script:

```bash
npm start
```

If no `start` script exists in `package.json`, use the command appropriate for your project, such as:

```bash
node server.js
```

### 5. Open the Website

Visit the following address in your browser:

```text
http://localhost:3000
```

## How It Works

1. Users browse the available food items.
2. They search the menu, select items, and add them to the cart.
3. The application calculates the order total.
4. Users submit their orders.
5. Kitchen staff view incoming orders and update their statuses.
6. Socket.IO delivers real-time updates to connected clients.
7. The admin dashboard displays available order and sales analytics.

## Future Improvements

- Integrate a production database such as MongoDB or PostgreSQL.
- Add secure user authentication and role-based authorization.
- Integrate an online payment gateway.
- Add automated tests and stronger input validation.
- Deploy the application to a cloud hosting platform.
- Improve accessibility and performance.
- Add customer order history and notifications.

## Learning Outcomes

This project demonstrates practical experience with:

- Frontend development using HTML, CSS, and JavaScript.
- REST API development with Node.js and Express.js.
- Real-time communication using Socket.IO.
- Shopping cart and order-management logic.
- Git version control and GitHub repository management.
- Organizing a full-stack web application.

## Author

**Munavvara Nayab**

GitHub: [Munavvara-17](https://github.com/Munavvara-17)

## License

This project is intended for learning and portfolio demonstration. Add a `LICENSE` file if you want to specify the terms under which others may use, modify, or distribute the code.
