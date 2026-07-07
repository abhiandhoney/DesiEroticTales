interface ResultsMetaProps {
  showing: number;
  total: number;
  label?: string;
}

export default function ResultsMeta({ showing, total, label = 'stories' }: ResultsMetaProps) {
  if (total === 0) return null;
  return (
    <p className="results-meta">
      Showing {showing} of {total} {label}
    </p>
  );
}