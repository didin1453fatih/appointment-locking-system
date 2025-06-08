# Appointment Locking System

## The System
This system appointment locking system build with sperate backend and frontend. Backend build with NestJS and Frontend build with ReactJS with NextJS. For running the system locally, you need to run both backend and frontend servers. In below section, I will explain how to run the system locally.

## Backend
I used NestJS for the backend framework. Why i choost nestJS compared with expressJS ? Because i need speed up development below one week. ExpressJS minimalist, but this need many of configuration compared with NestJS. With NestJS there are many helper and decoration for speed up pre development config. When I develop app, there are required tools for my perfectionist mindset:
1. Database Migration
2. ORM (Object Relational Mapping)
3. API Documentation
4. Validation Request (DTO)
5. Authentication and Authorization
6. Consistent Error Handling And Response
7. Unit Testing
When i used expressJS, i can understand that i need to implement all of this tools manually. And i understand about depedency and scurity. For enterprise application i choose ExpressJS. But for this case i choose NestJS.

## High Light Features
I add capability in this backend for development will be easy and fast. I add feature like:
- **Rest API Documentation**: I use Swagger for API documentation. It will reflect the current state of codebase and provide a user-friendly interface for testing endpoints.
- **Custom CLI Database Migrations**: I use TypeORM for database migrations. It allows you to manage your database schema changes in a structured way. I put at `/scripts/` directory for generate migration based on current models.
- **Database Locking**: I implement a locking mechanism at level database using add unique constrain of `appointmentId` in the `AppointmentLock` table. This ensures that only one user can hold a lock on an appointment at a time, preventing conflicts and ensuring data integrity.
- **Optimistic Locking**: I use optimistic locking with a `version` field in the `Appointment` table. This allows multiple users to read the same appointment data without conflicts, while still preventing overwrites when updates are made.
- **Backend Logic Locking**: I implement a locking mechanism at the backend level using a `appointment.service.ts` file. This file contains the logic for handling appointment locks, including acquiring and releasing locks, and managing user requests for control of locks.
- **Locking Unit Tests**: I write comprehensive test cases at `appointment.service.spec.ts` for the locking mechanism to ensure its reliability and correctness. These tests cover various scenarios, including acquiring locks, releasing locks, and handling conflicts.
- **Cron Job**: I implement a cron job to automatically release locks that have expired. If Cron job is not running, it still works because I add a logic in the `appointment.service.ts` if lock is expired, it will automatically release the lock when user try to acquire the lock.
- **Web Socket**: I use Socket.io for broadcast and sending real-time updates to the frontend. This allows the frontend to receive updates about appointment locks and changes in real-time, enhancing user experience.
- **Rate Limiting Locking**: I implement rate limiting to prevent abuse of the locking mechanism. This rate limit protect at API `appointment/:id/acquire-lock/:version`.
- **Admin Role Verification**: I implement an admin role verification to ensure that only authorized users can perform certain actions, such as force releasing locks and request control of appointments.

## **Request Control Workflow**: 
1. **User Requests Control**: A user requests control of an appointment lock by calling the API endpoint `POST /appointment/:id/request-control`.
2. **Check Only Admin Can Request Control**: The system checks if the user is an admin. If not, it returns an error.
3. **Check Lock Exists**: The system checks if a lock exists for the appointment. If not, it returns an error.
4. **Send To Owner Of Lock**: The system sends a request to the owner of the lock, asking them to release the lock via web socket.
5. **Owner Accepts or Rejects**: The owner of the lock can accept or reject the request.
6. **If Accepted**: If the owner accepts the request, it will hit the API endpoint `POST /appointment/:id/approve-request-control` to approve the request. The system will then update the lock to indicate that the user has control.

