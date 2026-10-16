export default function TaskSkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="task-card skeleton" aria-hidden="true">
      <span className="sk sk-check" />
      <div className="task-body">
        <span className="sk sk-title" />
        <span className="sk sk-line" />
        <span className="sk sk-meta" />
      </div>
    </div>
  ));
}
