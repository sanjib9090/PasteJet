# PasteJet

PasteJet is a real-time collaborative coding and paste-sharing platform built with React, Vite, Firebase, and Tailwind CSS. Users can create, share, and collaborate on code snippets or text pastes, with features like syntax highlighting, real-time collaboration, and customizable themes. The application supports public, unlisted, and password-protected pastes, with optional expiration dates and custom URLs for logged-in users.

Deployed at: [https://pastejet.vercel.app](https://pastejet.vercel.app)

## Features

- **Paste Creation**: Create code or text pastes with support for multiple languages (e.g., JavaScript, Python, Java, C++).
- **Real-Time Collaboration**: Collaborate in real-time coding rooms at `/codelab` with shareable room IDs (e.g., `/codelab?room=ABC123`).
- **Customizable Themes**: Choose between `dark`, `orange`, and `green` themes, persisted in `localStorage` for a consistent user experience.
- **Authentication**: Firebase Authentication for user login, enabling custom URLs, unlisted pastes, and expiration dates.
- **Syntax Highlighting**: Supports various programming languages with a clean, modern UI.
- **Responsive Design**: Mobile-friendly layout with a bottom navigation bar for smaller screens.
- **Scroll-to-Top**: Automatically scrolls to the top after creating a paste, ensuring the success message is visible.
- **Error Handling**: Prevents issues like `ReferenceError: print is not defined` by validating code execution languages.

## Technologies Used

- **Frontend**: React, Vite, React Router, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Node.js (hosted at `https://pastejetbackend.onrender.com`) with Piston API for code execution
- **Database & Auth**: Firebase Firestore and Authentication
- **Deployment**: Vercel for frontend, Render for backend
- **Others**: Axios for API calls, `localStorage` for theme persistence

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
│   │   └── ui/              # Shadcn UI components (Button, Input, Card, etc.)
│   ├── pages/
│   │   ├── Home.jsx         # Paste creation with scroll-to-top
│   │   ├── CodeLab.jsx      # Real-time collaborative coding
│   │   ├── PasteView.jsx    # View individual pastes
│   │   ├── Dashboard.jsx    # User paste dashboard
│   │   └── Clipboard.jsx    # Clipboard syncing
│   ├── App.jsx              # Main app with themed loading screen
│   ├── firebase.js          # Firebase configuration
│   ├── index.css            # Tailwind CSS setup
│   └── main.jsx             # Entry point
├── .env                     # Environment variables (Firebase config)
├── vercel.json              # Vercel routing configuration
├── package.json             # Dependencies and scripts
└── README.md                # Project documentation
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
   - Test paste creation, theme switching, and `/codelab` collaboration.

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
       "version": 2,
       "rewrites": [
         { "source": "/(.*)", "destination": "/index.html" }
       ],
       "cleanUrls": true,
       "trailingSlash": false,
       "builds": [
         {
           "src": "package.json",
           "use": "@vercel/static-build",
           "config": { "distDir": "dist" }
         }
       ]
     }
     ```
   - This fixes `404 Not Found` errors on routes like `/codelab`.

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
      // Allow anyone to read pastes
      allow read: if true;
      // Allow anonymous and authenticated users to create public pastes
      allow create: if request.resource.data.visibility == "public" && request.resource.data.created_by == "anonymous";
      // Allow authenticated users to create any paste
      allow create: if request.auth != null;
      // Allow update/delete only by the paste's creator (authenticated users only)
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
        // Allow users to add themselves to the members subcollection
        allow write: if request.auth != null && memberId == request.auth.token.email;
        // Allow the room creator to remove members
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
- **for clipboard**: Enable indexing clipboards	
created_by
created_date
__name__
Collection in Firebase console.

- **Authentication**: Enable Email/Password provider in Firebase console.

## Key Fixes

- **404 Not Found on `/codelab`**: Fixed by `vercel.json` rewrites to route all paths to `index.html` for client-side routing.
- **ReferenceError: print is not defined**: Handled in `CodeLab.jsx` by validating language-specific code execution (e.g., `print` for Python, `console.log` for JavaScript).
- **Theme Persistence**: Themes (`dark`, `orange`, `green`) are saved in `localStorage` in `Layout.jsx` and applied to the loading screen in `App.jsx`.
- **Scroll-to-Top**: `Home.jsx` scrolls to the top after paste creation for better UX.

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