import { lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import App from "./App";
import { StoreProvider } from "./commerce/StoreContext";
import Seo from "./commerce/Seo";
import WorkspaceLoader from "./components/WorkspaceLoader";
import { preview } from "./shared/api";
const Admin = lazy(() => import("./admin/AdminApp"));
export default function Root() {
  const { pathname } = useLocation();
  return pathname.startsWith("/admin") ? (
    <Suspense fallback={<WorkspaceLoader />}>
      <Admin />
    </Suspense>
  ) : (
    <StoreProvider>
      <Seo />
      <App />
      {preview && (
        <div className="preview-note">
          Preview · Sample data<Link to="/admin">Open CMS ↗</Link>
        </div>
      )}
    </StoreProvider>
  );
}
