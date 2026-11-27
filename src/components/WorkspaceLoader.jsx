import "./WorkspaceLoader.css";

export default function WorkspaceLoader() {
  return (
    <div className="workspace-loader" role="status" aria-label="Loading workspace">
      <span className="workspace-loader-ring" aria-hidden="true" />
      <span className="workspace-loader-label">Loading workspace</span>
    </div>
  );
}