## **Force Release Workflow**:
1. **User Requests Force Release**: A user requests a force release of an appointment lock by calling the API endpoint `POST /appointment/:id/force-release-lock-request`.
2. **Check Only Admin Can Request Force Release**: The system checks if the user is an admin. If not, it returns an error.
3. **Check Lock Exists**: The system checks if a lock exists for the appointment. If not, it returns an error.
4. **Send To Owner Of Lock**: The system sends a request to the owner of the lock, asking them to release the lock via web socket.
5. **Owner Accepts or Rejects**: The owner of the lock can accept or reject the request.
6. **If Accepted**: If the owner accepts the request, it will hit the API endpoint `POST /appointment/:id/force-release-lock-approve` to approve the request. The system will then release the lock.

## Running the Backend System Locally
### Prerequisites
- Node.js (v20 or higher)
- NestJS CLI
- PostgreSQL (or any other database supported by TypeORM)
- npm
### Steps to Run the Backend
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/appointment-locking-system.git
   cd appointment-locking-system
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Copy .env.example to .env**:
    Create a `.env` file in the root directory of the project by copying the example file:
   ```bash
   cp .env.example .env
   ```
4. **Configure Database**: Update the `.env` file with your database connection details.
5. **Run Database Migrations**:
   ```bash
   npm run migration:run
   ```
6. **Start the Application**:
   ```bash
   npm run start:dev
   ```
7. **Access Swagger Documentation**: Open your browser and go to `http://localhost:3000/docs` to access the Swagger documentation for the API.


## Database Documentation
### Appointment

| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `id` | UUID (string) | No | Primary key, automatically generated |
| `title` | varchar | No | Title of the appointment |
| `patientName` | varchar | No | Name of the patient |
| `datebirth` | date | No | Date of birth of the patient |
| `gender` | varchar | No | Gender of the patient |
| `phone` | varchar | Yes | Contact phone number |
| `address` | text | Yes | Patient's address |
| `doctorName` | varchar | Yes | Name of the doctor |
| `note` | varchar | Yes | Short notes about the appointment |
| `description` | varchar | Yes | Longer description of the appointment |
| `startTime` | timestamp | No | Start time of the appointment |
| `endTime` | timestamp | No | End time of the appointment |
| `version` | integer | No | Version number for optimistic locking (defaults to 1) |
| `createdAt` | timestamp | No | Automatically managed timestamp of entity creation |
| `updatedAt` | timestamp | No | Automatically updated timestamp of last modification |

### Appointment Lock Table
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `id` | UUID (string) | No | Primary key, automatically generated |
| `appointmentId` | UUID (string) | No | Foreign key referencing the appointment |
| `userId` | UUID (string) | No | ID of the user who holds the lock |
| `requestControlByUserId` | UUID (string) | Yes | ID of the user who requested control of the lock |
| `requestForceReleaseByUserId` | UUID (string) | Yes | ID of the user who requested force release of the lock |
| `expiresAt` | timestamp | No | Expiration time of the lock |
| `createdAt` | timestamp | No | Automatically managed timestamp of entity creation |

#### Appointment Lock Table Indexes And Unique Constraints
- `id` (primary key): Unique identifier for each lock entry.
- `appointmentId` (foreign key): References the `id` in the Appointment table, linking the lock to a specific appointment. This set to unique to ensure that each appointment can only have one active lock at a time.
- `userId` (foreign key): References the `id` in the User table, indicating which user currently holds the lock.
- `requestControlByUserId` (foreign key): References the `id` in the User table, indicating which user requested control of the lock.
- `requestForceReleaseByUserId` (foreign key): References the `id` in the User table, indicating which user requested force release of the lock.

### User Table
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `id` | UUID (string) | No | Primary key, automatically generated |
| `name` | varchar | No | Name of the user |
| `email` | varchar | No | Email of the user |
| `password` | varchar | No | Password of the user |
| `isAdmin` | boolean | No | Indicates if the user is an admin |
| `createdAt` | timestamp | No | Automatically managed timestamp of entity creation |



