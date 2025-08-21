# PasteJet

PasteJet is a real-time collaborative coding and paste-sharing platform built with React, Vite, Firebase, and Tailwind CSS. Users can create, share, and collaborate on code snippets or text pastes, with features like syntax highlighting, real-time collaboration, customizable themes, and clipboard syncing across devices. The application supports public, unlisted, and password-protected pastes, with optional expiration dates and custom URLs for logged-in users. It also includes a user dashboard for managing pastes and a collaborative coding lab (CodeLab) for real-time editing with chat and audio features.

Deployed at: [https://pastejet.vercel.app](https://pastejet.vercel.app)

## Features

- **Paste Creation**: Create code or text pastes with support for multiple languages (e.g., JavaScript, Python, Java, C++, HTML, CSS, JSON, etc.) via the Home page.
- **Paste Viewing**: View pastes with syntax highlighting, copy/download options, view counts, and support for password-protected or expired pastes (`PasteView.jsx`).
- **User Dashboard**: Manage your pastes, filter/search them, update profile details, and delete pastes (`Dashboard.jsx`).
- **Clipboard Syncing**: Sync clipboard content across devices (mobile/desktop) with unique IDs for retrieval and viewing (`Clipboard.jsx`).
- **Real-Time Collaboration**: Collaborate in real-time coding rooms at `/codelab` with shareable room IDs (e.g., `/codelab?room=ABC123`), featuring:
  - Real-time code editing (`CodeLab.jsx`).
  - Text and audio chat (`Chat.jsx`, `AudioChat.jsx`).
  - Version history for code snapshots (`VersionHistoryModal.jsx`).
  - Room creation and joining (`CreateRoomForm.jsx`, `JoinRoomForm.jsx`).
  - Member and settings management for room creators (`ManageMembersModal.jsx`, `RoomSettingsModal.jsx`).
- **Customizable Themes**: Choose between `dark`, `orange`, and `green` themes, persisted in `localStorage` for a consistent user experience.
- **Authentication**: Firebase Authentication for user login, enabling custom URLs, unlisted pastes, expiration dates, and advanced features like dashboard and clipboard (`AuthPrompt.jsx`).
- **Syntax Highlighting**: Powered by `react-syntax-highlighter` for various programming languages with a clean, modern UI (`CodeBlock.jsx`).
- **Responsive Design**: Mobile-friendly layout with animations via Framer Motion.
- **Error Handling**: Robust handling for expired pastes, password prompts, WebRTC permissions, and execution errors (e.g., validating code execution languages).
- **Security**: Sensitive data (e.g., passwords, content) filtered from console logs in `PasteView.jsx` and secure Firebase rules for data access.

## Technologies Used

- **Frontend**: React, Vite, React Router, Tailwind CSS, Lucide React, Framer Motion, React Syntax Highlighter
- **Backend**: Node.js (hosted at `https://pastejetbackend.onrender.com`) with Piston API for code execution in CodeLab
- **Database & Auth**: Firebase Firestore and Authentication
- **Deployment**: Vercel for frontend, Render for backend
- **Others**: Axios for API calls, UUID for unique IDs, `localStorage` for theme persistence, Firebase Hooks for real-time data, WebRTC for audio chat

## File Structure

```
pastejetfrontend/
├── public/
│   ├── favicon.png
│   ├── apple-touch-icon.png
│   └── pastejet-og-image.png
├── src/
│   ├── components/
│   │   ├── Layout.jsx        # App layout with theme persistence and navigation
│   │   ├── Login.jsx         # User login component
│   │   ├── CodeBlock.jsx     # Syntax highlighting component
│   │   └── ui/              # Shadcn UI components (Button, Input, Card, etc.)
│   ├── pages/
│   │   ├── Home.jsx         # Paste creation page
│   │   ├── PasteView.jsx    # Paste viewing page
│   │   ├── Dashboard.jsx    # User dashboard for pastes and profile
│   │   ├── Clipboard.jsx    # Clipboard syncing page
│   │   └── lab/         # Collaborative coding components
│   │       ├── CodeLab.jsx  # Main CodeLab page
│   │       ├── Chat.jsx     # Chat interface
│   │       ├── ActiveRooms.jsx # List of active rooms
│   │       ├── Header.jsx   # Room header with actions
│   │       ├── VersionHistoryModal.jsx # Version history modal
│   │       ├── AuthPrompt.jsx # Login prompt for unauthenticated users
│   │       ├── JoinRoomForm.jsx # Form to join rooms
│   │       ├── RoomSettingsModal.jsx # Room settings modal
│   │       ├── AudioChat.jsx # Audio chat feature
│   │       ├── CreateRoomForm.jsx # Form to create rooms
│   │       ├── ManageMembersModal.jsx # Manage room members modal
│   ├── App.jsx              # Main app with themed loading screen
│   ├── firebase.js          # Firebase configuration
│   ├── index.css            # Tailwind CSS setup
│   ├── CodeLab.module.css   # Custom CSS for CodeLab (e.g., scrollbar hiding)
│   └── main.jsx             # Entry point
├── .env                     # Environment variables (Firebase config)
├── vercel.json              # Vercel routing configuration
├── postcss.config.js        # PostCSS config for Tailwind
├── tailwind.config.js       # Tailwind CSS configuration
├── package.json             # Dependencies and scripts
├── package-lock.json        # Locked dependencies
└── README.markdown           # Project documentation
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore and Authentication enabled
- Vercel CLI (for deployment)
- GitHub repository for version control

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/pastejetfrontend.git
   cd pastejetfrontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the root directory:
     ```
     REACT_APP_FIREBASE_API_KEY=your-api-key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
     REACT_APP_FIREBASE_PROJECT_ID=your-project-id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     REACT_APP_FIREBASE_APP_ID=your-app-id
     ```
   - Obtain these values from your Firebase project console.

4. **Run Locally**:
   ```bash
   npm run dev
   ```
   - Open `http://localhost:5173` to view the app.
   - Test paste creation, viewing, dashboard, clipboard syncing, and `/codelab` collaboration with room IDs (e.g., `/codelab?room=ABC123`).

5. **Build for Production**:
   ```bash
   npm run build
   ```
   - Outputs to the `dist/` folder.

## Deployment

### Vercel
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```
   - Set Build Command: `npm run build`
   - Set Output Directory: `dist`
   - Add Firebase environment variables in Vercel dashboard.

3. **Verify Routing**:
   - Ensure `vercel.json` includes:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/" }]
     }
     ```
   - This handles client-side routing for paths like `/codelab`, `/view/:id`, `/dashboard`, and `/clipboard`.

### Backend
- The backend is hosted at `https://pastejetbackend.onrender.com`.
- Ensure CORS is configured:
  ```javascript
  app.use(cors({ origin: 'https://pastejet.vercel.app' }));
  ```
- Test code execution:
  ```bash
  curl -X POST https://pastejetbackend.onrender.com/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.10.0","code":"print(\"hello\")","input":""}'
  ```

## Firebase Configuration

- **Firestore Rules**:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /pastes/{pasteId} {
        allow read: if true;
        allow create: if request.resource.data.visibility == "public" && request.resource.data.created_by == "anonymous";
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && resource.data.created_by == request.auth.uid;
      }
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /clipboards/{clipboardId} {
        allow read: if true;
        allow create: if true;
        allow update, delete: if request.auth != null && resource.data.created_by == request.auth.uid;
      }
      match /rooms/{roomId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.resource.data.created_by == request.auth.token.email;
        allow update: if request.auth != null;
        match /messages/{messageId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null;
        }
        match /members/{memberId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && memberId == request.auth.token.email;
          allow delete: if request.auth != null && get(/databases/$(database)/documents/rooms/$(roomId)).data.created_by == request.auth.token.email;
        }
        match /presence/{userId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && request.auth.token.email == userId;
          allow delete: if request.auth != null && request.auth.token.email == userId;
        }
        match /cursors/{userId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && request.auth.token.email == userId;
          allow delete: if request.auth != null && request.auth.token.email == userId;
        }
        match /execution_results/{executionId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null;
        }
        match /version_history/{versionId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && get(/databases/$(database)/documents/rooms/$(roomId)).data.created_by == request.auth.token.email;
        }
      }
    }
  }
  ```
- **Indexes**: Enable indexing for clipboards (created_by, created_date, __name__) and pastes (custom_url) in Firebase console.
- **Authentication**: Enable Email/Password and optionally Google/GitHub providers in Firebase console.

## Key Fixes

- **404 Not Found on Routes**: Fixed by `vercel.json` rewrites to route all paths to `index.html` for client-side routing.
- **Blank Screen on Load**: Addressed by optimizing `App.jsx` to handle Firebase Authentication's asynchronous behavior and ensuring themed loading spinners.
- **WebRTC Errors in CodeLab**: Fixed by updating Firebase rules for WebRTC signaling and serializing `RTCIceCandidate` objects in `AudioChat.jsx`.
- **ReferenceError: print is not defined**: Handled by validating language-specific code execution (e.g., `print` for Python, `console.log` for JavaScript) in CodeLab.
- **Theme Persistence**: Themes (`dark`, `orange`, `green`) are saved in `localStorage` in `Layout.jsx` and applied to the loading screen in `App.jsx`.
- **Security**: Sensitive data (passwords, content) filtered from console logs in `PasteView.jsx`.
- **Scroll-to-Top**: Implemented in `Home.jsx` after paste creation for better UX.
- **Error Boundaries**: Added in `Clipboard.jsx` for robust error handling.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature-name"`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Contact

For issues or feature requests, open a GitHub issue or contact the PasteJet team at [your-email@example.com](mailto:your-email@example.com).