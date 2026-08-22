import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Shell";

import SubjectsPage from "./pages/SubjectsPage";
import EventsPage from "./pages/EventsPage";
import TeachersPage from "./pages/TeachersPage";
import ClassesPage from "./pages/ClassesPage";

// import SchedulePage from "./pages/SchedulePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "resources/Subjects", element: <SubjectsPage /> },
      { path: "resources/Events", element: <EventsPage /> },
      { path: "resources/Teachers", element: <TeachersPage /> },
      { path: "resources/Classes", element: <ClassesPage /> },

      // { path: "schedule", element: <SchedulePage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
