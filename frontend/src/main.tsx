import "./index.css";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./routes/Login";
import Register from "./routes/Register";
import Gate from "./routes/Gate";
import List from "./routes/List";
import Settings from "./routes/Settings";
import InviteAccept from "./routes/InviteAccept";
import Archive from "./routes/Archive";
import Invitations from "./routes/Invitations";


const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Gate /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/gate", element: <Gate /> },
      { path: "/app", element: <List /> },
      { path: "/settings", element: <Settings /> },
      { path: "/archive", element: <Archive /> },
      { path: "/invites", element: <Invitations /> },
      { path: "/invite/:token", element: <InviteAccept /> }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