# Frontend
![Appointment UI](./appointment-ui.png)
I Use ReactJs With NextJS for the frontend framework. 

**Why must NextJS?** Because i this is Mature reactjs framework. If i used reactjs i need implement how to deploy this appllication, how to handle routing and how to organize the codebase. NextJS provide all of this feature out of the box. When i need to deploy, i just connect this application to vercel and it will automatically deploy the application.

For Internal admin application, mostly i used client side rendering with export static HTML. Every js and css file is unique in every build. This allow to add cache control via header response. This great way to prevent unnecessary download. I think this strategy is like application in windows desktop era at 2009s. All of UI installed using .exe and data communication using database query connection.

## High Light Features
I try to create a balance between simplicity, functionality and beautiful user experience. I add feature like:
- **Agenda with calendar view**: For speedup development i use `react-big-calendar` for the agenda with calendar view. This allows users to see appointments in a calendar format, making it easy to navigate and manage appointments.
- **Customize react big calendar with css**: I customize the `react-big-calendar` with CSS to match the design and user experience of the application. This includes styling the calendar, appointments, and other UI elements to create a cohesive look and feel.
- **Realtime Update Appointments with latest database**: I use Socket.io to receive real-time updates from the backend. This allows the frontend to automatically update the appointment list and calendar view when changes occur, ensuring that users always see the latest data without needing to refresh the page.
- **Realtime Update Action Button based on appointment lock**: I implement real-time updates for action buttons based on the appointment lock status. This prevent user do wrong action on appointment. With UI we prevent wrong action.
- **Journey for update appointment**: I implement a journey for updating appointments. I add one step before user can update the appointment, this step is view the appointment details. This allows users to review the appointment information before making any changes. This is reduce locking conflicts and ensure that users are aware of the current state of the appointment. If this appointment is locked, user will see a message that the appointment is locked with **counting down timer** until the lock expires.
- **Admin Role Verification**: I implement an admin role checking to ensure that only admin users can perform certain actions, such as force releasing locks and requesting control of appointments.
- **Request / Approve Control of Appointment Lock**: I implement a feature that allows users to request control of an appointment lock. If the user is not the owner of the lock, they can request control, and the owner can approve or cancel the request. This is done via web socket for real-time updates.
- **Handle Tab/Window Close**: I implement a feature that handles the tab/window close event. I use combination of beforeunload and unload event in edit appointment page to prevent users from accidentally losing changes and to ensure there are no lock without user knowledge. If user confirm to close the tab/window, it will release the lock.
- **Broadcast Collaborative Cursor**: I implement a collaborative cursor feature that broadcasts the user's cursor position to other users in real-time. This allows users to see where others are currently working on the appointment, enhancing collaboration and reducing conflicts.
- **Cursor use aceternity animation**: I implement a cursor animation with aceternity animation.
- **Display Other User Pointers**: I implement a feature that displays other users' pointers in real-time.
- **Throttle Cursor**: I implement a throttling mechanism to limit the frequency of cursor position update. I use loadash throttle function to ensure that the cursor position is updated at a reasonable interval, reducing the load on the server and improving performance.

## Running the Frontend System Locally
### Prerequisites
- Node.js (v20 or higher)
- npm
### Steps to Run the Frontend
1. **Clone the Repository**:
   ```bash
   git clone   https://github.com/didin1453fatih/appointment-locking-system-fe
    cd appointment-locking-system-fe
    ```
2. **Install Dependencies**:
    ```bash
   npm install
   ```
3. **Copy .env.example to .env**:
    Create a `.env` file in the root directory of the project by copying the example file:
   ```bash
   cp .env.example .env
   ```
4. **Configure Backend URL**: Update the `.env` file with the URL of your backend server.
5. **Start the Application**:
   ```bash
   npm run dev
   ```
6. **Access the Application**: Open your browser and go to `http://localhost:3000` to access the application.   
